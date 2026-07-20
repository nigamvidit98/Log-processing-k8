const logForm = document.getElementById('log-form');
const statusBox = document.getElementById('status');
const logTableBody = document.getElementById('log-table-body');
const logsTitle = document.getElementById('logs-title');
const refreshAllButton = document.getElementById('refresh-all');
const refreshErrorsButton = document.getElementById('refresh-errors');
const clearLogsButton = document.getElementById('clear-logs');
const sampleLogButton = document.getElementById('sample-log');
const healthButton = document.getElementById('health-check');

const API_BASE_URL = window.__API_BASE_URL__ || 'http://127.0.0.1:8000';
let currentView = 'all';

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = isError ? 'status error' : 'status';
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getSeverityClass(severity) {
  return (severity || 'info').toLowerCase();
}

function renderLogs(logs) {
  if (!logs.length) {
    logTableBody.innerHTML = '<tr><td colspan="5" class="empty">No logs available yet.</td></tr>';
    return;
  }

  logTableBody.innerHTML = logs
    .slice()
    .reverse()
    .map(
      (log) => `
        <tr class="severity-${getSeverityClass(log.severity)}">
          <td>${log.hostname}</td>
          <td>${log.application}</td>
          <td><span class="pill">${log.severity}</span></td>
          <td>${log.message}</td>
          <td>${log.timestamp}</td>
        </tr>
      `
    )
    .join('');
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'The request failed.');
  }
  return response.json();
}

async function loadLogs(endpoint = '/logs', title = 'All logs') {
  try {
    const logs = await requestJson(endpoint);
    logsTitle.textContent = title;
    renderLogs(logs);
    setStatus('Logs loaded successfully.');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function showHealthStatus() {
  try {
    const health = await requestJson('/health');
    setStatus(`Backend health: ${health.status}`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

logForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    hostname: document.getElementById('hostname').value,
    application: document.getElementById('application').value,
    severity: document.getElementById('severity').value,
    message: document.getElementById('message').value,
  };

  try {
    await requestJson('/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    logForm.reset();
    setStatus('Log submitted successfully.');
    if (currentView === 'errors') {
      await loadLogs('/logs/error', 'ERROR logs');
    } else {
      await loadLogs('/logs', 'All logs');
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

sampleLogButton.addEventListener('click', async () => {
  const severities = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
  const payload = {
    hostname: `host-${Math.floor(Math.random() * 1000)}`,
    application: ['auth-service', 'billing-service', 'search-service'][Math.floor(Math.random() * 3)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    message: `Sample event ${Math.floor(Math.random() * 1000)}`,
  };

  try {
    await requestJson('/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setStatus('Sample log generated.');
    if (currentView === 'errors') {
      await loadLogs('/logs/error', 'ERROR logs');
    } else {
      await loadLogs('/logs', 'All logs');
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

refreshAllButton.addEventListener('click', async () => {
  currentView = 'all';
  await loadLogs('/logs', 'All logs');
});

refreshErrorsButton.addEventListener('click', async () => {
  currentView = 'errors';
  await loadLogs('/logs/error', 'ERROR logs');
});

clearLogsButton.addEventListener('click', async () => {
  try {
    await requestJson('/logs', { method: 'DELETE' });
    setStatus('All logs deleted.');
    await loadLogs('/logs', 'All logs');
  } catch (error) {
    setStatus(error.message, true);
  }
});

healthButton.addEventListener('click', showHealthStatus);

loadLogs('/logs', 'All logs');
