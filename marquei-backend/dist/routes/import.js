"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const XLSX = __importStar(require("xlsx"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
function parseFile(buffer, filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
        return (0, sync_1.parse)(buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    }
    else if (ext === 'xlsx' || ext === 'xls') {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet);
    }
    throw new Error('Formato de arquivo não suportado');
}
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo enviado'
            });
        }
        const { type } = req.body;
        if (!type || !['clients', 'appointments'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de importação inválido'
            });
        }
        const job = await prisma_1.prisma.importJob.create({
            data: {
                fileName: req.file.originalname,
                type: type.toUpperCase(),
                status: 'PENDING',
                totalRows: 0,
                processedRows: 0,
                successRows: 0,
                errorRows: 0,
                errors: []
            }
        });
        processImport(job.id, req.file.buffer, req.file.originalname, type);
        res.json({
            success: true,
            data: {
                id: job.id,
                fileName: job.fileName,
                type: job.type.toLowerCase(),
                status: job.status.toLowerCase(),
                totalRows: job.totalRows,
                processedRows: job.processedRows,
                successRows: job.successRows,
                errorRows: job.errorRows,
                errors: job.errors,
                createdAt: job.createdAt.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Erro de importacao:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao iniciar importação'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const job = await prisma_1.prisma.importJob.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job não encontrado'
            });
        }
        res.json({
            success: true,
            data: {
                id: job.id,
                fileName: job.fileName,
                type: job.type.toLowerCase(),
                status: job.status.toLowerCase(),
                totalRows: job.totalRows,
                processedRows: job.processedRows,
                successRows: job.successRows,
                errorRows: job.errorRows,
                errors: job.errors,
                createdAt: job.createdAt.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar job de importacao:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar job'
        });
    }
});
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const jobs = await prisma_1.prisma.importJob.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: jobs.map(job => ({
                id: job.id,
                fileName: job.fileName,
                type: job.type.toLowerCase(),
                status: job.status.toLowerCase(),
                totalRows: job.totalRows,
                processedRows: job.processedRows,
                successRows: job.successRows,
                errorRows: job.errorRows,
                errors: job.errors,
                createdAt: job.createdAt.toISOString()
            }))
        });
    }
    catch (error) {
        console.error('Erro ao listar jobs de importacao:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar jobs'
        });
    }
});
async function processImport(jobId, buffer, filename, type) {
    try {
        await prisma_1.prisma.importJob.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' }
        });
        const rows = parseFile(buffer, filename);
        await prisma_1.prisma.importJob.update({
            where: { id: jobId },
            data: { totalRows: rows.length }
        });
        let successRows = 0;
        let errorRows = 0;
        const errors = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lineNumber = i + 2;
            try {
                if (type === 'clients') {
                    await processClientRow(row);
                }
                else {
                    await processAppointmentRow(row);
                }
                successRows++;
            }
            catch (error) {
                errorRows++;
                errors.push({
                    line: lineNumber,
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                });
            }
            if ((i + 1) % 10 === 0 || i === rows.length - 1) {
                await prisma_1.prisma.importJob.update({
                    where: { id: jobId },
                    data: {
                        processedRows: i + 1,
                        successRows,
                        errorRows,
                        errors
                    }
                });
            }
        }
        await prisma_1.prisma.importJob.update({
            where: { id: jobId },
            data: {
                status: errorRows > 0 ? 'COMPLETED' : 'COMPLETED',
                processedRows: rows.length,
                successRows,
                errorRows,
                errors
            }
        });
    }
    catch (error) {
        console.error('Erro ao processar importacao:', error);
        await prisma_1.prisma.importJob.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                errors: [{
                        line: 0,
                        error: error instanceof Error ? error.message : 'Erro ao processar arquivo'
                    }]
            }
        });
    }
}
async function processClientRow(row) {
    const { Nome, Email, Telefone } = row;
    if (!Nome || !Email) {
        throw new Error('Nome e Email são obrigatórios');
    }
    const existing = await prisma_1.prisma.client.findFirst({
        where: { email: Email }
    });
    if (existing) {
        throw new Error('Cliente já cadastrado com este email');
    }
    await prisma_1.prisma.client.create({
        data: {
            name: Nome,
            email: Email,
            phone: Telefone || null
        }
    });
}
async function processAppointmentRow(row) {
    const { Data, Hora, ClienteEmail, ProfissionalEmail, ServicoID } = row;
    if (!Data || !Hora || !ClienteEmail || !ProfissionalEmail || !ServicoID) {
        throw new Error('Todos os campos são obrigatórios');
    }
    const client = await prisma_1.prisma.client.findFirst({
        where: { email: ClienteEmail }
    });
    if (!client) {
        throw new Error(`Cliente não encontrado: ${ClienteEmail}`);
    }
    const professionalUser = await prisma_1.prisma.user.findFirst({
        where: { email: ProfissionalEmail, role: 'PROFESSIONAL' }
    });
    if (!professionalUser) {
        throw new Error(`Profissional não encontrado: ${ProfissionalEmail}`);
    }
    const professional = await prisma_1.prisma.professional.findFirst({
        where: { userId: professionalUser.id }
    });
    if (!professional) {
        throw new Error(`Profissional não encontrado: ${ProfissionalEmail}`);
    }
    const service = await prisma_1.prisma.service.findUnique({
        where: { id: ServicoID }
    });
    if (!service) {
        throw new Error(`Serviço não encontrado: ${ServicoID}`);
    }
    const [hours, minutes] = Hora.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    await prisma_1.prisma.appointment.create({
        data: {
            date: new Date(Data),
            startTime: Hora,
            endTime: endTime,
            status: 'SCHEDULED',
            clientId: client.id,
            professionalId: professional.id,
            serviceId: service.id
        }
    });
}
exports.default = router;
