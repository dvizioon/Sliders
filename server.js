import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PISTON_URL = process.env.PISTON_URL || "http://127.0.0.1:2000";
const PORT = Number(process.env.PORT) || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const PISTON_MAX_TIMEOUT = Number(process.env.PISTON_MAX_TIMEOUT) || 3000;
const ALLOWED_LANGUAGES = (process.env.ALLOWED_LANGUAGES || "java")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "64kb" }));

const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas execuções. Aguarde um minuto e tente de novo." }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, piston: PISTON_URL });
});

app.post("/execute", executeLimiter, async (req, res) => {
  try {
    const { language, version, files, stdin, run_timeout } = req.body || {};

    if (!language || !ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        error: `Linguagem não permitida. Permitidas: ${ALLOWED_LANGUAGES.join(", ")}`
      });
    }

    if (!version) {
      return res.status(400).json({ error: "Campo version é obrigatório." });
    }

    if (!Array.isArray(files) || !files.length || !files[0].content) {
      return res.status(400).json({ error: "Campo files é obrigatório." });
    }

    const safeTimeout = Math.min(Number(run_timeout) || 3000, PISTON_MAX_TIMEOUT);

    const pistonRes = await fetch(`${PISTON_URL.replace(/\/$/, "")}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version,
        files,
        stdin: stdin || "",
        run_timeout: safeTimeout
      })
    });

    const data = await pistonRes.json();
    res.status(pistonRes.status).json(data);
  } catch (err) {
    console.error("Erro no proxy Piston:", err.message);
    res.status(502).json({
      error: `Falha ao conectar no Piston (${PISTON_URL}). Confira o .env e se o serviço está no ar.`
    });
  }
});

app.use(express.static(__dirname));

app.listen(PORT, async () => {
  console.log(`Slides:  http://localhost:${PORT}`);
  console.log(`Proxy:   POST http://localhost:${PORT}/execute`);
  console.log(`Piston:  ${PISTON_URL}`);

  try {
    const health = await fetch(`${PISTON_URL.replace(/\/$/, "")}/api/v2/runtimes`);
    if (!health.ok) {
      console.warn(`AVISO: Piston respondeu status ${health.status}. Execução pode falhar.`);
    } else {
      console.log("Piston:  conectado");
    }
  } catch (err) {
    console.warn(`AVISO: Piston inacessível em ${PISTON_URL} — ${err.message}`);
  }
});
