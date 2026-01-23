/**
 * Wrappers pour le stockage sécurisé et AsyncStorage
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME_MODE: 'theme_mode',
} as const;

/**
 * Stockage sécurisé (pour tokens sensibles)
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde sécurisée de ${key}:`, error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Erreur lors de la lecture sécurisée de ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression sécurisée de ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      // Supprimer tous les items sensibles
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage sécurisé:', error);
    }
  },
};

/**
 * Stockage standard (pour données non sensibles)
 */
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
      throw error;
    }
  },

  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage:', error);
    }
  },
};
