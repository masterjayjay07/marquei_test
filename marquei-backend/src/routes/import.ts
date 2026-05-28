import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../types';

const router = express.Router();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

interface ImportJob {
  id: string;
  fileName: string;
  type: 'clients' | 'appointments';
  status: 'queued' | 'processing' | 'completed' | 'completed_with_errors';
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{
    line: number;
    error: string;
  }>;
  createdAt: string;
}

// Armazenamento em memória dos jobs (em produção, usar banco de dados)
const importJobs: Map<string, ImportJob> = new Map();

// Função para processar arquivo CSV ou Excel
function parseFile(buffer: Buffer, filename: string): any[] {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } else if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  }

  throw new Error('Formato de arquivo não suportado');
}

// POST /api/import - Iniciar importação
router.post('/', authenticateToken, requireRole(['MANAGER']), upload.single('file'), async (req: AuthRequest, res) => {
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

    // Criar job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: ImportJob = {
      id: jobId,
      fileName: req.file.originalname,
      type,
      status: 'queued',
      totalRows: 0,
      processedRows: 0,
      successRows: 0,
      errorRows: 0,
      errors: [],
      createdAt: new Date().toISOString()
    };

    importJobs.set(jobId, job);

    // Processar arquivo de forma assíncrona
    processImport(jobId, req.file.buffer, req.file.originalname, type as 'clients' | 'appointments');

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar importação'
    });
  }
});

// GET /api/import/:id - Obter status do job
router.get('/:id', authenticateToken, requireRole(['MANAGER']), (req: AuthRequest, res) => {
  const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = importJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job não encontrado'
    });
  }

  res.json({
    success: true,
    data: job
  });
});

// Função para processar importação de forma assíncrona
async function processImport(jobId: string, buffer: Buffer, filename: string, type: 'clients' | 'appointments') {
  const job = importJobs.get(jobId);
  if (!job) return;

  try {
    // Atualizar status para processing
    job.status = 'processing';

    // Parsear arquivo
    const rows = parseFile(buffer, filename);
    job.totalRows = rows.length;

    // Processar cada linha
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 2; // +2 porque linha 1 é header e arrays começam em 0

      try {
        if (type === 'clients') {
          await processClientRow(row);
        } else {
          await processAppointmentRow(row);
        }

        job.successRows++;
      } catch (error) {
        job.errorRows++;
        job.errors.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      job.processedRows++;
    }

    // Atualizar status final
    job.status = job.errorRows > 0 ? 'completed_with_errors' : 'completed';
  } catch (error) {
    console.error('Process import error:', error);
    job.status = 'completed_with_errors';
    job.errors.push({
      line: 0,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo'
    });
  }
}

// Processar linha de cliente
async function processClientRow(row: any) {
  const { Nome, Email, Telefone } = row;

  if (!Nome || !Email) {
    throw new Error('Nome e Email são obrigatórios');
  }

  // Verificar se cliente já existe
  const existing = await prisma.client.findFirst({
    where: { email: Email }
  });

  if (existing) {
    throw new Error('Cliente já cadastrado com este email');
  }

  // Criar cliente
  await prisma.client.create({
    data: {
      name: Nome,
      email: Email,
      phone: Telefone || null
    }
  });
}

// Processar linha de agendamento
async function processAppointmentRow(row: any) {
  const { Data, Hora, ClienteEmail, ProfissionalEmail, ServicoID } = row;

  if (!Data || !Hora || !ClienteEmail || !ProfissionalEmail || !ServicoID) {
    throw new Error('Todos os campos são obrigatórios');
  }

  // Buscar cliente
  const client = await prisma.client.findFirst({
    where: { email: ClienteEmail }
  });

  if (!client) {
    throw new Error(`Cliente não encontrado: ${ClienteEmail}`);
  }

  // Buscar profissional
  const professionalUser = await prisma.user.findFirst({
    where: { email: ProfissionalEmail, role: 'PROFESSIONAL' }
  });

  if (!professionalUser) {
    throw new Error(`Profissional não encontrado: ${ProfissionalEmail}`);
  }

  const professional = await prisma.professional.findFirst({
    where: { userId: professionalUser.id }
  });

  if (!professional) {
    throw new Error(`Profissional não encontrado: ${ProfissionalEmail}`);
  }

  // Buscar serviço
  const service = await prisma.service.findUnique({
    where: { id: ServicoID }
  });

  if (!service) {
    throw new Error(`Serviço não encontrado: ${ServicoID}`);
  }

  // Calcular endTime baseado na duração do serviço
  const [hours, minutes] = Hora.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(startDate.getTime() + service.duration * 60000);
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

  // Criar agendamento
  await prisma.appointment.create({
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

export default router;
