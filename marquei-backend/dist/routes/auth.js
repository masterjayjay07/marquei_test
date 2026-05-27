"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const db = database_1.Database.getInstance();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }
        const user = db.users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        const response = {
            success: true,
            data: user,
            message: 'Login realizado com sucesso'
        };
        res.json({
            ...response,
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/me', auth_1.authenticateToken, (req, res) => {
    try {
        const response = {
            success: true,
            data: req.user
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/logout', auth_1.authenticateToken, (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map