import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/services - Listar todos os serviços
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/services/:id - Buscar serviço por ID
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

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/services - Criar novo serviço
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
        description: description || null
      }
    });

    res.status(201).json({
      success: true,
      data: newService,
      message: 'Serviço criado com sucesso'
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/services/:id - Atualizar serviço
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
        ...(description !== undefined && { description: description || null })
      }
    });

    res.json({
      success: true,
      data: updatedService,
      message: 'Serviço atualizado com sucesso'
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/services/:id - Excluir serviço
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
