"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
console.log('Rotas de autenticacao carregadas');
const router = express_1.default.Router();
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
        const user = await prisma_1.prisma.user.findUnique({
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret);
        console.log('Token gerado com sucesso');
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword,
            message: 'Login realizado com sucesso',
            token
        });
    }
    catch (error) {
        console.error('Erro de login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/me', auth_1.authenticateToken, (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    }
    catch (error) {
        console.error('Erro ao buscar usuario:', error);
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
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email já cadastrado'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'CLIENT',
                phone: phone || null
            }
        });
        const client = await prisma_1.prisma.client.create({
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
    }
    catch (error) {
        console.error('Erro de registro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao realizar cadastro'
        });
    }
});
exports.default = router;
