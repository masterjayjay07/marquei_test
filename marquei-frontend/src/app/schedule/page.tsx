'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { appointmentsApi, clientsApi, servicesApi } from '@/services/api';
import { AppointmentFilters } from '@/components/AppointmentFilters';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  client: {
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

export default function SchedulePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({ status: 'SCHEDULED' });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const servicesRes = await servicesApi.getAll();
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

  const updateAppointmentStatus = async (appointmentId: string, status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED') => {
    try {
      await appointmentsApi.update(appointmentId, { status });
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status } : apt
      ));
    } catch (error) {
      console.error('Error updating appointment:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Minha Agenda</h1>
        
        <AppointmentFilters
          filters={filters}
          onFilterChange={setFilters}
          services={services}
          showClientFilter={false}
          showProfessionalFilter={false}
          showClientNameFilter={true}
        />

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <li key={appointment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {appointment.client?.name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {appointment.client.name}
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
                            {appointment.service.name} • {appointment.startTime} - {appointment.endTime}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {appointment.client.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {appointment.status === 'SCHEDULED' && (
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Realizado
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'NO_SHOW')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Não compareceu
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-gray-500">
                Nenhum agendamento encontrado para esta data
              </li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
