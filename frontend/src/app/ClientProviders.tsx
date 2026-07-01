'use client';

import { SocketProvider } from '../context/socketContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import Chatbot from '../components/Chatbot';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <SocketProvider>
        {children}
        <Chatbot />
      </SocketProvider>
    </NotificationsProvider>
  );
}
