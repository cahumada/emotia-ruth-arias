"use server";

import { logger } from "@/lib/logger";
import { toLoggableErrorName } from "@/lib/to-loggable-error-name";

export async function reportUnexpectedError(errorName: string): Promise<void> {
  logger.error(
    { errorName: toLoggableErrorName(errorName) },
    "Unhandled interface error",
  );
}
