import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

console.log('Rotas de autenticacao carregadas');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    console.log('Tentativa de login:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Faltando email ou senha');
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    console.log('Buscando usuario:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('Usuario encontrado:', user ? 'sim' : 'nao');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos'
      });
    }

    console.log('Comparando senhas...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Senha valida:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos'
      });
    }

    console.log('Gerando token...');
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    console.log('Usando JWT_SECRET:', jwtSecret.substring(0, 10) + '...');
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret
    );

    console.log('Token gerado com sucesso');

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
      message: 'Login realizado com sucesso',
      token
    });
  } catch (error) {
    console.error('Erro de login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      data: req.user!
    });
  } catch (error) {
    console.error('Erro ao buscar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro de logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
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

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        userId: user.id
      }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        client
      },
      message: 'Cadastro realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro de registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao realizar cadastro'
    });
  }
});

export default router;
