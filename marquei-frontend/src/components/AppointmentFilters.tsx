'use client';

import React from 'react';

interface AppointmentFiltersProps {
  filters: {
    clientId?: string;
    professionalId?: string;
    serviceId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    clientName?: string;
  };
  onFilterChange: (filters: any) => void;
  clients?: Array<{ id: string; name: string }>;
  professionals?: Array<{ id: string; user: { name: string } }>;
  services?: Array<{ id: string; name: string }>;
  showClientFilter?: boolean;
  showProfessionalFilter?: boolean;
  showClientNameFilter?: boolean;
}

export const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  filters,
  onFilterChange,
  clients = [],
  professionals = [],
  services = [],
  showClientFilter = true,
  showProfessionalFilter = true,
  showClientNameFilter = false,
}) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: string, value: string) => {
    const newFilters = {
      ...localFilters,
      [key]: value || undefined
    };
    setLocalFilters(newFilters);
    return newFilters;
  };

  const applyFilters = (customFilters?: any) => {
    onFilterChange(customFilters || localFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showClientFilter && clients.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={localFilters.clientId || ''}
              onChange={(e) => {
                const newFilters = handleChange('clientId', e.target.value);
                applyFilters(newFilters);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showClientNameFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente
            </label>
            <div className="relative">
              <input
                type="text"
                value={localFilters.clientName || ''}
                onChange={(e) => handleChange('clientName', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Buscar por nome..."
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <button
                onClick={() => applyFilters()}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {showProfessionalFilter && professionals.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profissional
            </label>
            <select
              value={localFilters.professionalId || ''}
              onChange={(e) => {
                const newFilters = handleChange('professionalId', e.target.value);
                applyFilters(newFilters);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Todos os profissionais</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {services.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serviço
            </label>
            <select
              value={localFilters.serviceId || ''}
              onChange={(e) => {
                const newFilters = handleChange('serviceId', e.target.value);
                applyFilters(newFilters);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Todos os serviços</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => {
              const newFilters = handleChange('status', e.target.value);
              applyFilters(newFilters);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Todos os status</option>
            <option value="SCHEDULED">Agendado</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="NO_SHOW">Não compareceu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Inicial
          </label>
          <input
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) => {
              const newFilters = handleChange('startDate', e.target.value);
              applyFilters(newFilters);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Final
          </label>
          <input
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) => {
              const newFilters = handleChange('endDate', e.target.value);
              applyFilters(newFilters);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
      </div>
    </div>
  );
};
