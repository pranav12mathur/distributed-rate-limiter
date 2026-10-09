
export type FailureMode = "open" | "closed";

export function getFailureMode(): FailureMode {
    const mode = process.env.RATE_LIMIT_FAILURE_MODE ?? "closed";

    if (mode !== "open" && mode !== "closed") {
        throw new Error(
            "RATE_LIMIT_FAILURE_MODE must be 'open' or 'closed'",
        );
    }

    return mode;
}
