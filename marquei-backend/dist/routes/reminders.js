"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const notificationService_1 = require("../services/notificationService");
const router = express_1.default.Router();
router.post('/process', async (req, res) => {
    try {
        const now = new Date();
        const upcomingAppointments = await prisma_1.prisma.appointment.findMany({
            where: {
                status: 'SCHEDULED'
            },
            include: {
                client: {
                    include: {
                        user: true
                    }
                },
                professional: {
                    include: {
                        user: true
                    }
                },
                service: true
            }
        });
        let sentCount = 0;
        for (const appointment of upcomingAppointments) {
            const appointmentDate = new Date(appointment.date);
            const year = appointmentDate.getUTCFullYear();
            const month = appointmentDate.getUTCMonth();
            const day = appointmentDate.getUTCDate();
            const [hours, minutes] = appointment.startTime.split(':').map(Number);
            const appointmentDateTime = new Date(year, month, day, hours, minutes, 0, 0);
            const timeUntilAppointment = appointmentDateTime.getTime() - now.getTime();
            const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);
            if (hoursUntilAppointment > 24 || hoursUntilAppointment < 0) {
                continue;
            }
            console.log(`Agendamento ${appointment.id} em ${hoursUntilAppointment.toFixed(2)}h - enviando lembrete`);
            const existingUnreadReminder = await prisma_1.prisma.notification.findFirst({
                where: {
                    appointmentId: appointment.id,
                    type: 'APPOINTMENT_REMINDER',
                    read: false
                }
            });
            if (existingUnreadReminder) {
                continue;
            }
            const existingReminderToday = await prisma_1.prisma.notification.findFirst({
                where: {
                    appointmentId: appointment.id,
                    type: 'APPOINTMENT_REMINDER',
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });
            if (existingReminderToday) {
                continue;
            }
            const appointmentDateStr = new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const appointmentDetails = `${appointment.service.name} em ${appointmentDateStr} às ${appointment.startTime}`;
            const clientUser = appointment.client.user;
            const professionalUser = appointment.professional.user;
            if (clientUser && professionalUser) {
                notificationService_1.NotificationService.notifyAppointmentReminder(appointment.id, clientUser.id, professionalUser.id, appointmentDetails);
                sentCount++;
            }
        }
        res.json({
            success: true,
            message: `${sentCount} lembretes enviados`,
            data: {
                sentCount,
                totalChecked: upcomingAppointments.length
            }
        });
    }
    catch (error) {
        console.error('Process reminders error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar lembretes'
        });
    }
});
exports.default = router;
