/**
 * Service WebSocket pour les connexions en temps réel
 *
 * Fix P1: auth est une fonction factory → token frais à chaque reconnexion
 * Fix P2: disconnect() vide la Map listeners → plus d'empilement
 */

import { io, Socket } from "socket.io-client";
import { secureStorage, STORAGE_KEYS } from "../utils/storage";
import { getApiBaseUrl } from "../config/apiUrl";
import { logger } from "../utils/logger";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  async connect() {
    logger.log("[Socket] 🔌 connect() called");
    const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const baseUrl = getApiBaseUrl();

    if (!token) {
      logger.log("[Socket] ❌ No token available, cannot connect");
      return;
    }

    // Si un socket existe déjà (même en cours de reconnexion), le fermer proprement
    if (this.socket) {
      logger.log("[Socket] ♻️ Closing existing socket before reconnecting");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    logger.log("[Socket] 🚀 Connecting to:", `${baseUrl}/events`);

    this.socket = io(`${baseUrl}/events`, {
      // Factory function : socket.io appelle cette fonction à CHAQUE connexion/reconnexion
      // → le token est toujours frais, même après un refresh
      auth: async (cb) => {
        try {
          const freshToken = await secureStorage.getItem(
            STORAGE_KEYS.ACCESS_TOKEN,
          );
          cb({ token: freshToken });
        } catch {
          cb({ token });
        }
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      logger.log("[Socket] ✅ Connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      logger.log("[Socket] Disconnected:", reason);
    });

    this.socket.on("error", (error) => {
      logger.error("[Socket] Error:", error);
    });

    this.socket.on("connect_error", (error) => {
      logger.error("[Socket] Connection error:", error.message);
    });

    // Réattacher les listeners enregistrés au nouveau socket
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      logger.log("[Socket] Disconnecting...");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    // Vider TOUS les listeners enregistrés pour éviter l'empilement
    this.listeners.clear();
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const callbacks = this.listeners.get(event)!;

    // Éviter les doublons : ne pas ajouter si le callback exact existe déjà
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    // Si déjà connecté, ajouter le listener au socket
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
