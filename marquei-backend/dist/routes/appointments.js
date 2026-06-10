"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const notificationService_1 = require("../services/notificationService");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId, professionalId, serviceId, status, startDate, endDate, clientName } = req.query;
        let whereClause = {};
        if (req.user.role === 'CLIENT') {
            const client = await prisma_1.prisma.client.findUnique({
                where: { userId: req.user.id }
            });
            if (!client) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado'
                });
            }
            whereClause.clientId = client.id;
        }
        else if (req.user.role === 'PROFESSIONAL') {
            const professional = await prisma_1.prisma.professional.findUnique({
                where: { userId: req.user.id }
            });
            if (professional) {
                whereClause.professionalId = professional.id;
            }
        }
        if (clientId) {
            whereClause.clientId = clientId;
        }
        if (clientName && !clientId) {
            whereClause.client = {
                name: {
                    contains: clientName,
                    mode: 'insensitive'
                }
            };
        }
        if (professionalId) {
            whereClause.professionalId = professionalId;
        }
        if (serviceId) {
            whereClause.serviceId = serviceId;
        }
        if (status) {
            whereClause.status = status;
        }
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                whereClause.date.gte = new Date(startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                whereClause.date.lte = new Date(endDate + 'T00:00:00.000Z');
            }
        }
        const appointments = await prisma_1.prisma.appointment.findMany({
            where: whereClause,
            include: {
                client: true,
                professional: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                service: true
            },
            orderBy: { date: 'desc' }
        });
        res.json({
            success: true,
            data: appointments
        });
    }
    catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const appointment = await prisma_1.prisma.appointment.findUnique({
            where: { id },
            include: {
                client: true,
                professional: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                service: true
            }
        });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Agendamento não encontrado'
            });
        }
        res.json({
            success: true,
            data: appointment
        });
    }
    catch (error) {
        console.error('Erro ao buscar agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId, professionalId, serviceId, date, startTime, endTime, notes } = req.body;
        if (!clientId || !professionalId || !serviceId || !date || !startTime) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos obrigatórios devem ser preenchidos'
            });
        }
        const [hour] = startTime.split(':').map(Number);
        if (hour < 8 || hour >= 18) {
            return res.status(400).json({
                success: false,
                error: 'Agendamentos só podem ser feitos entre 8h e 18h'
            });
        }
        let calculatedEndTime = endTime;
        if (!calculatedEndTime) {
            const service = await prisma_1.prisma.service.findUnique({
                where: { id: serviceId }
            });
            if (service) {
                const [hours, minutes] = startTime.split(':').map(Number);
                const startDate = new Date();
                startDate.setHours(hours, minutes, 0, 0);
                const endDate = new Date(startDate.getTime() + service.duration * 60000);
                calculatedEndTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
            }
        }
        const newAppointment = await prisma_1.prisma.$transaction(async (tx) => {
            const conflictingAppointment = await tx.appointment.findFirst({
                where: {
                    professionalId,
                    date: new Date(date + 'T00:00:00.000Z'),
                    status: {
                        in: ['SCHEDULED', 'COMPLETED']
                    },
                    OR: [
                        {
                            AND: [
                                { startTime: { lte: startTime } },
                                { endTime: { gt: startTime } }
                            ]
                        },
                        {
                            AND: [
                                { startTime: { lt: calculatedEndTime } },
                                { endTime: { gte: calculatedEndTime } }
                            ]
                        },
                        {
                            AND: [
                                { startTime: { gte: startTime } },
                                { endTime: { lte: calculatedEndTime } }
                            ]
                        }
                    ]
                }
            });
            if (conflictingAppointment) {
                throw new Error('Este horário já está ocupado');
            }
            return await tx.appointment.create({
                data: {
                    clientId,
                    professionalId,
                    serviceId,
                    date: new Date(date + 'T00:00:00.000Z'),
                    startTime,
                    endTime: calculatedEndTime,
                    notes: notes || null,
                    status: 'SCHEDULED'
                },
                include: {
                    client: true,
                    professional: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    service: true
                }
            });
        });
        const appointmentDate = new Date(newAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const appointmentDetails = `${newAppointment.service.name} em ${appointmentDate} às ${newAppointment.startTime}`;
        const clientUser = await prisma_1.prisma.user.findFirst({
            where: { client: { some: { id: newAppointment.clientId } } }
        });
        const professionalUser = await prisma_1.prisma.user.findUnique({
            where: { id: newAppointment.professional.userId }
        });
        if (clientUser && professionalUser) {
            notificationService_1.NotificationService.notifyAppointmentConfirmed(newAppointment.id, clientUser.id, professionalUser.id, appointmentDetails);
        }
        res.status(201).json({
            success: true,
            data: newAppointment,
            message: 'Agendamento criado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { date, startTime, endTime, status, notes } = req.body;
        if (req.user.role === 'CLIENT' && (status === 'CANCELLED' || date || startTime)) {
            const appointment = await prisma_1.prisma.appointment.findUnique({
                where: { id }
            });
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Agendamento não encontrado'
                });
            }
            const appointmentDate = new Date(appointment.date);
            const year = appointmentDate.getUTCFullYear();
            const month = appointmentDate.getUTCMonth();
            const day = appointmentDate.getUTCDate();
            const [hours, minutes] = appointment.startTime.split(':').map(Number);
            const appointmentDateTime = new Date(year, month, day, hours, minutes, 0, 0);
            const now = new Date();
            const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            console.log('Agendamento:', appointmentDateTime, 'Agora:', now, 'Diferenca horas:', hoursDifference);
            if (hoursDifference < 4) {
                return res.status(400).json({
                    success: false,
                    error: 'Cancelamento ou remarcação deve ser feito com no mínimo 4 horas de antecedência'
                });
            }
        }
        const updatedAppointment = await prisma_1.prisma.appointment.update({
            where: { id },
            data: {
                ...(date && { date: new Date(date + 'T00:00:00.000Z') }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
                ...(status && { status }),
                ...(notes !== undefined && { notes: notes || null })
            },
            include: {
                client: true,
                professional: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                service: true
            }
        });
        const appointmentDate = new Date(updatedAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const appointmentDetails = `${updatedAppointment.service.name} em ${appointmentDate} às ${updatedAppointment.startTime}`;
        const clientUser = await prisma_1.prisma.user.findFirst({
            where: { client: { some: { id: updatedAppointment.clientId } } }
        });
        const professionalUser = await prisma_1.prisma.user.findUnique({
            where: { id: updatedAppointment.professional.userId }
        });
        if (clientUser && professionalUser) {
            if (status === 'CANCELLED') {
                notificationService_1.NotificationService.notifyAppointmentCancelled(updatedAppointment.id, clientUser.id, professionalUser.id, appointmentDetails);
            }
            else if (date || startTime) {
                notificationService_1.NotificationService.notifyAppointmentRescheduled(updatedAppointment.id, clientUser.id, professionalUser.id, appointmentDetails);
            }
        }
        res.json({
            success: true,
            data: updatedAppointment,
            message: 'Agendamento atualizado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.appointment.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Agendamento excluído com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao deletar agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
