'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { dashboardApi } from '@/services/api';

interface DashboardMetrics {
  occupancyRate: number;
  noShowRate: number;
  estimatedRevenue: number;
  mostRequestedServices: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    count: number;
  }>;
  appointmentsByStatus: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;
    
    const loadMetrics = async () => {
      if (hasLoaded) return;
      hasLoaded = true;

      try {
        const response = await dashboardApi.getMetrics();
        if (isMounted) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!metrics) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Taxa de Ocupação</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.occupancyRate}%</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Taxa de não comparecimento</h3>
              <p className="text-2xl font-bold text-red-600">{metrics.noShowRate}%</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Faturamento Estimado</h3>
              <p className="text-2xl font-bold text-green-600">R$ {metrics.estimatedRevenue.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Agendamentos</h3>
              <p className="text-2xl font-bold text-blue-600">
                {Object.values(metrics.appointmentsByStatus).reduce((a, b) => a + b, 0)}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Carregando métricas...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Serviços Mais Procurados</h2>
            {metrics?.mostRequestedServices.length ? (
              <div className="space-y-3">
                {metrics.mostRequestedServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.duration}min - R$ {service.price}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {service.count} agendamentos
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum dado disponível</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status dos Agendamentos</h2>
            {metrics?.appointmentsByStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Agendados</span>
                  <span className="font-medium">{metrics.appointmentsByStatus.scheduled || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizados</span>
                  <span className="font-medium text-green-600">{metrics.appointmentsByStatus.completed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Não compareceu</span>
                  <span className="font-medium text-red-600">{metrics.appointmentsByStatus.no_show || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelados</span>
                  <span className="font-medium text-gray-600">{metrics.appointmentsByStatus.cancelled || 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
