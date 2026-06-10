/// <reference types="node" />

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

enum UserRole {
  MANAGER = 'MANAGER',
  PROFESSIONAL = 'PROFESSIONAL',
  CLIENT = 'CLIENT'
}

enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED'
}

enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION'
}

enum ImportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

async function main() {
  console.log('Iniciando seed do banco de dados...');

  await prisma.importJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.professionalService.deleteMany();
  await prisma.client.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('Dados limpos');

  const hashedPassword = await bcrypt.hash('senha123', 10);

  const managerUser = await prisma.user.create({
    data: {
      name: 'Gestor Teste',
      email: 'gestor@marquei.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
      phone: '(11) 99999-9999',
    },
  });

  const professionalUser = await prisma.user.create({
    data: {
      name: 'Profissional Teste',
      email: 'profissional@marquei.com',
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      phone: '(11) 88888-8888',
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      name: 'Cliente Teste',
      email: 'cliente@marquei.com',
      password: hashedPassword,
      role: UserRole.CLIENT,
      phone: '(11) 77777-7777',
    },
  });

  console.log('Usuarios criados');

  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Corte Masculino',
        duration: 30,
        price: 50.0,
        description: 'Corte de cabelo masculino tradicional',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte Feminino',
        duration: 45,
        price: 80.0,
        description: 'Corte de cabelo feminino com styling',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Coloração',
        duration: 120,
        price: 150.0,
        description: 'Coloração completa com produtos de qualidade',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Manicure',
        duration: 40,
        price: 40.0,
        description: 'Manicure tradicional com esmaltação',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Pedicure',
        duration: 50,
        price: 50.0,
        description: 'Pedicure tradicional com esmaltação',
      },
    }),
  ]);

  console.log('Servicos criados');

  const professional = await prisma.professional.create({
    data: {
      userId: professionalUser.id,
      workSchedule: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [{ start: '09:00', end: '13:00' }],
        sunday: [],
      },
    },
  });

  await Promise.all([
    prisma.professionalService.create({
      data: {
        professionalId: professional.id,
        serviceId: services[0].id,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professional.id,
        serviceId: services[1].id,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professional.id,
        serviceId: services[2].id,
      },
    }),
  ]);

  console.log('Profissional e associacoes de servicos criados');

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 11111-1111',
        userId: clientUser.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '(11) 22222-2222',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Pedro Oliveira',
        email: 'pedro@email.com',
        phone: '(11) 33333-3333',
      },
    }),
  ]);

  console.log('Clientes criados');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        clientId: clients[0].id,
        professionalId: professional.id,
        serviceId: services[0].id,
        date: today,
        startTime: '10:00',
        endTime: '10:30',
        status: AppointmentStatus.SCHEDULED,
        notes: 'Cliente preferencial',
      },
    }),
    prisma.appointment.create({
      data: {
        clientId: clients[1].id,
        professionalId: professional.id,
        serviceId: services[1].id,
        date: today,
        startTime: '14:00',
        endTime: '14:45',
        status: AppointmentStatus.COMPLETED,
        notes: 'Coloração aplicada',
      },
    }),
    prisma.appointment.create({
      data: {
        clientId: clients[2].id,
        professionalId: professional.id,
        serviceId: services[2].id,
        date: tomorrow,
        startTime: '09:00',
        endTime: '11:00',
        status: AppointmentStatus.SCHEDULED,
        notes: 'Primeira coloração do cliente',
      },
    }),
    prisma.appointment.create({
      data: {
        clientId: clients[0].id,
        professionalId: professional.id,
        serviceId: services[0].id,
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        startTime: '15:00',
        endTime: '15:30',
        status: AppointmentStatus.NO_SHOW,
        notes: 'Cliente não compareceu',
      },
    }),
  ]);

  console.log('Agendamentos criados');

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: professionalUser.id,
        title: 'Novo agendamento',
        message: 'Você tem um novo agendamento para hoje às 10:00',
        type: NotificationType.APPOINTMENT_CONFIRMED,
      },
    }),
    prisma.notification.create({
      data: {
        userId: clientUser.id,
        title: 'Lembrete de agendamento',
        message: 'Você tem um agendamento amanhã às 09:00',
        type: NotificationType.APPOINTMENT_REMINDER,
      },
    }),
    prisma.notification.create({
      data: {
        userId: managerUser.id,
        title: 'Relatório diário',
        message: '4 agendamentos criados hoje',
        type: NotificationType.SYSTEM_NOTIFICATION,
      },
    }),
  ]);

  console.log('Notificacoes criadas');

  await prisma.importJob.create({
    data: {
      fileName: 'clients_import.csv',
      type: 'CLIENTS',
      status: ImportJobStatus.COMPLETED,
      totalRows: 10,
      processedRows: 8,
      errors: [
        {
          row: 5,
          field: 'email',
          message: 'Email inválido',
        },
        {
          row: 9,
          field: 'phone',
          message: 'Telefone já existe',
        },
      ],
    },
  });

  console.log('Job de importacao criado');

  console.log('Seed do banco concluido!');
  console.log('\nResumo:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Services: ${await prisma.service.count()}`);
  console.log(`- Professionals: ${await prisma.professional.count()}`);
  console.log(`- Clients: ${await prisma.client.count()}`);
  console.log(`- Appointments: ${await prisma.appointment.count()}`);
  console.log(`- Notifications: ${await prisma.notification.count()}`);
  console.log(`- Import Jobs: ${await prisma.importJob.count()}`);
}

main()
  .catch((e) => {
    console.error('Erro no seed do banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
