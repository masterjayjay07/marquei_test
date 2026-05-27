export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'manager' | 'professional' | 'client';
    createdAt: Date;
    updatedAt: Date;
}
export interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Professional {
    id: string;
    userId: string;
    services: string[];
    workSchedule: WorkSchedule;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkSchedule {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
}
export interface TimeSlot {
    start: string;
    end: string;
}
export interface Appointment {
    id: string;
    clientId: string;
    professionalId: string;
    serviceId: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Notification {
    id: string;
    userId: string;
    appointmentId?: string;
    type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule';
    message: string;
    sentAt: Date;
    read: boolean;
}
export interface ImportJob {
    id: string;
    type: 'clients' | 'appointments';
    status: 'queued' | 'processing' | 'completed' | 'completed_with_errors';
    totalRows: number;
    processedRows: number;
    errors: ImportError[];
    createdAt: Date;
    completedAt?: Date;
}
export interface ImportError {
    row: number;
    field: string;
    message: string;
}
export interface DashboardMetrics {
    occupancyRate: number;
    noShowRate: number;
    estimatedRevenue: number;
    mostRequestedServices: Service[];
    appointmentsByStatus: Record<string, number>;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map