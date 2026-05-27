"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const db = database_1.Database.getInstance();
router.get('/', auth_1.authenticateToken, (req, res) => {
    try {
        const services = db.services;
        const response = {
            success: true,
            data: services
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const service = db.services.find(s => s.id === id);
        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Serviço não encontrado'
            });
        }
        const response = {
            success: true,
            data: service
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { name, duration, price, description } = req.body;
        if (!name || !duration || !price) {
            return res.status(400).json({
                success: false,
                error: 'Nome, duração e preço são obrigatórios'
            });
        }
        const newService = {
            id: Date.now().toString(),
            name,
            duration: parseInt(duration),
            price: parseFloat(price),
            description,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        db.services.push(newService);
        const response = {
            success: true,
            data: newService,
            message: 'Serviço criado com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { id } = req.params;
        const { name, duration, price, description } = req.body;
        const serviceIndex = db.services.findIndex(s => s.id === id);
        if (serviceIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Serviço não encontrado'
            });
        }
        const updatedService = {
            ...db.services[serviceIndex],
            name: name || db.services[serviceIndex].name,
            duration: duration ? parseInt(duration) : db.services[serviceIndex].duration,
            price: price ? parseFloat(price) : db.services[serviceIndex].price,
            description: description !== undefined ? description : db.services[serviceIndex].description,
            updatedAt: new Date()
        };
        db.services[serviceIndex] = updatedService;
        const response = {
            success: true,
            data: updatedService,
            message: 'Serviço atualizado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { id } = req.params;
        const serviceIndex = db.services.findIndex(s => s.id === id);
        if (serviceIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Serviço não encontrado'
            });
        }
        db.services.splice(serviceIndex, 1);
        res.json({
            success: true,
            message: 'Serviço excluído com sucesso'
        });
    }
    catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=services.js.map