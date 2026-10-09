
import type { RequestHandler } from "express";
import { authenticateApiKey } from "../config/apiKeys.js";
import { checkRateLimits } from "../services/rateLimitService.js";
import { getFailureMode } from "../services/failurePolicy.js";

export const rateLimiter: RequestHandler = async (
    req,
    res,
    next,
) => {
    const rawKey = req.header("x-api-key");
    const auth = authenticateApiKey(rawKey);

    if (!rawKey || !auth) {
        res.status(401).json({
            error: "Invalid or missing API key",
        });
        return;
    }

    try {
        const path = req.originalUrl.split("?")[0];

        const checks = await checkRateLimits(
            rawKey,
            auth.userId,
            path,
        );

        const rejected = checks.find(
            (check) => !check.result.allowed,
        );

        const selected = rejected ?? checks[checks.length - 1];

        if (selected) {
            res.setHeader("X-RateLimit-Limit", selected.rule.limit);
            res.setHeader(
                "X-RateLimit-Remaining",
                selected.result.remaining,
            );
        }

        if (rejected) {
            const retryMs = rejected.result.retryAfterMs;

            if (retryMs >= 0) {
                res.setHeader(
                    "Retry-After",
                    Math.max(1, Math.ceil(retryMs / 1000)),
                );
            }

            res.status(429).json({
                error: "Too many requests",
                rule: rejected.rule.name,
                retryAfterMs: retryMs,
            });
            return;
        }

        next();
    } catch (error) {
        console.error("Rate limiter dependency failure:", error);

        let mode: "open" | "closed";

        try {
            mode = getFailureMode();
        } catch (configError) {
            next(configError);
            return;
        }

        if (mode === "open") {
            res.setHeader("X-RateLimit-Status", "degraded");
            next();
            return;
        }

        res.setHeader("Retry-After", "1");
        res.status(503).json({
            error: "Rate limiting service unavailable",
        });
    }
};
