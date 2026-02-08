type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = import.meta.env.DEV ? "debug" : "warn";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

/** Simple logger with level filtering: debug in dev, warn+ in production. */
export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog("debug")) console.debug(`[DEBUG] ${message}`, ...args);
  },
  info(message: string, ...args: unknown[]) {
    if (shouldLog("info")) console.info(`[INFO] ${message}`, ...args);
  },
  warn(message: string, ...args: unknown[]) {
    if (shouldLog("warn")) console.warn(`[WARN] ${message}`, ...args);
  },
  error(message: string, ...args: unknown[]) {
    if (shouldLog("error")) console.error(`[ERROR] ${message}`, ...args);
  },
};
