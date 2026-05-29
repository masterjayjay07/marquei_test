import { prisma } from '../lib/prisma';

interface CreateNotificationParams {
  userId: string;
  appointmentId?: string;
  title: string;
  message: string;
  type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_RESCHEDULED' | 'SYSTEM_NOTIFICATION';
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      if (params.appointmentId) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: params.userId,
            appointmentId: params.appointmentId,
            type: params.type as any
          }
        } as any);

        if (existingNotification) {
          console.log(`Notificação duplicada evitada: ${params.type} para appointment ${params.appointmentId}`);
          return;
        }
      }

      await prisma.notification.create({
        data: {
          userId: params.userId,
          appointmentId: params.appointmentId,
          title: params.title,
          message: params.message,
          type: params.type as any,
          read: false
        }
      } as any);

      console.log(`Notificação criada: ${params.type} para usuário ${params.userId}`);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  }

  static createNotificationAsync(params: CreateNotificationParams): void {
    setImmediate(() => {
      this.createNotification(params).catch(error => {
        console.error('Erro ao criar notificação assíncrona:', error);
      });
    });
  }

  static notifyAppointmentConfirmed(appointmentId: string, clientUserId: string, professionalUserId: string, appointmentDetails: string): void {
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

  static notifyAppointmentCancelled(appointmentId: string, clientUserId: string, professionalUserId: string, appointmentDetails: string): void {
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

  static notifyAppointmentRescheduled(appointmentId: string, clientUserId: string, professionalUserId: string, appointmentDetails: string): void {
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

  static notifyAppointmentReminder(appointmentId: string, clientUserId: string, professionalUserId: string, appointmentDetails: string): void {
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
