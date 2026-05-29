import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// POST /api/seed/professional-services - Associar serviços aos profissionais
router.post('/professional-services', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    // Buscar todos os profissionais
    const professionals = await prisma.professional.findMany();
    
    // Buscar todos os serviços
    const services = await prisma.service.findMany();

    if (professionals.length === 0 || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum profissional ou serviço encontrado'
      });
    }

    // Limpar associações existentes
    await prisma.professionalService.deleteMany();

    // Associar todos os serviços ao primeiro profissional (ou a todos)
    const associations = [];
    for (const professional of professionals) {
      for (const service of services) {
        associations.push(
          prisma.professionalService.create({
            data: {
              professionalId: professional.id,
              serviceId: service.id
            }
          })
        );
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
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar associações'
    });
  }
});

// POST /api/seed/fix-client-user - Associar cliente existente ao usuário
router.post('/fix-client-user', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { clientId, userId } = req.body;

    if (!clientId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'clientId e userId são obrigatórios'
      });
    }

    // Atualizar cliente com userId
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { userId: userId }
    });

    res.json({
      success: true,
      message: 'Cliente associado ao usuário com sucesso',
      data: updatedClient
    });
  } catch (error) {
    console.error('Fix client-user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao associar cliente ao usuário'
    });
  }
});

export default router;
