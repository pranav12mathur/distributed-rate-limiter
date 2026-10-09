
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
    res.json({
        message: "API request accepted",
    });
});

router.get("/reports", (_req, res) => {
    res.json({
        message: "Reports endpoint accepted",
    });
});

export default router;
