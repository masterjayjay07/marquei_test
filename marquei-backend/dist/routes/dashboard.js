"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const db = database_1.Database.getInstance();
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const appointments = db.appointments;
        const services = db.services;
        const professionals = db.professionals;
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(a => a.status === 'completed').length;
        const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;
        const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
        const occupancyRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
        const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;
        const estimatedRevenue = appointments
            .filter(a => a.status === 'completed')
            .reduce((total, appointment) => {
            const service = services.find(s => s.id === appointment.serviceId);
            return total + (service?.price || 0);
        }, 0);
        const serviceCount = {};
        appointments.forEach(appointment => {
            if (appointment.status === 'completed') {
                serviceCount[appointment.serviceId] = (serviceCount[appointment.serviceId] || 0) + 1;
            }
        });
        const mostRequestedServices = services
            .map(service => ({
            ...service,
            count: serviceCount[service.id] || 0
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const appointmentsByStatus = {
            scheduled: appointments.filter(a => a.status === 'scheduled').length,
            completed: completedAppointments,
            no_show: noShowAppointments,
            cancelled: appointments.filter(a => a.status === 'cancelled').length
        };
        const metrics = {
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            noShowRate: Math.round(noShowRate * 100) / 100,
            estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
            mostRequestedServices,
            appointmentsByStatus
        };
        const response = {
            success: true,
            data: metrics
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get dashboard metrics error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/appointments-by-date', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Data inicial e final são obrigatórias'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const appointments = db.appointments.filter(a => a.date >= start && a.date <= end);
        const appointmentsByDate = {};
        appointments.forEach(appointment => {
            const dateKey = appointment.date.toISOString().split('T')[0];
            if (!appointmentsByDate[dateKey]) {
                appointmentsByDate[dateKey] = [];
            }
            appointmentsByDate[dateKey].push(appointment);
        });
        const response = {
            success: true,
            data: appointmentsByDate
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get appointments by date error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
router.get('/professional-performance', auth_1.authenticateToken, (0, auth_1.requireRole)(['manager']), (req, res) => {
    try {
        const appointments = db.appointments;
        const professionals = db.professionals;
        const users = db.users;
        const professionalPerformance = professionals.map(professional => {
            const professionalAppointments = appointments.filter(a => a.professionalId === professional.id);
            const completedAppointments = professionalAppointments.filter(a => a.status === 'completed');
            const noShowAppointments = professionalAppointments.filter(a => a.status === 'no_show');
            const user = users.find(u => u.id === professional.userId);
            return {
                id: professional.id,
                name: user?.name || 'Profissional',
                email: user?.email || '',
                totalAppointments: professionalAppointments.length,
                completedAppointments: completedAppointments.length,
                noShowAppointments: noShowAppointments.length,
                occupancyRate: professionalAppointments.length > 0
                    ? (completedAppointments.length / professionalAppointments.length) * 100
                    : 0,
                revenue: completedAppointments.reduce((total, appointment) => {
                    const service = db.services.find(s => s.id === appointment.serviceId);
                    return total + (service?.price || 0);
                }, 0)
            };
        });
        const response = {
            success: true,
            data: professionalPerformance
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get professional performance error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map