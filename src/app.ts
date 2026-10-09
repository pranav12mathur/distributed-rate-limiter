
import express from "express";
import healthRouter from "./routes/health.js";
import apiRouter from "./routes/api.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api", rateLimiter, apiRouter);

app.use(
    (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
    ) => {
        console.error("Request failed:", error);

        res.status(500).json({
            error: "Internal server error",
        });
    },
);

export default app;
