
import { describe, expect, it } from "vitest";
import { TokenBucket } from "../../src/algorithms/tokenBucket.js";

describe("TokenBucket", () => {
    it("allows requests while tokens remain", () => {
        const bucket = new TokenBucket(
            { capacity: 2, refillRate: 1 },
            1000,
        );

        expect(bucket.consume(1, 1000).allowed).toBe(true);
        expect(bucket.consume(1, 1000).allowed).toBe(true);
        expect(bucket.consume(1, 1000).allowed).toBe(false);
    });

    it("refills according to elapsed time", () => {
        const bucket = new TokenBucket(
            { capacity: 2, refillRate: 1 },
            1000,
        );

        bucket.consume(1, 1000);
        bucket.consume(1, 2000);

        expect(bucket.consume(1, 3000).allowed).toBe(true);
    });

    it("rejects invalid cost", () => {
        const bucket = new TokenBucket({
            capacity: 5,
            refillRate: 1,
        });

        expect(() => bucket.consume(0)).toThrow();
    });
});
