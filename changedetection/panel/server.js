const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "mappings.json");

const CHANGEDETECTION_URL =
  process.env.CHANGEDETECTION_URL || "http://changedetection:5000";
const CHANGEDETECTION_API_KEY =
  process.env.CHANGEDETECTION_API_KEY || "civio-monitor-dev";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT || "587";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const EMAIL_FROM = process.env.NOTIFICATION_EMAIL_FROM || "";
const DEFAULT_CHECK_MINUTES = Number(process.env.DEFAULT_CHECK_MINUTES || 30);
const MIN_CHECK_MINUTES = Number(process.env.MIN_CHECK_MINUTES || 1);
const MAX_CHECK_MINUTES = Number(process.env.MAX_CHECK_MINUTES || 10080);

app.use(express.json());
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.static(path.join(__dirname, "public")));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readMappings() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeMappings(mappings) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(mappings, null, 2), "utf8");
}

function buildNotificationUrl(email) {
  if (!SMTP_HOST || !EMAIL_FROM) {
    throw new Error(
      "SMTP no configurado. Define SMTP_HOST y NOTIFICATION_EMAIL_FROM en .env."
    );
  }

  const scheme = SMTP_SECURE ? "mailtos" : "mailto";
  let auth = "";

  if (SMTP_USER && SMTP_PASSWORD) {
    auth = `${encodeURIComponent(SMTP_USER)}:${encodeURIComponent(SMTP_PASSWORD)}@`;
  } else if (SMTP_USER) {
    auth = `${encodeURIComponent(SMTP_USER)}@`;
  }

  const params = new URLSearchParams({
    to: email,
    from: EMAIL_FROM,
  });

  return `${scheme}://${auth}${SMTP_HOST}:${SMTP_PORT}?${params.toString()}`;
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function changedetectionRequest(route, options = {}) {
  const response = await fetch(`${CHANGEDETECTION_URL}/api/v1${route}`, {
    ...options,
    headers: {
      "x-api-key": CHANGEDETECTION_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      typeof body === "object" && body?.message
        ? body.message
        : `Changedetection API error (${response.status})`
    );
    error.statusCode = response.status;
    error.details = body;
    throw error;
  }

  return body;
}

function minutesToTimeBetweenCheck(minutes) {
  return {
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: Number(minutes),
    seconds: 0,
  };
}

function timeBetweenCheckToMinutes(timeBetweenCheck) {
  if (!timeBetweenCheck) {
    return DEFAULT_CHECK_MINUTES;
  }
  return (
    (timeBetweenCheck.weeks || 0) * 7 * 24 * 60 +
    (timeBetweenCheck.days || 0) * 24 * 60 +
    (timeBetweenCheck.hours || 0) * 60 +
    (timeBetweenCheck.minutes || 0) +
    Math.floor((timeBetweenCheck.seconds || 0) / 60)
  );
}

function resolveIntervalMinutes(value, legacyHours, timeBetweenCheck) {
  if (timeBetweenCheck) {
    return timeBetweenCheckToMinutes(timeBetweenCheck);
  }
  if (value != null && value !== "") {
    return Number(value);
  }
  if (legacyHours != null && legacyHours !== "") {
    return Number(legacyHours) * 60;
  }
  return DEFAULT_CHECK_MINUTES;
}

function buildMappingRecord({
  url,
  email,
  title,
  intervalMinutes,
  watchUuid,
  id,
  createdAt,
}) {
  return {
    id: id || crypto.randomUUID(),
    url,
    email,
    title: title || url,
    watchUuid,
    createdAt: createdAt || new Date().toISOString(),
    time_between_check_use_default: false,
    time_between_check: minutesToTimeBetweenCheck(intervalMinutes),
  };
}

function validateIntervalMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < MIN_CHECK_MINUTES) {
    return `El intervalo mínimo es ${MIN_CHECK_MINUTES} minuto(s).`;
  }
  if (minutes > MAX_CHECK_MINUTES) {
    return `El intervalo máximo es ${MAX_CHECK_MINUTES} minutos.`;
  }
  return null;
}

function formatIntervalLabel(minutes) {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

function buildWatchPayload({ url, email, title, checkIntervalMinutes }) {
  return {
    url,
    title: title || url,
    notification_urls: [buildNotificationUrl(email)],
    fetch_backend: "html_webdriver",
    time_between_check_use_default: false,
    time_between_check: minutesToTimeBetweenCheck(checkIntervalMinutes),
  };
}

async function enrichMapping(mapping) {
  if (!mapping.watchUuid) {
    return { ...mapping, watchStatus: null };
  }

  try {
    const watch = await changedetectionRequest(`/watch/${mapping.watchUuid}`);
    return {
      ...mapping,
      watchStatus: {
        lastChecked: watch.last_checked || null,
        lastChanged: watch.last_changed || null,
        paused: Boolean(watch.paused),
      },
    };
  } catch (error) {
    return {
      ...mapping,
      watchStatus: null,
      watchMissing: error.statusCode === 404,
    };
  }
}

app.get("/api/status", async (_req, res) => {
  const status = {
    smtpConfigured: Boolean(SMTP_HOST && EMAIL_FROM),
    changedetectionUrl: CHANGEDETECTION_URL,
    smtpHost: SMTP_HOST || null,
    smtpPort: SMTP_PORT,
    connected: false,
  };

  try {
    await changedetectionRequest("/watch");
    status.connected = true;
  } catch (error) {
    status.error = error.message;
  }

  res.json(status);
});

app.get("/api/mappings", async (_req, res) => {
  try {
    const mappings = readMappings();
    const enriched = await Promise.all(mappings.map(enrichMapping));
    res.json(enriched);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/mappings", async (req, res) => {
  try {
    const {
      url,
      email,
      title,
      checkIntervalMinutes,
      checkIntervalHours,
      time_between_check,
    } = req.body;
    const intervalMinutes = resolveIntervalMinutes(
      checkIntervalMinutes,
      checkIntervalHours,
      time_between_check
    );
    const intervalError = validateIntervalMinutes(intervalMinutes);

    if (!url || !email) {
      return res.status(400).json({ error: "URL y email son obligatorios." });
    }
    if (intervalError) {
      return res.status(400).json({ error: intervalError });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "La URL debe ser http:// o https://" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email no válido." });
    }

    const watch = await changedetectionRequest("/watch", {
      method: "POST",
      body: JSON.stringify(
        buildWatchPayload({
          url,
          email,
          title,
          checkIntervalMinutes: intervalMinutes,
        })
      ),
    });

    const mapping = buildMappingRecord({
      url,
      email,
      title,
      intervalMinutes,
      watchUuid: watch.uuid,
    });

    const mappings = readMappings();
    mappings.push(mapping);
    writeMappings(mappings);

    res.status(201).json(await enrichMapping(mapping));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      details: error.details,
    });
  }
});

app.put("/api/mappings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      url,
      email,
      title,
      checkIntervalMinutes,
      checkIntervalHours,
      time_between_check,
    } = req.body;
    const mappings = readMappings();
    const index = mappings.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Asignación no encontrada." });
    }

    const current = mappings[index];
    const intervalMinutes = resolveIntervalMinutes(
      checkIntervalMinutes ??
        (current.checkIntervalMinutes != null
          ? current.checkIntervalMinutes
          : undefined),
      checkIntervalHours ?? current.checkIntervalHours,
      time_between_check ?? current.time_between_check
    );

    const next = buildMappingRecord({
      id: current.id,
      url: url ?? current.url,
      email: email ?? current.email,
      title: title ?? current.title,
      intervalMinutes,
      watchUuid: current.watchUuid,
      createdAt: current.createdAt,
    });

    const intervalError = validateIntervalMinutes(intervalMinutes);
    if (intervalError) {
      return res.status(400).json({ error: intervalError });
    }

    if (!isValidUrl(next.url)) {
      return res.status(400).json({ error: "La URL debe ser http:// o https://" });
    }
    if (!isValidEmail(next.email)) {
      return res.status(400).json({ error: "Email no válido." });
    }

    await changedetectionRequest(`/watch/${current.watchUuid}`, {
      method: "PUT",
      body: JSON.stringify(
        buildWatchPayload({
          url: next.url,
          email: next.email,
          title: next.title,
          checkIntervalMinutes: intervalMinutes,
        })
      ),
    });

    mappings[index] = next;
    writeMappings(mappings);

    res.json(await enrichMapping(next));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      details: error.details,
    });
  }
});

app.delete("/api/mappings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mappings = readMappings();
    const index = mappings.findIndex((item) => item.id === id);

    if (index === -1) {
      // Ya eliminado (p. ej. edición manual de mappings.json)
      return res.status(204).send();
    }

    const [removed] = mappings.splice(index, 1);
    writeMappings(mappings);

    if (removed.watchUuid) {
      try {
        await changedetectionRequest(`/watch/${removed.watchUuid}`, {
          method: "DELETE",
        });
      } catch (error) {
        if (error.statusCode !== 404) {
          mappings.splice(index, 0, removed);
          writeMappings(mappings);
          throw error;
        }
      }
    }

    res.status(204).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      details: error.details,
    });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

ensureDataFile();
app.listen(PORT, () => {
  console.log(`Config panel listening on http://0.0.0.0:${PORT}`);
});
