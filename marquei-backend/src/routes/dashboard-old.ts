import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
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

router.get('/appointments-by-date', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Data inicial e final são obrigatórias'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const appointments = db.appointments.filter(a => 
      a.date >= start && a.date <= end
    );

    const appointmentsByDate: Record<string, any[]> = {};
    appointments.forEach(appointment => {
      const dateKey = appointment.date.toISOString().split('T')[0];
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(appointment);
    });

    const response: ApiResponse<Record<string, any[]>> = {
      success: true,
      data: appointmentsByDate
    };
    res.json(response);
  } catch (error) {
    console.error('Get appointments by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/professional-performance', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const appointments = db.appointments;
    const professionals = db.professionals;
    const users = db.users;

    const professionalPerformance = professionals.map(professional => {
      const professionalAppointments = appointments.filter(a => a.professionalId === professional.id);
      const completedAppointments = professionalAppointments.filter(a => a.status === 'completed');
      const noShowAppointments = professionalAppointments.filter(a => a.status === 'no_show');
      
      const user = users.find(u => u.id === professional.userId);
      
      return {
        id: professional.id,
        name: user?.name || 'Profissional',
        email: user?.email || '',
        totalAppointments: professionalAppointments.length,
        completedAppointments: completedAppointments.length,
        noShowAppointments: noShowAppointments.length,
        occupancyRate: professionalAppointments.length > 0 
          ? (completedAppointments.length / professionalAppointments.length) * 100 
          : 0,
        revenue: completedAppointments.reduce((total, appointment) => {
          const service = db.services.find(s => s.id === appointment.serviceId);
          return total + (service?.price || 0);
        }, 0)
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: professionalPerformance
    };
    res.json(response);
  } catch (error) {
    console.error('Get professional performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
