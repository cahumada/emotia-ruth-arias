import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "@/lib/logger";

describe("createLogger", () => {
  it("writes one JSON line with an ISO timestamp, a level and a stable message", () => {
    const lines: string[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    const logger = createLogger(destination);

    logger.info({ requestId: "req_1" }, "Application started");

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0] ?? "{}") as {
      level: string;
      time: string;
      msg: string;
      requestId: string;
    };
    expect(entry.level).toBe("info");
    expect(entry.msg).toBe("Application started");
    expect(entry.requestId).toBe("req_1");
    expect(entry.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
