"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: services
        });
    }
    catch (error) {
        console.error('Erro ao buscar servicos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
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
    }
    catch (error) {
        console.error('Erro ao buscar servico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao criar servico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), async (req, res) => {
    try {
        const id = req.params.id;
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
    }
    catch (error) {
        console.error('Erro ao atualizar servico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), async (req, res) => {
    try {
        const id = req.params.id;
        await prisma.service.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Serviço excluído com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao deletar servico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
