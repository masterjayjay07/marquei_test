import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const response: ApiResponse<typeof services> = {
      success: true,
      data: services
    };
    res.json(response);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      });
    }

    const response: ApiResponse<typeof service> = {
      success: true,
      data: service
    };
    res.json(response);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const { name, duration, price, description } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({
        success: false,
        error: 'Nome, duração e preço são obrigatórios'
      });
    }

    const newService = await prisma.service.create({
      data: {
        name,
        duration: parseInt(duration),
        price: parseFloat(price),
        description
      }
    });

    const response: ApiResponse<typeof newService> = {
      success: true,
      data: newService,
      message: 'Serviço criado com sucesso'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name, duration, price, description } = req.body;

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(duration && { duration: parseInt(duration) }),
        ...(price && { price: parseFloat(price) }),
        ...(description !== undefined && { description })
      }
    });

    const response: ApiResponse<typeof updatedService> = {
      success: true,
      data: updatedService,
      message: 'Serviço atualizado com sucesso'
    };
    res.json(response);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    await prisma.service.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Serviço excluído com sucesso'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
