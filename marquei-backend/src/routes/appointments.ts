import express from 'express';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { NotificationService } from '../services/notificationService';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { clientId, professionalId, serviceId, status, startDate, endDate, clientName } = req.query;
    
    let whereClause: any = {};

    if (req.user!.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        });
      }
      
      whereClause.clientId = client.id;
    }
    else if (req.user!.role === 'PROFESSIONAL') {
      const professional = await prisma.professional.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (professional) {
        whereClause.professionalId = professional.id;
      }
    }

    // Aplicar filtros adicionais
    if (clientId) {
      whereClause.clientId = clientId as string;
    }
    if (clientName) {
      whereClause.client = {
        name: {
          contains: clientName as string,
          mode: 'insensitive'
        }
      };
    }
    if (professionalId) {
      whereClause.professionalId = professionalId as string;
    }
    if (serviceId) {
      whereClause.serviceId = serviceId as string;
    }
    if (status) {
      whereClause.status = status as string;
    }
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string + 'T00:00:00.000Z');
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate as string + 'T00:00:00.000Z');
      }
    }

    const appointments = await prisma.appointment.findMany({
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
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const appointment = await prisma.appointment.findUnique({
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
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { clientId, professionalId, serviceId, date, startTime, endTime, notes } = req.body;

    if (!clientId || !professionalId || !serviceId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }

    // Validar horário comercial (8h às 18h)
    const [hour] = startTime.split(':').map(Number);
    if (hour < 8 || hour >= 18) {
      return res.status(400).json({
        success: false,
        error: 'Agendamentos só podem ser feitos entre 8h e 18h'
      });
    }

    let calculatedEndTime = endTime;
    if (!calculatedEndTime) {
      const service = await prisma.service.findUnique({
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

    // Usar transação para evitar double-booking
    const newAppointment = await prisma.$transaction(async (tx) => {
      // Verificar se já existe agendamento no mesmo horário
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

      // Criar agendamento
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

    // Enviar notificações de forma assíncrona (não bloqueia a resposta)
    const appointmentDate = new Date(newAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const appointmentDetails = `${newAppointment.service.name} em ${appointmentDate} às ${newAppointment.startTime}`;
    
    const clientUser = await prisma.user.findFirst({
      where: { client: { some: { id: newAppointment.clientId } } }
    });
    
    const professionalUser = await prisma.user.findUnique({
      where: { id: newAppointment.professional.userId }
    });

    if (clientUser && professionalUser) {
      NotificationService.notifyAppointmentConfirmed(
        newAppointment.id,
        clientUser.id,
        professionalUser.id,
        appointmentDetails
      );
    }

    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Agendamento criado com sucesso'
    });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { date, startTime, endTime, status, notes } = req.body;

    // Se for cliente tentando cancelar ou remarcar
    if (req.user!.role === 'CLIENT' && (status === 'CANCELLED' || date || startTime)) {
      const appointment = await prisma.appointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Agendamento não encontrado'
        });
      }

      // Verificar antecedência de 4 horas
      // A data no banco está em UTC (YYYY-MM-DD), mas o horário é local
      const appointmentDate = new Date(appointment.date);
      const year = appointmentDate.getUTCFullYear();
      const month = appointmentDate.getUTCMonth();
      const day = appointmentDate.getUTCDate();
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      
      // Criar data/hora local do agendamento
      const appointmentDateTime = new Date(year, month, day, hours, minutes, 0, 0);

      const now = new Date();
      const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      console.log('Backend - Appointment:', appointmentDateTime, 'Now:', now, 'Diff hours:', hoursDifference);

      if (hoursDifference < 4) {
        return res.status(400).json({
          success: false,
          error: 'Cancelamento ou remarcação deve ser feito com no mínimo 4 horas de antecedência'
        });
      }
    }

    const updatedAppointment = await prisma.appointment.update({
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

    // Enviar notificações de forma assíncrona
    const appointmentDate = new Date(updatedAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const appointmentDetails = `${updatedAppointment.service.name} em ${appointmentDate} às ${updatedAppointment.startTime}`;
    
    const clientUser = await prisma.user.findFirst({
      where: { client: { some: { id: updatedAppointment.clientId } } }
    });
    
    const professionalUser = await prisma.user.findUnique({
      where: { id: updatedAppointment.professional.userId }
    });

    if (clientUser && professionalUser) {
      if (status === 'CANCELLED') {
        NotificationService.notifyAppointmentCancelled(
          updatedAppointment.id,
          clientUser.id,
          professionalUser.id,
          appointmentDetails
        );
      } else if (date || startTime) {
        NotificationService.notifyAppointmentRescheduled(
          updatedAppointment.id,
          clientUser.id,
          professionalUser.id,
          appointmentDetails
        );
      }
    }

    res.json({
      success: true,
      data: updatedAppointment,
      message: 'Agendamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    await prisma.appointment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Agendamento excluído com sucesso'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
