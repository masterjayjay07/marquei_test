"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = require("../lib/prisma");
class NotificationService {
    static async createNotification(params) {
        try {
            if (params.appointmentId) {
                const existingNotification = await prisma_1.prisma.notification.findFirst({
                    where: {
                        userId: params.userId,
                        appointmentId: params.appointmentId,
                        type: params.type
                    }
                });
                if (existingNotification) {
                    console.log(`Notificação duplicada evitada: ${params.type} para appointment ${params.appointmentId}`);
                    return;
                }
            }
            await prisma_1.prisma.notification.create({
                data: {
                    userId: params.userId,
                    appointmentId: params.appointmentId,
                    title: params.title,
                    message: params.message,
                    type: params.type,
                    read: false
                }
            });
            console.log(`Notificação criada: ${params.type} para usuário ${params.userId}`);
        }
        catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }
    static createNotificationAsync(params) {
        setImmediate(() => {
            this.createNotification(params).catch(error => {
                console.error('Erro ao criar notificação assíncrona:', error);
            });
        });
    }
    static notifyAppointmentConfirmed(appointmentId, clientUserId, professionalUserId, appointmentDetails) {
        this.createNotificationAsync({
            userId: clientUserId,
            appointmentId,
            title: 'Agendamento Confirmado',
            message: `Seu agendamento foi confirmado: ${appointmentDetails}`,
            type: 'APPOINTMENT_CONFIRMED'
        });
        this.createNotificationAsync({
            userId: professionalUserId,
            appointmentId,
            title: 'Novo Agendamento',
            message: `Novo agendamento confirmado: ${appointmentDetails}`,
            type: 'APPOINTMENT_CONFIRMED'
        });
    }
    static notifyAppointmentCancelled(appointmentId, clientUserId, professionalUserId, appointmentDetails) {
        this.createNotificationAsync({
            userId: clientUserId,
            appointmentId,
            title: 'Agendamento Cancelado',
            message: `Seu agendamento foi cancelado: ${appointmentDetails}`,
            type: 'APPOINTMENT_CANCELLED'
        });
        this.createNotificationAsync({
            userId: professionalUserId,
            appointmentId,
            title: 'Agendamento Cancelado',
            message: `Agendamento cancelado: ${appointmentDetails}`,
            type: 'APPOINTMENT_CANCELLED'
        });
    }
    static notifyAppointmentRescheduled(appointmentId, clientUserId, professionalUserId, appointmentDetails) {
        this.createNotificationAsync({
            userId: clientUserId,
            appointmentId,
            title: 'Agendamento Remarcado',
            message: `Seu agendamento foi remarcado: ${appointmentDetails}`,
            type: 'APPOINTMENT_RESCHEDULED'
        });
        this.createNotificationAsync({
            userId: professionalUserId,
            appointmentId,
            title: 'Agendamento Remarcado',
            message: `Agendamento remarcado: ${appointmentDetails}`,
            type: 'APPOINTMENT_RESCHEDULED'
        });
    }
    static notifyAppointmentReminder(appointmentId, clientUserId, professionalUserId, appointmentDetails) {
        this.createNotificationAsync({
            userId: clientUserId,
            appointmentId,
            title: 'Lembrete de Agendamento',
            message: `Lembrete: Você tem um agendamento amanhã - ${appointmentDetails}`,
            type: 'APPOINTMENT_REMINDER'
        });
        this.createNotificationAsync({
            userId: professionalUserId,
            appointmentId,
            title: 'Lembrete de Agendamento',
            message: `Lembrete: Agendamento amanhã - ${appointmentDetails}`,
            type: 'APPOINTMENT_REMINDER'
        });
    }
}
exports.NotificationService = NotificationService;
