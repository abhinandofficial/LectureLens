import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "LectureLens API is running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;