-- SQLite Schema for Marquei System
-- Run this script to create the database structure

-- Users table
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

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    price REAL NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Professionals table
CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    workSchedule TEXT NOT NULL, -- JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Professional Services junction table
CREATE TABLE IF NOT EXISTS professional_services (
    id TEXT PRIMARY KEY,
    professionalId TEXT NOT NULL,
    serviceId TEXT NOT NULL,
    FOREIGN KEY (professionalId) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(professionalId, serviceId)
);

-- Clients table
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

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    professionalId TEXT NOT NULL,
    serviceId TEXT NOT NULL,
    date DATETIME NOT NULL,
    startTime TEXT NOT NULL, -- format: "HH:mm"
    endTime TEXT NOT NULL, -- format: "HH:mm"
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED')),
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (professionalId) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE
);

-- Notifications table
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

-- Import Jobs table
CREATE TABLE IF NOT EXISTS import_jobs (
    id TEXT PRIMARY KEY,
    fileName TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    totalRows INTEGER,
    processedRows INTEGER,
    errors TEXT, -- JSON array of errors
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professionalId);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(clientId);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
