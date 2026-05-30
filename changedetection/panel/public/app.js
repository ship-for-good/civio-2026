const form = document.getElementById("mapping-form");
const mappingsBody = document.getElementById("mappings-body");
const mappingsTable = document.getElementById("mappings-table");
const mappingsEmpty = document.getElementById("mappings-empty");
const alertBox = document.getElementById("alert");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const configHint = document.getElementById("config-hint");
const submitBtn = document.getElementById("submit-btn");
const refreshBtn = document.getElementById("refresh-btn");

function showAlert(message) {
  alertBox.hidden = false;
  alertBox.textContent = message;
}

function clearAlert() {
  alertBox.hidden = true;
  alertBox.textContent = "";
}

function formatIntervalLabel(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value)) return "—";
  if (value % 60 === 0 && value >= 60) {
    const hours = value / 60;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return value === 1 ? "1 minuto" : `${value} minutos`;
}

function getIntervalMinutes(mapping) {
  const tbc = mapping.time_between_check;
  if (tbc) {
    return (
      (tbc.weeks || 0) * 7 * 24 * 60 +
      (tbc.days || 0) * 24 * 60 +
      (tbc.hours || 0) * 60 +
      (tbc.minutes || 0) +
      Math.floor((tbc.seconds || 0) / 60)
    );
  }
  if (mapping.checkIntervalMinutes != null) {
    return Number(mapping.checkIntervalMinutes);
  }
  if (mapping.checkIntervalHours != null) {
    return Number(mapping.checkIntervalHours) * 60;
  }
  return 30;
}

function formatTimestamp(unixSeconds) {
  if (!unixSeconds) return "Sin datos";
  return new Date(unixSeconds * 1000).toLocaleString("es-ES");
}

function renderStatus(status) {
  submitBtn.disabled = false;
  const issues = [];

  if (!status.smtpConfigured) {
    issues.push(
      "Configura <code>SMTP_HOST</code> y <code>NOTIFICATION_EMAIL_FROM</code> en <code>.env</code>."
    );
  }

  if (issues.length) {
    statusDot.className = "status-dot warn";
    statusText.textContent = "Configuración incompleta";
    configHint.hidden = false;
    configHint.innerHTML = issues.join("<br />");
    submitBtn.disabled = true;
    return;
  }

  configHint.hidden = true;

  if (status.connected) {
    statusDot.className = "status-dot ok";
    statusText.textContent = `Conectado · SMTP ${status.smtpHost}:${status.smtpPort}`;
    return;
  }

  statusDot.className = "status-dot warn";
  statusText.textContent = status.error || "Sin conexión a changedetection.io";
}

function renderMappings(mappings) {
  mappingsBody.innerHTML = "";

  if (!mappings.length) {
    mappingsTable.hidden = true;
    mappingsEmpty.hidden = false;
    return;
  }

  mappingsTable.hidden = false;
  mappingsEmpty.hidden = true;

  for (const mapping of mappings) {
    const row = document.createElement("tr");

    const lastChanged = mapping.watchStatus?.lastChanged;
    let badgeClass = lastChanged ? "badge" : "badge warn";
    let badgeText = lastChanged
      ? `Cambio: ${formatTimestamp(lastChanged)}`
      : "Sin cambios aún";
    if (mapping.watchMissing) {
      badgeClass = "badge warn";
      badgeText = "Watch no encontrado en ChangeDetection";
    }

    row.innerHTML = `
      <td class="url-cell">
        <strong>${escapeHtml(mapping.title)}</strong><br />
        <a href="${escapeHtml(mapping.url)}" target="_blank" rel="noreferrer">${escapeHtml(mapping.url)}</a>
      </td>
      <td>${escapeHtml(mapping.email)}</td>
      <td>${formatIntervalLabel(getIntervalMinutes(mapping))}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
      <td>
        <button type="button" class="danger" data-id="${mapping.id}">Eliminar</button>
      </td>
    `;

    mappingsBody.appendChild(row);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Error inesperado");
  }

  return body;
}

async function loadStatus() {
  const status = await api("/api/status");
  renderStatus(status);
}

async function loadMappings() {
  clearAlert();
  const mappings = await api(`/api/mappings?_=${Date.now()}`);
  renderMappings(mappings);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAlert();

  const data = Object.fromEntries(new FormData(form));
  data.checkIntervalMinutes = Number(data.checkIntervalMinutes);

  try {
    submitBtn.disabled = true;
    await api("/api/mappings", {
      method: "POST",
      body: JSON.stringify(data),
    });
    form.reset();
    form.elements.checkIntervalMinutes.value = "30";
    await loadMappings();
  } catch (error) {
    showAlert(error.message);
  } finally {
    submitBtn.disabled = false;
    await loadStatus();
  }
});

mappingsBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const id = button.dataset.id;
  if (!confirm("¿Eliminar este monitor y dejar de enviar notificaciones?")) {
    return;
  }

  try {
    await api(`/api/mappings/${id}`, { method: "DELETE" });
    await loadMappings();
  } catch (error) {
    showAlert(error.message);
    await loadMappings();
  }
});

refreshBtn.addEventListener("click", async () => {
  try {
    await loadStatus();
    await loadMappings();
  } catch (error) {
    showAlert(error.message);
  }
});

async function init() {
  try {
    await loadStatus();
    await loadMappings();
  } catch (error) {
    showAlert(error.message);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    loadMappings().catch(() => {});
  }
});

init();
