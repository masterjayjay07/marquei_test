import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/slots', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { professionalId, serviceId, date } = req.query;

    if (!professionalId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        error: 'professionalId, serviceId e date são obrigatórios'
      });
    }

    const [professional, service] = await Promise.all([
      prisma.professional.findUnique({
        where: { id: professionalId as string }
      }),
      prisma.service.findUnique({
        where: { id: serviceId as string }
      })
    ]);

    if (!professional || !service) {
      return res.status(404).json({
        success: false,
        error: 'Profissional ou serviço não encontrado'
      });
    }

    const targetDate = new Date(date as string + 'T00:00:00.000Z');
    const dayOfWeek = targetDate.getUTCDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const workSchedule = professional.workSchedule as any;
    const daySchedule = workSchedule[dayName];

    if (!daySchedule || daySchedule.length === 0) {
      return res.json({
        success: true,
        data: {
          availableSlots: [],
          message: 'Profissional não trabalha neste dia'
        }
      });
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: professionalId as string,
        date: new Date(date as string + 'T00:00:00.000Z'),
        status: {
          in: ['SCHEDULED', 'COMPLETED']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    const availableSlots: string[] = [];
    const serviceDuration = service.duration;

    for (const period of daySchedule) {
      const startHour = parseInt(period.start.split(':')[0]);
      const startMinute = parseInt(period.start.split(':')[1]);
      const endHour = parseInt(period.end.split(':')[0]);
      const endMinute = parseInt(period.end.split(':')[1]);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const slotStartMinutes = currentHour * 60 + currentMinute;
        const slotEndMinutes = slotStartMinutes + serviceDuration;
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMinute = slotEndMinutes % 60;
        const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;

        const endTotalMinutes = endHour * 60 + endMinute;
        if (slotEndMinutes > endTotalMinutes) {
          break;
        }

        if (currentHour < 8 || currentHour >= 18) {
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
          }
          continue;
        }

        let isAvailable = true;
        for (const appointment of existingAppointments) {
          const appointmentStart = appointment.startTime;
          const appointmentEnd = appointment.endTime;

          if (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
          ) {
            isAvailable = false;
            break;
          }
        }

        if (isAvailable) {
          availableSlots.push(slotStart);
        }

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        availableSlots,
        serviceDuration,
        workSchedule: daySchedule
      }
    });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
