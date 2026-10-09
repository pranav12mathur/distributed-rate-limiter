
import { rules, type RateLimitRule } from "../config/rules.js";
import {
    consumeTokenBucket,
    consumeSlidingWindow,
    type StoreResult,
} from "../redis/rateLimitStore.js";

export interface RateCheck {
    rule: RateLimitRule;
    result: StoreResult;
}

export async function checkRateLimits(
    apiKey: string,
    userId: string,
    path: string,
): Promise<RateCheck[]> {
    const matchingRules = rules.filter(
        (rule) =>
            path === rule.endpoint ||
            path.startsWith(`${rule.endpoint}/`),
    );

    const results: RateCheck[] = [];

    for (const rule of matchingRules) {
        const identity =
            rule.scope === "api-key"
                ? apiKey
                : rule.scope === "user"
                    ? userId
                    : rule.endpoint;

        const key = [
            "rl",
            rule.name,
            rule.scope,
            identity,
        ].join(":");

        let result: StoreResult;

        if (rule.algorithm === "token-bucket") {
            result = await consumeTokenBucket(
                key,
                rule.capacity ?? rule.limit,
                rule.refillRate ?? 0,
            );
        } else {
            result = await consumeSlidingWindow(
                key,
                rule.limit,
                rule.windowMs,
            );
        }

        results.push({ rule, result });

        if (!result.allowed) {
            break;
        }
    }

    return results;
}
