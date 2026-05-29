'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface ImportJob {
  id: string;
  fileName: string;
  type: 'clients' | 'appointments';
  status: 'queued' | 'processing' | 'completed' | 'completed_with_errors';
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{
    line: number;
    error: string;
  }>;
  createdAt: string;
}

export default function ImportPage() {
  const { user } = useAuth();
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/import', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setImportJobs(data.data);
        
        // Iniciar polling para jobs que ainda estão processando
        data.data.forEach((job: ImportJob) => {
          if (job.status === 'queued' || job.status === 'processing') {
            pollJobStatus(job.id);
          }
        });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'clients' | 'appointments') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setUploading(true);

    try {
      const response = await fetch('http://localhost:3001/api/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Adicionar job à lista
        setImportJobs(prev => [data.data, ...prev]);
        
        // Iniciar polling para atualizar status
        pollJobStatus(data.data.id);
      } else {
        alert(data.error || 'Erro ao iniciar importação');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/import/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setImportJobs(prev => 
            prev.map(job => job.id === jobId ? data.data : job)
          );

          // Parar polling se job terminou
          if (data.data.status === 'completed' || data.data.status === 'completed_with_errors') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000); // Poll a cada 2 segundos
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'completed_with_errors':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Na Fila';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'completed_with_errors':
        return 'Concluído com Falhas';
      default:
        return status;
    }
  };

  if (user?.role !== 'MANAGER') {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Acesso não autorizado. Apenas gestores podem importar dados.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Importação em Massa</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Importar Clientes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Importar Clientes</h2>
            <p className="text-gray-600 mb-4">
              Faça upload de uma planilha CSV ou Excel com os dados dos clientes.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formato esperado: Nome, Email, Telefone
            </p>
            <label className="block">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'clients')}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </div>

          {/* Importar Agendamentos */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Importar Agendamentos</h2>
            <p className="text-gray-600 mb-4">
              Faça upload de uma planilha CSV ou Excel com os agendamentos antigos.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formato esperado: Data, Hora, Cliente Email, Profissional Email, Serviço ID
            </p>
            <label className="block">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, 'appointments')}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>

        {/* Lista de Jobs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Histórico de Importações</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {importJobs.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                Nenhuma importação realizada ainda.
              </div>
            ) : (
              importJobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{job.fileName}</h3>
                        <p className="text-sm text-gray-500">
                          {job.type === 'clients' ? 'Clientes' : 'Agendamentos'} • {new Date(job.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  {(job.status === 'processing' || job.status === 'completed' || job.status === 'completed_with_errors') && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{job.processedRows} de {job.totalRows} linhas processadas</span>
                        <span>{Math.round((job.processedRows / job.totalRows) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(job.processedRows / job.totalRows) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Resultados */}
                  {(job.status === 'completed' || job.status === 'completed_with_errors') && (
                    <div className="mt-3 flex space-x-6 text-sm">
                      <div className="text-green-600">
                        ✓ {job.successRows} sucesso
                      </div>
                      {job.errorRows > 0 && (
                        <div className="text-red-600">
                          ✗ {job.errorRows} erros
                        </div>
                      )}
                    </div>
                  )}

                  {/* Erros */}
                  {job.errors && job.errors.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-red-600 font-medium">
                          Ver erros ({job.errors.length})
                        </summary>
                        <div className="mt-2 bg-red-50 rounded p-3 max-h-40 overflow-y-auto">
                          {job.errors.map((error, idx) => (
                            <div key={idx} className="text-xs text-red-800 mb-1">
                              Linha {error.line}: {error.error}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
