import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

router.post('/professional-services', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const professionals = await prisma.professional.findMany();
    
    const services = await prisma.service.findMany();

    if (professionals.length === 0 || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum profissional ou serviço encontrado'
      });
    }

    await prisma.professionalService.deleteMany();

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
    console.error('Erro de seed:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar associações'
    });
  }
});

router.post('/fix-client-user', authenticateToken, requireRole(['MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { clientId, userId } = req.body;

    if (!clientId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'clientId e userId são obrigatórios'
      });
    }

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
    console.error('Erro ao corrigir cliente-usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao associar cliente ao usuário'
    });
  }
});

export default router;
