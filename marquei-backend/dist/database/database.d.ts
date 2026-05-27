import { User, Service, Professional, Appointment, Notification, ImportJob } from '../types';
export declare class Database {
    private static instance;
    users: User[];
    services: Service[];
    professionals: Professional[];
    appointments: Appointment[];
    notifications: Notification[];
    importJobs: ImportJob[];
    private constructor();
    static getInstance(): Database;
    private initializeMockData;
    clearAll(): void;
}
//# sourceMappingURL=database.d.ts.map