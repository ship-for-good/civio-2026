const fs = require("fs");
const path = require("path");

const DATASTORE = process.env.CHANGEDETECTION_DATASTORE || "/datastore";
const API_KEY = process.env.CHANGEDETECTION_API_KEY || "civio-monitor-dev";
const STORE_FILE = path.join(DATASTORE, "url-watches.json");

function writeStore(data) {
  const tmp = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, STORE_FILE);
}

function ensureApiKey() {
  if (!fs.existsSync(DATASTORE)) {
    fs.mkdirSync(DATASTORE, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    writeStore({
      settings: {
        application: {
          api_access_token: API_KEY,
          api_access_token_enabled: true,
        },
      },
    });
    console.log(`Created datastore with static API key (${API_KEY})`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
  data.settings ??= {};
  data.settings.application ??= {};

  const current = data.settings.application.api_access_token;
  if (current === API_KEY) {
    console.log("API key already configured");
    return;
  }

  data.settings.application.api_access_token = API_KEY;
  data.settings.application.api_access_token_enabled = true;
  writeStore(data);
  console.log(`Updated API key in datastore (${API_KEY})`);
}

ensureApiKey();
