"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['MANAGER']), async (req, res) => {
    try {
        const appointments = await prisma_1.prisma.appointment.findMany({
            include: {
                service: true,
                client: true,
                professional: true
            }
        });
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
        const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;
        const scheduledAppointments = appointments.filter(a => a.status === 'SCHEDULED').length;
        const occupancyRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
        const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;
        const estimatedRevenue = appointments
            .filter(a => a.status === 'COMPLETED')
            .reduce((total, appointment) => {
            return total + (appointment.service?.price || 0);
        }, 0);
        const serviceCount = {};
        appointments.forEach(appointment => {
            serviceCount[appointment.serviceId] = (serviceCount[appointment.serviceId] || 0) + 1;
        });
        const allServices = await prisma_1.prisma.service.findMany();
        const mostRequestedServices = allServices
            .map(service => ({
            id: service.id,
            name: service.name,
            duration: service.duration,
            price: service.price,
            count: serviceCount[service.id] || 0
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const appointmentsByStatus = {
            scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
            completed: completedAppointments,
            no_show: noShowAppointments,
            cancelled: appointments.filter(a => a.status === 'CANCELLED').length
        };
        res.json({
            success: true,
            data: {
                occupancyRate: Math.round(occupancyRate * 100) / 100,
                noShowRate: Math.round(noShowRate * 100) / 100,
                estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
                mostRequestedServices,
                appointmentsByStatus
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar metricas do dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
