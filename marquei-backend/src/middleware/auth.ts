import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth middleware - Token received:', token ? 'YES' : 'NO');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação não fornecido' 
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('Using JWT_SECRET for verification:', jwtSecret.substring(0, 10) + '...');
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('Token decoded:', { userId: decoded.userId, role: decoded.role });
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    console.log('User found:', user ? 'YES' : 'NO', user ? `Role: ${user.role}` : '');

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    req.user = {
      ...user,
      phone: user.phone || undefined,
      role: user.role
    };
    console.log('User attached to request:', req.user.role);
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(403).json({ 
      success: false, 
      error: 'Token inválido ou expirado' 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Permissão negada' 
      });
    }

    next();
  };
};
