import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./src/config/env.js";
import { sequelize } from "./src/config/database.js";
import { Link } from "./src/models/index.js";
import { LinkRepository } from "./src/repositories/LinkRepository.js";
import { LinkService } from "./src/services/LinkService.js";
import { LinkController } from "./src/controllers/LinkController.js";
import { createLinkRoutes } from "./src/routes/linkRoutes.js";

const app = express();

app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
  })
);
app.use(cors({ origin: env.corsOrigins }));

const linkRepository = new LinkRepository();
const linkService = new LinkService(linkRepository);
const linkController = new LinkController(linkService);

app.use("/api", createLinkRoutes(linkController));

// simple error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code) {
    res.status(err.statusCode || 400).json({ error: err.code, message: err.message });
    return;
  }
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    if (env.dbAutoSync) {
      await sequelize.sync();
      console.log("Database synchronized (sequelize.sync).");
    }
    const PORT = env.port || 3000;
    const server = app.listen(PORT, () => {
      console.log(`API server running at http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or change the PORT environment variable.`);
        process.exit(1);
      }
      console.error('Server error', err);
      process.exit(1);
    });

    // run cleanup once and periodically
    await linkService.cleanupExpiredLinks();
    setInterval(() => {
      linkService.cleanupExpiredLinks().then((deleted) => {
        if (deleted) console.log(`Cleaned up ${deleted} expired links.`);
      });
    }, env.cleanupIntervalMs);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
