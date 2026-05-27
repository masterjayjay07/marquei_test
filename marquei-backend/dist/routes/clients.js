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
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const clients = db.users.filter(u => u.role === 'client');
        const response = {
            success: true,
            data: clients
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { id } = req.params;
        const client = db.users.find(u => u.id === id && u.role === 'client');
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }
        const response = {
            success: true,
            data: client
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
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
        const newClient = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            role: 'client',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        db.users.push(newClient);
        const response = {
            success: true,
            data: newClient,
            message: 'Cliente criado com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
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
        const updatedClient = {
            ...db.users[clientIndex],
            name: name || db.users[clientIndex].name,
            email: email || db.users[clientIndex].email,
            phone: phone !== undefined ? phone : db.users[clientIndex].phone,
            updatedAt: new Date()
        };
        db.users[clientIndex] = updatedClient;
        const response = {
            success: true,
            data: updatedClient,
            message: 'Cliente atualizado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
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
    }
    catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=clients.js.map