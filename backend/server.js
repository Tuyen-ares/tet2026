import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import helmet from "helmet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data.db");
const EXPIRY_MS = 20 * 60 * 1000;
const PUBLIC_DIR = path.join(__dirname, "..", "frontend", "public");

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS links (id TEXT PRIMARY KEY, name TEXT, wish TEXT, min INTEGER, max INTEGER, audio TEXT, created_at INTEGER)"
  );
  db.all("PRAGMA table_info(links)", (err, rows) => {
    if (err) return;
    const hasAudio = rows.some((row) => row.name === "audio");
    if (!hasAudio) {
      db.run("ALTER TABLE links ADD COLUMN audio TEXT");
    }
  });
});

app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple to avoid blocking CDN assets
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
  })
);

const safeInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeMinMax = (min, max) => {
  const safeMin = Math.max(1000, Math.floor(min / 1000) * 1000);
  const safeMax = Math.max(safeMin, Math.floor(max / 1000) * 1000);
  return { safeMin, safeMax };
};

const generateId = () => {
  const seed = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36);
  return `${time}${seed}`.slice(0, 10);
};

app.post("/api/create", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const wish = String(req.body?.wish || "").trim();
  const audio = String(req.body?.audio || "").trim();
  const minInput = safeInt(req.body?.min, 1000);
  const maxInput = safeInt(req.body?.max, 10000);
  const { safeMin, safeMax } = normalizeMinMax(minInput, maxInput);

  if (!name) {
    res.status(400).json({ error: "NAME_REQUIRED" });
    return;
  }

  const id = generateId();
  const createdAt = Date.now();

  db.run(
    "INSERT INTO links (id, name, wish, min, max, audio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, name, wish, safeMin, safeMax, audio, createdAt],
    (err) => {
      if (err) {
        res.status(500).json({ error: "DB_ERROR" });
        return;
      }
      res.json({ id, createdAt, expiresAt: createdAt + EXPIRY_MS });
    }
  );
});

app.get("/api/card/:id", (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    res.status(400).json({ error: "ID_REQUIRED" });
    return;
  }

  db.get(
    "SELECT id, name, wish, min, max, audio, created_at FROM links WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: "DB_ERROR" });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
      }

      const expiresAt = row.created_at + EXPIRY_MS;
      const expired = Date.now() > expiresAt;
      res.json({
        id: row.id,
        name: row.name,
        wish: row.wish || "",
        min: row.min,
        max: row.max,
        audio: row.audio || "",
        createdAt: row.created_at,
        expiresAt,
        expired,
      });
    }
  );
});

app.get("/c/:id", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Cleanup expired links on startup and periodically
const cleanupExpired = () => {
  const threshold = Date.now() - EXPIRY_MS;
  db.run(
    "DELETE FROM links WHERE created_at < ?",
    [threshold],
    function (err) {
      if (err) {
        console.error("Cleanup error:", err);
        return;
      }
      if (this && this.changes) {
        console.log(`Cleaned up ${this.changes} expired links.`);
      }
    }
  );
};

// run once at startup
cleanupExpired();

// run every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);
