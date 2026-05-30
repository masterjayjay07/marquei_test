import express from 'express';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

console.log('Rotas de clientes carregadas');

router.get('/', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  console.log('GET /clients - Rota acessada');
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado. Por favor, cadastre-se primeiro.'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
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
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nome e email são obrigatórios'
      });
    }

    let userId = null;

    if (password) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado como usuário'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CLIENT',
          phone: phone || null
        }
      });
      userId = user.id;
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        userId
      }
    });

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Cliente criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
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
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
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
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
