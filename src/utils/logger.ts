/**
 * Conditional logger — only outputs in __DEV__ mode.
 * Drop-in replacement for console.log / console.warn / console.error.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('MyTag', 'message', data);
 *   logger.warn('MyTag', 'something suspicious');
 *   logger.error('MyTag', 'boom', err);
 */

const noop = (..._args: unknown[]) => {};

export const logger = {
  log: __DEV__ ? console.log.bind(console) : noop,
  warn: __DEV__ ? console.warn.bind(console) : noop,
  error: __DEV__ ? console.error.bind(console) : noop,
  debug: __DEV__ ? console.debug.bind(console) : noop,
  info: __DEV__ ? console.info.bind(console) : noop,
};

export default logger;
