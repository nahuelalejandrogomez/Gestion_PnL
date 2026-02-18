/**
 * Logger centralizado con control de niveles por ambiente
 *
 * Features:
 * - Auto-disable debug/info en producción
 * - Manual override vía localStorage.DEBUG_ROLLING="1"
 * - Prefijos claros para filtrado
 * - Zero overhead en prod (dead code elimination si se usa correctamente)
 *
 * Uso:
 *   logger.debug('[Rolling]', 'Tab changed', { from, to })
 *   logger.info('[Rolling]', 'Fetch completed', { duration })
 *   logger.warn('[Rolling]', 'Performance risk', { count })
 *   logger.error('[Rolling]', 'Discrepancia', { expected, actual })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabledLevels: Set<LogLevel>;
  isProd: boolean;
  debugOverride: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isProd = import.meta.env.PROD;

    // Check localStorage override (safe access)
    let debugOverride = false;
    try {
      debugOverride = localStorage.getItem('DEBUG_ROLLING') === '1';
    } catch {
      // localStorage no disponible (SSR, etc.)
    }

    // En producción: solo warn/error, a menos que override esté activo
    const enabledLevels = new Set<LogLevel>();

    if (isProd && !debugOverride) {
      // PROD sin override: solo warn/error
      enabledLevels.add('warn');
      enabledLevels.add('error');
    } else {
      // DEV o PROD con override: todos los niveles
      enabledLevels.add('debug');
      enabledLevels.add('info');
      enabledLevels.add('warn');
      enabledLevels.add('error');
    }

    this.config = {
      enabledLevels,
      isProd,
      debugOverride,
    };

    // Log config solo en dev o con override
    if (!isProd || debugOverride) {
      console.info('[Logger] Initialized', {
        env: isProd ? 'PROD' : 'DEV',
        debugOverride,
        enabledLevels: Array.from(enabledLevels),
      });
    }
  }

  /**
   * DEBUG: Para logs de desarrollo, navigation events, etc.
   * Deshabilitado en PROD (a menos que DEBUG_ROLLING="1")
   */
  debug(prefix: string, message: string, data?: any): void {
    if (!this.config.enabledLevels.has('debug')) return;

    const formatted = this.formatData(data);
    console.log(prefix, message, formatted);
  }

  /**
   * INFO: Para eventos importantes, fetch completions, etc.
   * Deshabilitado en PROD (a menos que DEBUG_ROLLING="1")
   */
  info(prefix: string, message: string, data?: any): void {
    if (!this.config.enabledLevels.has('info')) return;

    const formatted = this.formatData(data);
    console.log(prefix, message, formatted);
  }

  /**
   * WARN: Para warnings de performance, datos faltantes, etc.
   * Habilitado en PROD
   */
  warn(prefix: string, message: string, data?: any): void {
    if (!this.config.enabledLevels.has('warn')) return;

    const formatted = this.formatData(data);
    console.warn(prefix, message, formatted);
  }

  /**
   * ERROR: Para errores de validación, discrepancias, etc.
   * Habilitado en PROD
   */
  error(prefix: string, message: string, data?: any): void {
    if (!this.config.enabledLevels.has('error')) return;

    const formatted = this.formatData(data);
    console.error(prefix, message, formatted);
  }

  /**
   * Formatear data para logging
   * - Convertir timestamps a ISO strings
   * - Limitar objetos grandes (opcional)
   */
  private formatData(data: any): any {
    if (!data) return '';

    // Si tiene timestamp numérico, convertir a ISO
    if (typeof data === 'object' && 'timestamp' in data && typeof data.timestamp === 'number') {
      return {
        ...data,
        timestamp: new Date(data.timestamp).toISOString(),
      };
    }

    return data;
  }

  /**
   * Helper para habilitar debug manualmente
   * Uso en consola del browser: window.enableRollingDebug()
   */
  enableDebug(): void {
    try {
      localStorage.setItem('DEBUG_ROLLING', '1');
      console.info('[Logger] Debug enabled. Reload page to take effect.');
    } catch (error) {
      console.error('[Logger] Failed to enable debug', error);
    }
  }

  /**
   * Helper para deshabilitar debug
   */
  disableDebug(): void {
    try {
      localStorage.removeItem('DEBUG_ROLLING');
      console.info('[Logger] Debug disabled. Reload page to take effect.');
    } catch (error) {
      console.error('[Logger] Failed to disable debug', error);
    }
  }
}

// Export singleton
export const logger = new Logger();

// Expose helpers to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).enableRollingDebug = () => logger.enableDebug();
  (window as any).disableRollingDebug = () => logger.disableDebug();
}
