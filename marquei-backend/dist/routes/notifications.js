"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        const unreadCount = await prisma_1.prisma.notification.count({
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
    }
    catch (error) {
        console.error('Erro ao buscar notificacoes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/unread-count', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await prisma_1.prisma.notification.count({
            where: {
                userId,
                read: false
            }
        });
        res.json({
            success: true,
            data: { unreadCount }
        });
    }
    catch (error) {
        console.error('Erro ao contar nao lidas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.put('/:id/read', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const notification = await prisma_1.prisma.notification.findFirst({
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
        const updatedNotification = await prisma_1.prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json({
            success: true,
            data: updatedNotification
        });
    }
    catch (error) {
        console.error('Erro ao marcar como lida:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.put('/mark-all-read', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma_1.prisma.notification.updateMany({
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
    }
    catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
