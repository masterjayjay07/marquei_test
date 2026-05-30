'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { servicesApi, professionalsApi, appointmentsApi } from '@/services/api';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface Professional {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  services?: string[];
}

export default function BookPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clientId, setClientId] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;

    const fetchData = async () => {
      if (hasLoaded) return;
      hasLoaded = true;

      try {
        const [servicesRes, professionalsRes, clientRes] = await Promise.all([
          servicesApi.getAll(),
          professionalsApi.getAll(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/clients/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);
        
        const clientData = await clientRes.json();
        
        if (isMounted) {
          setServices(servicesRes.data || []);
          setProfessionals(professionalsRes.data || []);
          if (clientData.success && clientData.data) {
            setClientId(clientData.data.id);
          } else {
            console.error('Cliente nao encontrado:', clientData);
            setError('Erro: Cliente não encontrado. Você precisa estar cadastrado como cliente.');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (isMounted) {
          setError('Erro ao carregar dados');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedService || !selectedProfessional || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setSelectedTime('');
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/availability/slots?` +
          `professionalId=${selectedProfessional}&serviceId=${selectedService}&date=${selectedDate}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const data = await response.json();
        
        if (data.success) {
          setAvailableSlots(data.data.availableSlots || []);
        } else {
          setError(data.error || 'Erro ao carregar horários disponíveis');
        }
      } catch (error) {
        console.error('Erro ao carregar horarios:', error);
        setError('Erro ao carregar horários disponíveis');
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedService, selectedProfessional, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!user || !clientId) {
        throw new Error('Usuário não autenticado ou cliente não encontrado');
      }

      await appointmentsApi.create({
        clientId: clientId,
        professionalId: selectedProfessional,
        serviceId: selectedService,
        date: selectedDate,
        startTime: selectedTime,
        notes
      });

      setSuccess('Agendamento realizado com sucesso!');
      
      setSelectedService('');
      setSelectedProfessional('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao realizar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const availableProfessionals = selectedService
    ? professionals.filter(p => p.services?.includes(selectedService))
    : professionals;

  const selectedServiceData = services.find(s => s.id === selectedService);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Agendar Serviço</h1>

        <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serviço
              </label>
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setSelectedProfessional('');
                }}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                  </option>
                ))}
              </select>
            </div>

            {selectedServiceData && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Duração:</strong> {selectedServiceData.duration} minutos
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Valor:</strong> R$ {selectedServiceData.price.toFixed(2)}
                </p>
                {selectedServiceData.description && (
                  <p className="text-sm text-blue-800 mt-2">
                    {selectedServiceData.description}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profissional
              </label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                required
                disabled={!selectedService}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-black placeholder-gray-600"
              >
                <option value="">Selecione um profissional</option>
                {availableProfessionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.user?.name || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário
              </label>
              {loadingSlots ? (
                <div className="text-center py-4 text-gray-500">
                  Carregando horários disponíveis...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`px-4 py-2 rounded-md border ${
                        selectedTime === slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : selectedService && selectedProfessional && selectedDate ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border border-gray-200">
                  Nenhum horário disponível para esta data
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 bg-gray-50 rounded border border-gray-200">
                  Selecione serviço, profissional e data para ver horários disponíveis
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="Alguma observação sobre o agendamento?"
                              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedService('');
                  setSelectedProfessional('');
                  setSelectedDate('');
                  setSelectedTime('');
                  setNotes('');
                  setError('');
                  setSuccess('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-black"
              >
                Limpar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
