import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Professional, WorkSchedule, TimeSlot } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const professionals = db.professionals.map(professional => {
      const user = db.users.find(u => u.id === professional.userId);
      return {
        ...professional,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : null
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: professionals
    };
    res.json(response);
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const professional = db.professionals.find(p => p.id === id);

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profissional não encontrado'
      });
    }

    const user = db.users.find(u => u.id === professional.userId);
    const professionalWithUser = {
      ...professional,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email
      } : null
    };

    const response: ApiResponse<any> = {
      success: true,
      data: professionalWithUser
    };
    res.json(response);
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { userId, services, workSchedule } = req.body;

    if (!userId || !services || !workSchedule) {
      return res.status(400).json({
        success: false,
        error: 'UserId, serviços e jornada de trabalho são obrigatórios'
      });
    }

    const user = db.users.find(u => u.id === userId && u.role === 'professional');
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Usuário profissional não encontrado'
      });
    }

    const newProfessional: Professional = {
      id: Date.now().toString(),
      userId,
      services,
      workSchedule: workSchedule as WorkSchedule,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.professionals.push(newProfessional);

    const response: ApiResponse<Professional> = {
      success: true,
      data: newProfessional,
      message: 'Profissional criado com sucesso'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { userId, services, workSchedule } = req.body;

    const professionalIndex = db.professionals.findIndex(p => p.id === id);

    if (professionalIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Profissional não encontrado'
      });
    }

    if (userId) {
      const user = db.users.find(u => u.id === userId && u.role === 'professional');
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Usuário profissional não encontrado'
        });
      }
    }

    const updatedProfessional: Professional = {
      ...db.professionals[professionalIndex],
      userId: userId || db.professionals[professionalIndex].userId,
      services: services || db.professionals[professionalIndex].services,
      workSchedule: workSchedule ? workSchedule as WorkSchedule : db.professionals[professionalIndex].workSchedule,
      updatedAt: new Date()
    };

    db.professionals[professionalIndex] = updatedProfessional;

    const response: ApiResponse<Professional> = {
      success: true,
      data: updatedProfessional,
      message: 'Profissional atualizado com sucesso'
    };
    res.json(response);
  } catch (error) {
    console.error('Update professional error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const professionalIndex = db.professionals.findIndex(p => p.id === id);

    if (professionalIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Profissional não encontrado'
      });
    }

    db.professionals.splice(professionalIndex, 1);

    res.json({
      success: true,
      message: 'Profissional excluído com sucesso'
    });
  } catch (error) {
    console.error('Delete professional error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
