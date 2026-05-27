'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getNavItems = () => {
    switch (user.role) {
      case 'MANAGER':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/services', label: 'Serviços' },
          { href: '/professionals', label: 'Profissionais' },
          { href: '/clients', label: 'Clientes' },
          { href: '/appointments', label: 'Agendamentos' },
          { href: '/import', label: 'Importação' }
        ];
      case 'PROFESSIONAL':
        return [
          { href: '/schedule', label: 'Minha Agenda' },
          { href: '/appointments', label: 'Agendamentos' }
        ];
      case 'CLIENT':
        return [
          { href: '/my-appointments', label: 'Meus Agendamentos' },
          { href: '/book', label: 'Agendar' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Marquei</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                {getNavItems().map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user.name} ({user.role === 'MANAGER' ? 'Gestor' : user.role === 'PROFESSIONAL' ? 'Profissional' : 'Cliente'})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
