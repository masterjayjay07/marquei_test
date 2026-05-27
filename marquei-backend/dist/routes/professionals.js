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
        const professionals = db.professionals.map(professional => {
            const user = db.users.find(u => u.id === professional.userId);
            return {
                ...professional,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email
                } : null
            };
        });
        const response = {
            success: true,
            data: professionals
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get professionals error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const professional = db.professionals.find(p => p.id === id);
        if (!professional) {
            return res.status(404).json({
                success: false,
                error: 'Profissional não encontrado'
            });
        }
        const user = db.users.find(u => u.id === professional.userId);
        const professionalWithUser = {
            ...professional,
            user: user ? {
                id: user.id,
                name: user.name,
                email: user.email
            } : null
        };
        const response = {
            success: true,
            data: professionalWithUser
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get professional error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { userId, services, workSchedule } = req.body;
        if (!userId || !services || !workSchedule) {
            return res.status(400).json({
                success: false,
                error: 'UserId, serviços e jornada de trabalho são obrigatórios'
            });
        }
        const user = db.users.find(u => u.id === userId && u.role === 'professional');
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Usuário profissional não encontrado'
            });
        }
        const newProfessional = {
            id: Date.now().toString(),
            userId,
            services,
            workSchedule: workSchedule,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        db.professionals.push(newProfessional);
        const response = {
            success: true,
            data: newProfessional,
            message: 'Profissional criado com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create professional error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { id } = req.params;
        const { userId, services, workSchedule } = req.body;
        const professionalIndex = db.professionals.findIndex(p => p.id === id);
        if (professionalIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Profissional não encontrado'
            });
        }
        if (userId) {
            const user = db.users.find(u => u.id === userId && u.role === 'professional');
            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Usuário profissional não encontrado'
                });
            }
        }
        const updatedProfessional = {
            ...db.professionals[professionalIndex],
            userId: userId || db.professionals[professionalIndex].userId,
            services: services || db.professionals[professionalIndex].services,
            workSchedule: workSchedule ? workSchedule : db.professionals[professionalIndex].workSchedule,
            updatedAt: new Date()
        };
        db.professionals[professionalIndex] = updatedProfessional;
        const response = {
            success: true,
            data: updatedProfessional,
            message: 'Profissional atualizado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update professional error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { id } = req.params;
        const professionalIndex = db.professionals.findIndex(p => p.id === id);
        if (professionalIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Profissional não encontrado'
            });
        }
        db.professionals.splice(professionalIndex, 1);
        res.json({
            success: true,
            message: 'Profissional excluído com sucesso'
        });
    }
    catch (error) {
        console.error('Delete professional error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=professionals.js.map