"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const authenticateToken = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.log('Token decodificado:', { userId: decoded.userId, role: decoded.role });
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (err) {
        console.error('Erro de autenticacao:', err);
        return res.status(403).json({
            success: false,
            error: 'Token inválido ou expirado'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
