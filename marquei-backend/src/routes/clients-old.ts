import express from 'express';
import { Database } from '../database/database';
import { ApiResponse, User } from '../types';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

router.get('/', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const clients = db.users.filter(u => u.role === 'client');
    const response: ApiResponse<User[]> = {
      success: true,
      data: clients
    };
    res.json(response);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/:id', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const client = db.users.find(u => u.id === id && u.role === 'client');

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    const response: ApiResponse<User> = {
      success: true,
      data: client
    };
    res.json(response);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nome e email são obrigatórios'
      });
    }

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
      });
    }

    const newClient: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      role: 'client',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.users.push(newClient);

    const response: ApiResponse<User> = {
      success: true,
      data: newClient,
      message: 'Cliente criado com sucesso'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const clientIndex = db.users.findIndex(u => u.id === id && u.role === 'client');

    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    if (email && email !== db.users[clientIndex].email) {
      const existingUser = db.users.find(u => u.email === email && u.id !== id);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado'
        });
      }
    }

    const updatedClient: User = {
      ...db.users[clientIndex],
      name: name || db.users[clientIndex].name,
      email: email || db.users[clientIndex].email,
      phone: phone !== undefined ? phone : db.users[clientIndex].phone,
      updatedAt: new Date()
    };

    db.users[clientIndex] = updatedClient;

    const response: ApiResponse<User> = {
      success: true,
      data: updatedClient,
      message: 'Cliente atualizado com sucesso'
    };
    res.json(response);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['manager']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const clientIndex = db.users.findIndex(u => u.id === id && u.role === 'client');

    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    db.users.splice(clientIndex, 1);

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
