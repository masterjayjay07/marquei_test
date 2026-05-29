import { useEffect, useRef } from 'react';

export const useReminderService = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const processReminders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/reminders/process`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const data = await response.json();
        if (data.success) {
          console.log(`Lembretes processados: ${data.data.sentCount} enviados`);
          
          // Disparar evento customizado para atualizar contador de notificações
          if (data.data.sentCount > 0) {
            window.dispatchEvent(new Event('remindersProcessed'));
          }
        }
      } catch (error) {
        console.error('Erro ao processar lembretes:', error);
      }
    };

    // Processar imediatamente ao montar
    processReminders();

    // Processar a cada 5 minutos (300000ms)
    intervalRef.current = setInterval(processReminders, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);
};
