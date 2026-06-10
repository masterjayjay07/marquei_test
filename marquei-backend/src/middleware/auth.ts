import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: User;
  body: any;
  params: any;
  query: any;
  file?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Token recebido:', token ? 'sim' : 'nao');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação não fornecido' 
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
    console.log('Usando JWT_SECRET:', jwtSecret.substring(0, 10) + '...');
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('Token decodificado:', { userId: decoded.userId, role: decoded.role });
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    console.log('Usuario encontrado:', user ? 'sim' : 'nao', user ? `Cargo: ${user.role}` : '');

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
    console.log('Usuario anexado na requisicao:', req.user.role);
    next();
  } catch (err) {
    console.error('Erro de autenticacao:', err);
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
