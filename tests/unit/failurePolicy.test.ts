
import { afterEach, describe, expect, it } from "vitest";
import { getFailureMode } from "../../src/services/failurePolicy.js";

afterEach(() => {
    delete process.env.RATE_LIMIT_FAILURE_MODE;
});

describe("getFailureMode", () => {
    it("defaults to fail closed", () => {
        delete process.env.RATE_LIMIT_FAILURE_MODE;
        expect(getFailureMode()).toBe("closed");
    });

    it("supports fail open", () => {
        process.env.RATE_LIMIT_FAILURE_MODE = "open";
        expect(getFailureMode()).toBe("open");
    });

    it("rejects invalid configuration", () => {
        process.env.RATE_LIMIT_FAILURE_MODE = "sometimes";
        expect(() => getFailureMode()).toThrow();
    });
});
