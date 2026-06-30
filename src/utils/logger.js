/**
 * logger.js
 * A dev-only logger that silences all output in production builds.
 * Import this instead of using console.* directly so that logs are
 * automatically stripped when the app is built for production.
 *
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.log('something happened');
 *   logger.warn('heads up');
 *   logger.error('something broke', error);
 */

const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  log:   (...args) => { if (isDev) console.log(...args); },
  warn:  (...args) => { if (isDev) console.warn(...args); },
  error: (...args) => { if (isDev) console.error(...args); },
};

export default logger;
