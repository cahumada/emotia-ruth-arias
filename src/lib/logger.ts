import pino, { type DestinationStream, type Logger } from "pino";

export function createLogger(destination?: DestinationStream): Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? "info",
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
    destination,
  );
}

export const logger = createLogger();
