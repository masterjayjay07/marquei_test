'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { appointmentsApi } from '@/services/api';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  professional?: {
    id: string;
    user?: {
      name: string;
      email: string;
    };
  };
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;
    
    const loadAppointments = async () => {
      if (hasLoaded) return;
      hasLoaded = true;

      try {
        const response = await appointmentsApi.getAll();

        if (isMounted) {
          setAppointments(response.data || []);
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Erro ao carregar agendamentos');
        }
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
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, status: 'scheduled' | 'completed' | 'no_show' | 'cancelled') => {
    try {
      await appointmentsApi.update(appointmentId, { status });
      
      // Atualizar lista local
      setAppointments((prev: Appointment[]) => 
        prev.map((apt: Appointment) => 
          apt.id === appointmentId ? { ...apt, status } : apt
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'NO_SHOW':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'COMPLETED':
        return 'Concluído';
      case 'NO_SHOW':
        return 'Não compareceu';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
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

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {user?.role === 'MANAGER' ? 'Todos os Agendamentos' : 'Meus Agendamentos'}
        </h1>

        <div className="bg-white shadow rounded-lg">
          <div>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  Nenhum agendamento encontrado.
                </div>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {user?.role === 'MANAGER' ? 'Profissional' : 'Cliente'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {new Date(appointment.date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-gray-500">
                              {appointment.startTime}
                              {appointment.endTime && ` - ${appointment.endTime}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user?.role === 'MANAGER' ? (
                            <div>
                              <div className="font-medium">{appointment.professional?.user?.name || 'N/A'}</div>
                              <div className="text-gray-500">{appointment.professional?.user?.email || 'N/A'}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{appointment.client?.name}</div>
                              <div className="text-gray-500">{appointment.client?.phone || appointment.client?.email}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{appointment.service?.name}</div>
                            <div className="text-gray-500">
                              {appointment.service?.duration}min - R$ {appointment.service?.price?.toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {appointment.status.toUpperCase() === 'SCHEDULED' && (
                            <div className="flex space-x-2">
                              {user?.role === 'PROFESSIONAL' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Concluir
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'no_show')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Não Compareceu
                                  </button>
                                </>
                              )}
                              {(user?.role === 'MANAGER' || user?.role === 'PROFESSIONAL') && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
