'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { appointmentsApi, AppointmentUpdateData, professionalsApi, servicesApi } from '@/services/api';
import { AppointmentFilters } from '@/components/AppointmentFilters';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  professional: {
    id: string;
    user?: {
      name: string;
      email: string;
    };
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
  const [filters, setFilters] = useState<any>({});
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [professionalsRes, servicesRes] = await Promise.all([
          professionalsApi.getAll(),
          servicesApi.getAll()
        ]);
        
        setProfessionals(professionalsRes.data || []);
        setServices(servicesRes.data || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadFilterData();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      setLoading(true);

      try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value as string);
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/appointments?${queryParams}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const data = await response.json();

        if (isMounted && data.success) {
          setAppointments(data.data || []);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const canCancelAppointment = (appointment: Appointment) => {
    // A data vem como UTC (YYYY-MM-DD), precisamos criar a data/hora correta
    const [year, month, day] = appointment.date.split('T')[0].split('-').map(Number);
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    
    // Criar data/hora local do agendamento
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('Appointment:', appointmentDateTime, 'Now:', now, 'Diff hours:', hoursDifference);
    
    return hoursDifference >= 4;
  };

  const cancelAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) return;
    
    if (!canCancelAppointment(appointment)) {
      alert('Cancelamento deve ser feito com no mínimo 4 horas de antecedência');
      return;
    }

    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      await appointmentsApi.update(appointmentId, { status: 'CANCELLED' } as AppointmentUpdateData);
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'CANCELLED' } : apt
      ));
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      alert(error.response?.data?.error || 'Erro ao cancelar agendamento');
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

        <AppointmentFilters
          filters={filters}
          onFilterChange={setFilters}
          professionals={professionals}
          services={services}
          showClientFilter={false}
        />

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
                              {appointment.professional?.user?.name?.charAt(0).toUpperCase() || 'P'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {appointment.service.name}
                            </h3>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'NO_SHOW' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status === 'SCHEDULED' ? 'Agendado' :
                               appointment.status === 'COMPLETED' ? 'Realizado' :
                               appointment.status === 'NO_SHOW' ? 'Não compareceu' :
                               'Cancelado'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Profissional: {appointment.professional?.user?.name || 'N/A'}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {appointment.startTime} - {appointment.endTime}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            R$ {appointment.service.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {appointment.status === 'SCHEDULED' && (
                      <div className="ml-4 flex flex-col items-end gap-1">
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          disabled={!canCancelAppointment(appointment)}
                          className={`px-3 py-1 text-white text-sm rounded ${
                            canCancelAppointment(appointment)
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                          title={!canCancelAppointment(appointment) ? 'Cancelamento deve ser feito com 4h de antecedência' : ''}
                        >
                          Cancelar
                        </button>
                        {!canCancelAppointment(appointment) && (
                          <span className="text-xs text-gray-500">
                            Menos de 4h
                          </span>
                        )}
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
