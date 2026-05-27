import express from 'express';
import { Database } from '../database/database';
import { ApiResponse, Appointment } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { date, status } = req.query;
    let appointments = db.appointments;

    if (req.user?.role === 'professional') {
      appointments = appointments.filter(a => a.professionalId === req.user!.id);
    } else if (req.user?.role === 'client') {
      appointments = appointments.filter(a => a.clientId === req.user!.id);
    }

    if (date) {
      appointments = appointments.filter(a => 
        a.date.toISOString().split('T')[0] === date
      );
    }

    if (status) {
      appointments = appointments.filter(a => a.status === status);
    }

    const appointmentsWithDetails = appointments.map(appointment => {
      const client = db.users.find(u => u.id === appointment.clientId);
      const professional = db.users.find(u => u.id === appointment.professionalId);
      const service = db.services.find(s => s.id === appointment.serviceId);

      return {
        ...appointment,
        client: client ? {
          id: client.id,
          name: client.name,
          email: client.email
        } : null,
        professional: professional ? {
          id: professional.id,
          name: professional.name,
          email: professional.email
        } : null,
        service: service ? {
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: service.price
        } : null
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: appointmentsWithDetails
    };
    res.json(response);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const appointment = db.appointments.find(a => a.id === id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      });
    }

    if (req.user?.role === 'professional' && appointment.professionalId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Permissão negada'
      });
    }

    if (req.user?.role === 'client' && appointment.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Permissão negada'
      });
    }

    const client = db.users.find(u => u.id === appointment.clientId);
    const professional = db.users.find(u => u.id === appointment.professionalId);
    const service = db.services.find(s => s.id === appointment.serviceId);

    const appointmentWithDetails = {
      ...appointment,
      client: client ? {
        id: client.id,
        name: client.name,
        email: client.email
      } : null,
      professional: professional ? {
        id: professional.id,
        name: professional.name,
        email: professional.email
      } : null,
      service: service ? {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price
      } : null
    };

    const response: ApiResponse<any> = {
      success: true,
      data: appointmentWithDetails
    };
    res.json(response);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { clientId, professionalId, serviceId, date, startTime } = req.body;

    if (!clientId || !professionalId || !serviceId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
    }

    if (req.user?.role === 'client' && clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Você só pode agendar para si mesmo'
      });
    }

    const service = db.services.find(s => s.id === serviceId);
    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Serviço não encontrado'
      });
    }

    const professional = db.professionals.find(p => p.id === professionalId);
    if (!professional) {
      return res.status(400).json({
        success: false,
        error: 'Profissional não encontrado'
      });
    }

    if (!professional.services.includes(serviceId)) {
      return res.status(400).json({
        success: false,
        error: 'Este profissional não oferece este serviço'
      });
    }

    const appointmentDate = new Date(date);
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);
    const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

    const conflictingAppointment = db.appointments.find(a => 
      a.professionalId === professionalId &&
      a.date.toISOString().split('T')[0] === date &&
      a.status === 'scheduled' &&
      ((startTime >= a.startTime && startTime < a.endTime) ||
       (endTime > a.startTime && endTime <= a.endTime) ||
       (startTime <= a.startTime && endTime >= a.endTime))
    );

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        error: 'Horário não disponível'
      });
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientId,
      professionalId,
      serviceId,
      date: appointmentDate,
      startTime,
      endTime,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.appointments.push(newAppointment);

    const response: ApiResponse<Appointment> = {
      success: true,
      data: newAppointment,
      message: 'Agendamento criado com sucesso'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointmentIndex = db.appointments.findIndex(a => a.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      });
    }

    const appointment = db.appointments[appointmentIndex];

    if (req.user?.role === 'professional' && appointment.professionalId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Permissão negada'
      });
    }

    if (req.user?.role === 'client' && appointment.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Permissão negada'
      });
    }

    if (req.user?.role === 'professional' && status && !['completed', 'no_show'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Profissional só pode marcar como realizado ou no-show'
      });
    }

    if (req.user?.role === 'client' && status && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cliente só pode cancelar agendamento'
      });
    }

    const updatedAppointment: Appointment = {
      ...appointment,
      status: status || appointment.status,
      notes: notes !== undefined ? notes : appointment.notes,
      updatedAt: new Date()
    };

    db.appointments[appointmentIndex] = updatedAppointment;

    const response: ApiResponse<Appointment> = {
      success: true,
      data: updatedAppointment,
      message: 'Agendamento atualizado com sucesso'
    };
    res.json(response);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const appointmentIndex = db.appointments.findIndex(a => a.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      });
    }

    db.appointments.splice(appointmentIndex, 1);

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
