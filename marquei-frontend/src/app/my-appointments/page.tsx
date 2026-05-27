'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { appointmentsApi, AppointmentUpdateData } from '@/services/api';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  professional: {
    id: string;
    name: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await appointmentsApi.getAll();
        setAppointments(response.data || []);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadAppointments();
    }
  }, [user]);

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentsApi.update(appointmentId, { status: 'cancelled' } as AppointmentUpdateData);
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
      ));
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Agendamentos</h1>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {appointments.length > 0 ? (
              appointments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((appointment) => (
                <li key={appointment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium">
                              {appointment.professional.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {appointment.service.name}
                            </h3>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'no_show' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status === 'scheduled' ? 'Agendado' :
                               appointment.status === 'completed' ? 'Realizado' :
                               appointment.status === 'no_show' ? 'No-Show' :
                               'Cancelado'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Profissional: {appointment.professional.name}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString('pt-BR')} • {appointment.startTime} - {appointment.endTime}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            R$ {appointment.service.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {appointment.status === 'scheduled' && (
                      <div className="ml-4">
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-gray-500">
                Você não possui agendamentos
              </li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
