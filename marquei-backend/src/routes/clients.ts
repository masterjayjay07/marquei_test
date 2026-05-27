import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nome e email são obrigatórios'
      });
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null
      }
    });

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Cliente criado com sucesso'
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name, email, phone } = req.body;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone: phone || null })
      }
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente atualizado com sucesso'
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['manager']), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    await prisma.client.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
