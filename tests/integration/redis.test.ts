
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { redisClient } from "../../src/redis/client.js";
import { consumeTokenBucket } from "../../src/redis/rateLimitStore.js";

describe("Redis rate-limit integration", () => {
    const key = `test:bucket:${randomUUID()}`;

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

    it("shares token state across calls", async () => {
        const first = await consumeTokenBucket(key, 2, 0);
        const second = await consumeTokenBucket(key, 2, 0);
        const third = await consumeTokenBucket(key, 2, 0);

        expect(first.allowed).toBe(true);
        expect(second.allowed).toBe(true);
        expect(third.allowed).toBe(false);
    });

    it("stores state in Redis", async () => {
        const freshKey = `${key}:state`;

        try {
            await consumeTokenBucket(freshKey, 5, 1);

            expect(await redisClient.exists(freshKey)).toBe(1);
        } finally {
            await redisClient.del(freshKey);
        }
    });
});
