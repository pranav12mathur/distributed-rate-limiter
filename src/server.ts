
import "dotenv/config";
import app from "./app.js";
import { redisClient } from "./redis/client.js";

const PORT = Number(process.env.PORT) || 3000;

async function main() {
    await redisClient.connect();
    await redisClient.ping();

    const server = app.listen(PORT, () => {
        console.log(`Gateway listening on port ${PORT}`);
    });

    function shutdown() {
        server.close(() => {
            void redisClient.quit().finally(() => {
                process.exit(0);
            });
        });
    }

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}

main().catch((error) => {
    console.error("Startup failed:", error);
    process.exit(1);
});
