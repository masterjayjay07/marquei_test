'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReminderService } from '@/hooks/useReminderService';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Ativar serviço de lembretes automático
  useReminderService(!!user);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/unread-count`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Atualizar contador quando lembretes são processados
  useEffect(() => {
    const handleReminderProcessed = () => {
      // Recarregar contador após processamento de lembretes
      const fetchUnreadCount = async () => {
        if (!user) return;
        
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/unread-count`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.data.unreadCount);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      fetchUnreadCount();
    };

    // Escutar evento customizado de lembretes processados
    window.addEventListener('remindersProcessed', handleReminderProcessed);
    
    return () => {
      window.removeEventListener('remindersProcessed', handleReminderProcessed);
    };
  }, [user]);

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
            <div className="flex items-center gap-4">
              <Link
                href="/notifications"
                className="relative inline-flex items-center"
              >
                <svg
                  className="w-6 h-6 text-gray-600 hover:text-gray-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <span className="text-sm text-gray-700">
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
