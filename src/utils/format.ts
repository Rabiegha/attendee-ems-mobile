/**
 * Utilitaires de formatage (dates, nombres, etc.)
 */

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Configuration dayjs
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('fr');

/**
 * Formate une date au format français
 */
export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  return dayjs(date).format(format);
};

/**
 * Formate une date et heure au format français
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

/**
 * Formate une heure
 */
export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

/**
 * Retourne une date relative (il y a X jours, etc.)
 */
export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

/**
 * Vérifie si une date est passée
 */
export const isPast = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs());
};

/**
 * Vérifie si une date est future
 */
export const isFuture = (date: string | Date): boolean => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Formate un nombre avec séparateurs de milliers
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
};
