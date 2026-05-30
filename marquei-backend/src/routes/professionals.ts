import express from 'express';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Buscando profissionais...');
    const professionals = await prisma.professional.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        professionalServices: {
          select: {
            serviceId: true
          }
        }
      }
    });

    const professionalsWithServices = professionals.map(prof => ({
      ...prof,
      services: prof.professionalServices.map(ps => ps.serviceId)
    }));

    console.log('Profissionais encontrados:', professionals.length);
    res.json({
      success: true,
      data: professionalsWithServices
    });
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
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
        },
        professionalServices: {
          select: {
            serviceId: true
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

    const professionalWithServices = {
      ...professional,
      services: professional.professionalServices.map(ps => ps.serviceId)
    };

    res.json({
      success: true,
      data: professionalWithServices
    });
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'PROFESSIONAL'
      }
    });

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
    console.error('Erro ao criar profissional:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
