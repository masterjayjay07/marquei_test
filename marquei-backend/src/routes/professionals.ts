import express from 'express';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Fetching professionals...');
    const professionals = await prisma.professional.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Professionals found:', professionals.length);
    res.json({
      success: true,
      data: professionals
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profissional não encontrado'
      });
    }

    res.json({
      success: true,
      data: professional
    });
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { name, email, password, specialty } = req.body;

    if (!name || !email || !password || !specialty) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
    }

    // Criar usuário primeiro
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Em produção, criptografar a senha!
        role: 'PROFESSIONAL'
      }
    });

    // Criar profissional com workSchedule padrão
    const professional = await prisma.professional.create({
      data: {
        userId: user.id,
        workSchedule: {
          monday: { available: true, start: '09:00', end: '18:00' },
          tuesday: { available: true, start: '09:00', end: '18:00' },
          wednesday: { available: true, start: '09:00', end: '18:00' },
          thursday: { available: true, start: '09:00', end: '18:00' },
          friday: { available: true, start: '09:00', end: '18:00' },
          saturday: { available: false },
          sunday: { available: false }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Adicionar specialty nos dados de retorno (não salva no banco)
    const professionalWithSpecialty = {
      ...professional,
      specialty
    };

    res.status(201).json({
      success: true,
      data: professionalWithSpecialty,
      message: 'Profissional criado com sucesso'
    });
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
