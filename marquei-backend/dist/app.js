"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_1 = __importDefault(require("./routes/auth"));
const services_1 = __importDefault(require("./routes/services"));
const professionals_1 = __importDefault(require("./routes/professionals"));
const clients_1 = __importDefault(require("./routes/clients"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const import_1 = __importDefault(require("./routes/import"));
const seed_1 = __importDefault(require("./routes/seed"));
const availability_1 = __importDefault(require("./routes/availability"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
app.use('/api/auth', auth_1.default);
app.use('/api/services', services_1.default);
app.use('/api/professionals', professionals_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/appointments', appointments_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/import', import_1.default);
app.use('/api/seed', seed_1.default);
app.use('/api/availability', availability_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/reminders', reminders_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Marquei Backend API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});
app.use((err, req, res, next) => {
    console.error('Erro nao tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
