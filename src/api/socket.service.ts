/**
 * Service WebSocket pour les connexions en temps réel
 */

import { io, Socket } from 'socket.io-client';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import { getApiBaseUrl } from '../config/apiUrl';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  async connect() {
    console.log('[Socket] 🔌 connect() called');
    const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.log('[Socket] Token from storage:', token ? `EXISTS (${token.substring(0, 20)}...)` : 'NULL');
    const baseUrl = getApiBaseUrl();

    if (!token) {
      console.log('[Socket] ❌ No token available, cannot connect');
      return;
    }

    if (this.socket?.connected) {
      console.log('[Socket] ✅ Already connected');
      return;
    }

    console.log('[Socket] 🚀 Connecting to:', `${baseUrl}/events`);

    this.socket = io(`${baseUrl}/events`, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // Écouter tous les événements enregistrés
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[Socket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

   on(event: string, callback: (...args: any[]) => void) {
    // Ajouter le listener à la liste
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // Si déjà connecté, ajouter le listener au socket
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      // Retirer un listener spécifique
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      this.socket?.off(event, callback);
    } else {
      // Retirer tous les listeners de cet événement
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
