"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
class Database {
    constructor() {
        this.users = [];
        this.services = [];
        this.professionals = [];
        this.appointments = [];
        this.notifications = [];
        this.importJobs = [];
        this.initializeMockData();
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    initializeMockData() {
        const now = new Date();
        this.users = [
            {
                id: '1',
                name: 'Gestor Teste',
                email: 'gestor@marquei.com',
                role: 'manager',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '2',
                name: 'Profissional Teste',
                email: 'profissional@marquei.com',
                role: 'professional',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '3',
                name: 'Cliente Teste',
                email: 'cliente@marquei.com',
                role: 'client',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '4',
                name: 'Maria Silva',
                email: 'maria@email.com',
                phone: '11987654321',
                role: 'client',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '5',
                name: 'João Santos',
                email: 'joao@email.com',
                phone: '11976543210',
                role: 'client',
                createdAt: now,
                updatedAt: now
            }
        ];
        this.services = [
            {
                id: '1',
                name: 'Corte Feminino',
                duration: 60,
                price: 80,
                description: 'Corte e styling completo',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '2',
                name: 'Corte Masculino',
                duration: 30,
                price: 50,
                description: 'Corte tradicional',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '3',
                name: 'Coloração',
                duration: 120,
                price: 150,
                description: 'Coloração completa',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '4',
                name: 'Manicure',
                duration: 45,
                price: 40,
                description: 'Manicure tradicional',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '5',
                name: 'Pedicure',
                duration: 45,
                price: 45,
                description: 'Pedicure tradicional',
                createdAt: now,
                updatedAt: now
            }
        ];
        this.professionals = [
            {
                id: '1',
                userId: '2',
                services: ['1', '2'],
                workSchedule: {
                    monday: [{ start: '09:00', end: '18:00' }],
                    tuesday: [{ start: '09:00', end: '18:00' }],
                    wednesday: [{ start: '09:00', end: '18:00' }],
                    thursday: [{ start: '09:00', end: '18:00' }],
                    friday: [{ start: '09:00', end: '18:00' }],
                    saturday: [],
                    sunday: []
                },
                createdAt: now,
                updatedAt: now
            },
            {
                id: '2',
                userId: '2',
                services: ['1', '3', '4', '5'],
                workSchedule: {
                    monday: [{ start: '08:00', end: '17:00' }],
                    tuesday: [{ start: '08:00', end: '17:00' }],
                    wednesday: [{ start: '08:00', end: '17:00' }],
                    thursday: [{ start: '08:00', end: '17:00' }],
                    friday: [{ start: '08:00', end: '17:00' }],
                    saturday: [{ start: '08:00', end: '12:00' }],
                    sunday: []
                },
                createdAt: now,
                updatedAt: now
            }
        ];
        this.appointments = [
            {
                id: '1',
                clientId: '3',
                professionalId: '1',
                serviceId: '1',
                date: now,
                startTime: '09:00',
                endTime: '10:00',
                status: 'scheduled',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '2',
                clientId: '4',
                professionalId: '2',
                serviceId: '3',
                date: now,
                startTime: '10:30',
                endTime: '12:30',
                status: 'scheduled',
                createdAt: now,
                updatedAt: now
            },
            {
                id: '3',
                clientId: '5',
                professionalId: '1',
                serviceId: '2',
                date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                startTime: '14:00',
                endTime: '14:30',
                status: 'completed',
                createdAt: now,
                updatedAt: now
            }
        ];
    }
    clearAll() {
        this.users = [];
        this.services = [];
        this.professionals = [];
        this.appointments = [];
        this.notifications = [];
        this.importJobs = [];
    }
}
exports.Database = Database;
