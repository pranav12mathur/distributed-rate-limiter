
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { redisClient } from "../../src/redis/client.js";
import { consumeSlidingWindow } from "../../src/redis/rateLimitStore.js";

describe("Sliding window", () => {
    const key = `test:sliding:${randomUUID()}`;

    beforeAll(async () => {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    });

    afterAll(async () => {
        if (redisClient.isReady) {
            await redisClient.del(key);
        }
    });

    it("allows up to the configured limit", async () => {
        const first = await consumeSlidingWindow(key, 2, 60_000);
        const second = await consumeSlidingWindow(key, 2, 60_000);
        const third = await consumeSlidingWindow(key, 2, 60_000);

        expect(first.allowed).toBe(true);
        expect(second.allowed).toBe(true);
        expect(third.allowed).toBe(false);
    });

    it("reports remaining capacity", async () => {
        const freshKey = `${key}:remaining`;

        try {
            const result = await consumeSlidingWindow(
                freshKey,
                3,
                60_000,
            );

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2);
        } finally {
            await redisClient.del(freshKey);
        }
    });
});
