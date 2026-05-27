import express from 'express';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        service: true,
        client: true,
        professional: true
      }
    });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;
    const scheduledAppointments = appointments.filter(a => a.status === 'SCHEDULED').length;

    const occupancyRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;

    const estimatedRevenue = appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((total, appointment) => {
        return total + (appointment.service?.price || 0);
      }, 0);

    const serviceCount: Record<string, number> = {};
    appointments.forEach(appointment => {
      if (appointment.status === 'COMPLETED') {
        serviceCount[appointment.serviceId] = (serviceCount[appointment.serviceId] || 0) + 1;
      }
    });

    const mostRequestedServices = appointments
      .map(appointment => ({
        id: appointment.service.id,
        name: appointment.service.name,
        duration: appointment.service.duration,
        price: appointment.service.price,
        count: serviceCount[appointment.serviceId] || 0
      }))
      .filter((service, index, self) => 
        index === self.findIndex(s => s.id === service.id)
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const appointmentsByStatus = {
      scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
      completed: completedAppointments,
      no_show: noShowAppointments,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length
    };

    res.json({
      success: true,
      data: {
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        noShowRate: Math.round(noShowRate * 100) / 100,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
        mostRequestedServices,
        appointmentsByStatus
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
