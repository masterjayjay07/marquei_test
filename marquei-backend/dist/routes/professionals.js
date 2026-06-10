"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('Buscando profissionais...');
        const professionals = await prisma_1.prisma.professional.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                professionalServices: {
                    select: {
                        serviceId: true
                    }
                }
            }
        });
        const professionalsWithServices = professionals.map(prof => ({
            ...prof,
            services: prof.professionalServices.map(ps => ps.serviceId)
        }));
        console.log('Profissionais encontrados:', professionals.length);
        res.json({
            success: true,
            data: professionalsWithServices
        });
    }
    catch (error) {
        console.error('Erro ao buscar profissionais:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const professional = await prisma_1.prisma.professional.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                professionalServices: {
                    select: {
                        serviceId: true
                    }
                }
            }
        });
        if (!professional) {
            return res.status(404).json({
                success: false,
                error: 'Profissional não encontrado'
            });
        }
        const professionalWithServices = {
            ...professional,
            services: professional.professionalServices.map(ps => ps.serviceId)
        };
        res.json({
            success: true,
            data: professionalWithServices
        });
    }
    catch (error) {
        console.error('Erro ao buscar profissional:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const { name, email, password, specialty } = req.body;
        if (!name || !email || !password || !specialty) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'PROFESSIONAL'
            }
        });
        const professional = await prisma_1.prisma.professional.create({
            data: {
                userId: user.id,
                workSchedule: {
                    monday: { available: true, start: '09:00', end: '18:00' },
                    tuesday: { available: true, start: '09:00', end: '18:00' },
                    wednesday: { available: true, start: '09:00', end: '18:00' },
                    thursday: { available: true, start: '09:00', end: '18:00' },
                    friday: { available: true, start: '09:00', end: '18:00' },
                    saturday: { available: false },
                    sunday: { available: false }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        const professionalWithSpecialty = {
            ...professional,
            specialty
        };
        res.status(201).json({
            success: true,
            data: professionalWithSpecialty,
            message: 'Profissional criado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao criar profissional:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
