"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.setupDatabase = setupDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const path_1 = __importDefault(require("path"));
let db = null;
exports.db = db;
async function initializeDatabase() {
    if (db)
        return db;
    const dbPath = path_1.default.join(__dirname, '../../prisma/dev.db');
    exports.db = db = await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database
    });
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    return db;
}
async function getDatabase() {
    if (!db) {
        await initializeDatabase();
    }
    return db;
}
// Hash password utility
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 10);
}
// Compare password utility
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
// Initialize database with schema and seed data
async function setupDatabase() {
    const database = await initializeDatabase();
    // Create tables
    await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('MANAGER', 'PROFESSIONAL', 'CLIENT')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS professionals (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      workSchedule TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS professional_services (
      id TEXT PRIMARY KEY,
      professionalId TEXT NOT NULL,
      serviceId TEXT NOT NULL,
      FOREIGN KEY (professionalId) REFERENCES professionals(id) ON DELETE CASCADE,
      FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
      UNIQUE(professionalId, serviceId)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      userId TEXT UNIQUE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      professionalId TEXT NOT NULL,
      serviceId TEXT NOT NULL,
      date DATETIME NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED')),
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (professionalId) REFERENCES professionals(id) ON DELETE CASCADE,
      FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('APPOINTMENT_REMINDER', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_CONFIRMED', 'SYSTEM_NOTIFICATION')),
      read BOOLEAN DEFAULT FALSE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS import_jobs (
      id TEXT PRIMARY KEY,
      fileName TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
      totalRows INTEGER,
      processedRows INTEGER,
      errors TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professionalId);
    CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(clientId);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  `);
    // Seed data
    await seedDatabase(database);
}
async function seedDatabase(database) {
    console.log('🌱 Starting database seed...');
    // Check if data already exists
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
        console.log('📊 Database already seeded');
        return;
    }
    // Hash password
    const hashedPassword = await hashPassword('senha123');
    // Create users
    const managerId = generateId();
    const professionalId = generateId();
    const clientId = generateId();
    await database.run(`
    INSERT INTO users (id, name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [managerId, 'Gestor Teste', 'gestor@marquei.com', hashedPassword, 'MANAGER', '(11) 99999-9999']);
    await database.run(`
    INSERT INTO users (id, name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [professionalId, 'Profissional Teste', 'profissional@marquei.com', hashedPassword, 'PROFESSIONAL', '(11) 88888-8888']);
    await database.run(`
    INSERT INTO users (id, name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [clientId, 'Cliente Teste', 'cliente@marquei.com', hashedPassword, 'CLIENT', '(11) 77777-7777']);
    // Create services
    const services = [
        { id: generateId(), name: 'Corte Masculino', duration: 30, price: 50.0, description: 'Corte de cabelo masculino tradicional' },
        { id: generateId(), name: 'Corte Feminino', duration: 45, price: 80.0, description: 'Corte de cabelo feminino com styling' },
        { id: generateId(), name: 'Coloração', duration: 120, price: 150.0, description: 'Coloração completa com produtos de qualidade' },
        { id: generateId(), name: 'Manicure', duration: 40, price: 40.0, description: 'Manicure tradicional com esmaltação' },
        { id: generateId(), name: 'Pedicure', duration: 50, price: 50.0, description: 'Pedicure tradicional com esmaltação' }
    ];
    for (const service of services) {
        await database.run(`
      INSERT INTO services (id, name, duration, price, description)
      VALUES (?, ?, ?, ?, ?)
    `, [service.id, service.name, service.duration, service.price, service.description]);
    }
    // Create professional
    const profId = generateId();
    const workSchedule = JSON.stringify({
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [{ start: '09:00', end: '13:00' }],
        sunday: []
    });
    await database.run(`
    INSERT INTO professionals (id, userId, workSchedule)
    VALUES (?, ?, ?)
  `, [profId, professionalId, workSchedule]);
    // Associate services with professional
    await database.run(`
    INSERT INTO professional_services (id, professionalId, serviceId)
    VALUES (?, ?, ?)
  `, [generateId(), profId, services[0].id]);
    await database.run(`
    INSERT INTO professional_services (id, professionalId, serviceId)
    VALUES (?, ?, ?)
  `, [generateId(), profId, services[1].id]);
    await database.run(`
    INSERT INTO professional_services (id, professionalId, serviceId)
    VALUES (?, ?, ?)
  `, [generateId(), profId, services[2].id]);
    // Create clients
    const clients = [
        { id: generateId(), name: 'João Silva', email: 'joao@email.com', phone: '(11) 11111-1111', userId: clientId },
        { id: generateId(), name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 22222-2222', userId: null },
        { id: generateId(), name: 'Pedro Oliveira', email: 'pedro@email.com', phone: '(11) 33333-3333', userId: null }
    ];
    for (const client of clients) {
        await database.run(`
      INSERT INTO clients (id, name, email, phone, userId)
      VALUES (?, ?, ?, ?, ?)
    `, [client.id, client.name, client.email, client.phone, client.userId]);
    }
    // Create appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    await database.run(`
    INSERT INTO appointments (id, clientId, professionalId, serviceId, date, startTime, endTime, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [generateId(), clients[0].id, profId, services[0].id, today.toISOString(), '10:00', '10:30', 'SCHEDULED', 'Cliente preferencial']);
    await database.run(`
    INSERT INTO appointments (id, clientId, professionalId, serviceId, date, startTime, endTime, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [generateId(), clients[1].id, profId, services[1].id, today.toISOString(), '14:00', '14:45', 'COMPLETED', 'Coloração aplicada']);
    await database.run(`
    INSERT INTO appointments (id, clientId, professionalId, serviceId, date, startTime, endTime, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [generateId(), clients[2].id, profId, services[2].id, tomorrow.toISOString(), '09:00', '11:00', 'SCHEDULED', 'Primeira coloração do cliente']);
    await database.run(`
    INSERT INTO appointments (id, clientId, professionalId, serviceId, date, startTime, endTime, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [generateId(), clients[0].id, profId, services[0].id, yesterday.toISOString(), '15:00', '15:30', 'NO_SHOW', 'Cliente não compareceu']);
    // Create notifications
    await database.run(`
    INSERT INTO notifications (id, userId, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `, [generateId(), professionalId, 'Novo agendamento', 'Você tem um novo agendamento para hoje às 10:00', 'APPOINTMENT_CONFIRMED']);
    await database.run(`
    INSERT INTO notifications (id, userId, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `, [generateId(), clientId, 'Lembrete de agendamento', 'Você tem um agendamento amanhã às 09:00', 'APPOINTMENT_REMINDER']);
    await database.run(`
    INSERT INTO notifications (id, userId, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `, [generateId(), managerId, 'Relatório diário', '4 agendamentos criados hoje', 'SYSTEM_NOTIFICATION']);
    // Create import job
    await database.run(`
    INSERT INTO import_jobs (id, fileName, status, totalRows, processedRows, errors)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [generateId(), 'clients_import.csv', 'COMPLETED', 10, 8, JSON.stringify([
            { row: 5, field: 'email', message: 'Email inválido' },
            { row: 9, field: 'phone', message: 'Telefone já existe' }
        ])]);
    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${(await database.get('SELECT COUNT(*) as count FROM users')).count}`);
    console.log(`- Services: ${(await database.get('SELECT COUNT(*) as count FROM services')).count}`);
    console.log(`- Professionals: ${(await database.get('SELECT COUNT(*) as count FROM professionals')).count}`);
    console.log(`- Clients: ${(await database.get('SELECT COUNT(*) as count FROM clients')).count}`);
    console.log(`- Appointments: ${(await database.get('SELECT COUNT(*) as count FROM appointments')).count}`);
    console.log(`- Notifications: ${(await database.get('SELECT COUNT(*) as count FROM notifications')).count}`);
    console.log(`- Import Jobs: ${(await database.get('SELECT COUNT(*) as count FROM import_jobs')).count}`);
}
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
//# sourceMappingURL=sqlite.js.map