"use client";

import { useEffect } from "react";
import { reportUnexpectedError } from "@/lib/report-unexpected-error";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    // A failed report must not replace the boundary that is already showing.
    void reportUnexpectedError(errorName).catch(() => undefined);
  }, [error]);

  return (
    <main>
      <h1>Algo salió mal</h1>
      <p>No pudimos mostrar esta página.</p>
      <button type="button" onClick={() => retry()}>
        Volvé a intentar
      </button>
    </main>
  );
}
