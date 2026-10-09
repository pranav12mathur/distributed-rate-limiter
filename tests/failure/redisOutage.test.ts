
import { afterEach, describe, expect, it } from "vitest";
import { getFailureMode } from "../../src/services/failurePolicy.js";

afterEach(() => {
    delete process.env.RATE_LIMIT_FAILURE_MODE;
});

describe("Redis outage policy configuration", () => {
    it("defaults to fail closed", () => {
        delete process.env.RATE_LIMIT_FAILURE_MODE;

        expect(getFailureMode()).toBe("closed");
    });

    it("can be configured to fail open", () => {
        process.env.RATE_LIMIT_FAILURE_MODE = "open";

        expect(getFailureMode()).toBe("open");
    });

    it("rejects unsupported policy values", () => {
        process.env.RATE_LIMIT_FAILURE_MODE = "invalid";

        expect(() => getFailureMode()).toThrow();
    });
});
