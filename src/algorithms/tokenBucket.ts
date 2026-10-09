
export interface TokenBucketConfig {
    capacity: number;
    refillRate: number; // Tokens per second
}

export interface TokenBucketState {
    tokens: number;
    lastRefillTime: number; // Unix time in milliseconds
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
}

export class TokenBucket {
    private readonly capacity: number;
    private readonly refillRate: number;
    private state: TokenBucketState;

    constructor(
        config: TokenBucketConfig,
        now = Date.now(),
    ) {
        if (!Number.isFinite(config.capacity) ||
            config.capacity <= 0) {
            throw new Error("Capacity must be positive");
        }

        if (!Number.isFinite(config.refillRate) ||
            config.refillRate < 0) {
            throw new Error("Refill rate must be non-negative");
        }

        this.capacity = config.capacity;
        this.refillRate = config.refillRate;

        this.state = {
            tokens: config.capacity,
            lastRefillTime: now,
        };
    }

    consume(
        cost = 1,
        now = Date.now(),
    ): RateLimitResult {
        if (!Number.isFinite(cost) || cost <= 0) {
            throw new Error("Cost must be positive");
        }

        if (now < this.state.lastRefillTime) {
            throw new Error("Time cannot move backwards");
        }

        const elapsedSeconds =
            (now - this.state.lastRefillTime) / 1000;

        const refilledTokens =
            elapsedSeconds * this.refillRate;

        this.state.tokens = Math.min(
            this.capacity,
            this.state.tokens + refilledTokens,
        );

        this.state.lastRefillTime = now;

        if (this.state.tokens >= cost) {
            this.state.tokens -= cost;

            return {
                allowed: true,
                remaining: this.state.tokens,
            };
        }

        return {
            allowed: false,
            remaining: this.state.tokens,
        };
    }
}
