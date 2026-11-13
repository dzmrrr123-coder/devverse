/**
 * Structured logger for DEVVERSE server operations.
 * Compatible with standard structured loggers like pino.
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface AppLogger {
  info: (obj: Record<string, unknown> | string, msg?: string) => void
  warn: (obj: Record<string, unknown> | string, msg?: string) => void
  error: (obj: Record<string, unknown> | string, msg?: string) => void
  debug: (obj: Record<string, unknown> | string, msg?: string) => void
}

export function createLogger(name = 'devverse'): AppLogger {
  function log(level: LogLevel, obj: Record<string, unknown> | string, msg?: string) {
    const time = new Date().toISOString()
    if (typeof obj === 'string') {
      if (level === 'error') console.error(JSON.stringify({ time, level, name, msg: obj }))
      else console.log(JSON.stringify({ time, level, name, msg: obj }))
    } else {
      if (level === 'error') console.error(JSON.stringify({ time, level, name, ...obj, msg }))
      else console.log(JSON.stringify({ time, level, name, ...obj, msg }))
    }
  }

  return {
    info: (obj, msg) => log('info', obj, msg),
    warn: (obj, msg) => log('warn', obj, msg),
    error: (obj, msg) => log('error', obj, msg),
    debug: (obj, msg) => log('debug', obj, msg),
  }
}

export const logger = createLogger('devverse:server')
