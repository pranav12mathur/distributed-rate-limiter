
const configuredKeys = [
    {
        key: process.env.API_KEY_DEMO,
        userId: "user-demo",
    },
    {
        key: process.env.API_KEY_PREMIUM,
        userId: "user-premium",
    },
].filter(
    (entry): entry is { key: string; userId: string } =>
        typeof entry.key === "string" && entry.key.length > 0,
);

export function authenticateApiKey(
    key: string | undefined,
): { userId: string } | null {
    if (!key) return null;

    const match = configuredKeys.find(
        (entry) => entry.key === key,
    );

    return match ? { userId: match.userId } : null;
}
