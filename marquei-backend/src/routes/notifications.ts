import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificacoes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/unread-count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Erro ao contar nao lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada'
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({
      success: true,
      data: updatedNotification
    });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/mark-all-read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
