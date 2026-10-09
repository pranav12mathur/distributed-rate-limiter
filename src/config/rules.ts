
export type Algorithm = "token-bucket" | "sliding-window";
export type RuleScope = "api-key" | "user" | "endpoint";

export interface RateLimitRule {
    name: string;
    algorithm: Algorithm;
    scope: RuleScope;
    endpoint: string;
    limit: number;
    windowMs: number;
    capacity?: number;
    refillRate?: number;
}

export const rules: RateLimitRule[] = [
    {
        name: "per-api-key",
        algorithm: "token-bucket",
        scope: "api-key",
        endpoint: "/api",
        limit: 10,
        capacity: 10,
        refillRate: 2,
        windowMs: 60_000,
    },
    {
        name: "per-user",
        algorithm: "sliding-window",
        scope: "user",
        endpoint: "/api",
        limit: 30,
        windowMs: 60_000,
    },
    {
        name: "reports-endpoint",
        algorithm: "sliding-window",
        scope: "endpoint",
        endpoint: "/api/reports",
        limit: 5,
        windowMs: 60_000,
    },
];
