import express from 'express';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let whereClause = {};

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
      
      whereClause = { clientId: client.id };
    }
    else if (req.user!.role === 'PROFESSIONAL') {
      const professional = await prisma.professional.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (professional) {
        whereClause = { professionalId: professional.id };
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

    const newAppointment = await prisma.appointment.create({
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

    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Agendamento criado com sucesso'
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { date, startTime, endTime, status, notes } = req.body;

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
