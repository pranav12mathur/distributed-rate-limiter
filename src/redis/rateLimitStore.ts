
import { randomUUID } from "node:crypto";
import { redisClient } from "./client.js";
import {
    TOKEN_BUCKET_SCRIPT,
    SLIDING_WINDOW_SCRIPT,
} from "./scripts.js";

export interface StoreResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

function parseResult(result: unknown): StoreResult {
    if (!Array.isArray(result) || result.length !== 3) {
        throw new Error("Invalid Redis rate-limit response");
    }

    return {
        allowed: Number(result[0]) === 1,
        remaining: Number(result[1]),
        retryAfterMs: Number(result[2]),
    };
}

export async function consumeTokenBucket(
    key: string,
    capacity: number,
    refillRate: number,
    cost = 1,
): Promise<StoreResult> {
    if (
        !Number.isFinite(capacity) ||
        capacity <= 0 ||
        !Number.isFinite(refillRate) ||
        refillRate < 0 ||
        !Number.isFinite(cost) ||
        cost <= 0 ||
        cost > capacity
    ) {
        throw new Error("Invalid token bucket configuration");
    }

    const ttlMs = Math.max(
        60_000,
        refillRate > 0
            ? Math.ceil((capacity / refillRate) * 2000)
            : 86_400_000,
    );

    const result = await redisClient.eval(
        TOKEN_BUCKET_SCRIPT,
        {
            keys: [key],
            arguments: [
                String(capacity),
                String(refillRate),
                String(cost),
                String(ttlMs),
            ],
        },
    );

    return parseResult(result);
}

export async function consumeSlidingWindow(
    key: string,
    limit: number,
    windowMs: number,
): Promise<StoreResult> {
    if (
        !Number.isSafeInteger(limit) ||
        limit <= 0 ||
        !Number.isSafeInteger(windowMs) ||
        windowMs <= 0
    ) {
        throw new Error("Invalid sliding window configuration");
    }

    const result = await redisClient.eval(
        SLIDING_WINDOW_SCRIPT,
        {
            keys: [key],
            arguments: [
                String(windowMs),
                String(limit),
                randomUUID(),
            ],
        },
    );

    return parseResult(result);
}
