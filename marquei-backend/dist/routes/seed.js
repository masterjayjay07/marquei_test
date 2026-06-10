"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = express_1.default.Router();
router.post('/init-database', async (req, res) => {
    try {
        const { secret } = req.body;
        if (secret !== 'init-marquei-2026') {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        console.log('Iniciando setup do banco de dados...');
        const { stdout: pushOutput, stderr: pushError } = await execAsync('npx prisma db push --accept-data-loss');
        console.log('DB Push:', pushOutput);
        if (pushError)
            console.error('DB Push Error:', pushError);
        const { stdout: seedOutput, stderr: seedError } = await execAsync('npx ts-node prisma/seed.ts');
        console.log('Seed:', seedOutput);
        if (seedError)
            console.error('Seed Error:', seedError);
        res.json({
            success: true,
            message: 'Banco de dados inicializado com sucesso',
            logs: {
                push: pushOutput,
                seed: seedOutput
            }
        });
    }
    catch (error) {
        console.error('Erro ao inicializar banco:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stderr || error.stdout
        });
    }
});
router.post('/professional-services', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const professionals = await prisma_1.prisma.professional.findMany();
        const services = await prisma_1.prisma.service.findMany();
        if (professionals.length === 0 || services.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum profissional ou serviço encontrado'
            });
        }
        await prisma_1.prisma.professionalService.deleteMany();
        const associations = [];
        for (const professional of professionals) {
            for (const service of services) {
                associations.push(prisma_1.prisma.professionalService.create({
                    data: {
                        professionalId: professional.id,
                        serviceId: service.id
                    }
                }));
            }
        }
        await Promise.all(associations);
        res.json({
            success: true,
            message: `${associations.length} associações criadas com sucesso`,
            data: {
                professionals: professionals.length,
                services: services.length,
                associations: associations.length
            }
        });
    }
    catch (error) {
        console.error('Erro de seed:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar associações'
        });
    }
});
router.post('/fix-client-user', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const { clientId, userId } = req.body;
        if (!clientId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'clientId e userId são obrigatórios'
            });
        }
        const updatedClient = await prisma_1.prisma.client.update({
            where: { id: clientId },
            data: { userId: userId }
        });
        res.json({
            success: true,
            message: 'Cliente associado ao usuário com sucesso',
            data: updatedClient
        });
    }
    catch (error) {
        console.error('Erro ao corrigir cliente-usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao associar cliente ao usuário'
        });
    }
});
exports.default = router;
