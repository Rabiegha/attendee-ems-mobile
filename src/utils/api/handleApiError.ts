/**
 * Gestion des erreurs API
 */

import axios from 'axios';

export const handleApiError = (error: unknown, defaultMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || defaultMessage;
    return new Error(message);
  }
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error(defaultMessage);
};
