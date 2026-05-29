import express from 'express';
import { prisma } from '../lib/prisma';
import { NotificationService } from '../services/notificationService';

const router = express.Router();

router.post('/process', async (req, res) => {
  try {
    const now = new Date();

    const upcomingAppointments = await prisma.appointment.findMany({
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

      const existingUnreadReminder = await prisma.notification.findFirst({
        where: {
          appointmentId: appointment.id,
          type: 'APPOINTMENT_REMINDER' as any,
          read: false
        }
      } as any);

      if (existingUnreadReminder) {
        continue;
      }

      const existingReminderToday = await prisma.notification.findFirst({
        where: {
          appointmentId: appointment.id,
          type: 'APPOINTMENT_REMINDER' as any,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      } as any);

      if (existingReminderToday) {
        continue;
      }

      const appointmentDateStr = new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      const appointmentDetails = `${appointment.service.name} em ${appointmentDateStr} às ${appointment.startTime}`;

      const clientUser = appointment.client.user;
      const professionalUser = appointment.professional.user;

      if (clientUser && professionalUser) {
        NotificationService.notifyAppointmentReminder(
          appointment.id,
          clientUser.id,
          professionalUser.id,
          appointmentDetails
        );
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
  } catch (error) {
    console.error('Process reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar lembretes'
    });
  }
});

export default router;
