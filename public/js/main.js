async function fetchRisks() {
  const res = await fetch('/api/risks');
  if (!res.ok) {
    console.error('Failed to fetch risks');
    return [];
  }
  return res.json();
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderTable(rows) {
  const tbody = document.querySelector('#riskTable tbody');
  tbody.innerHTML = ''; // clear

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.id)}</td>
      <td>${escapeHtml(r.asset)}</td>
      <td>${escapeHtml(r.threat)}</td>
      <td>${escapeHtml(r.likelihood)}</td>
      <td>${escapeHtml(r.impact)}</td>
      <td>${escapeHtml(r.risk_rating)}</td>
      <td>${escapeHtml(r.iso_control ?? '')}</td>
      <td>${escapeHtml(r.iso_title ?? '')}</td>
      <td>${escapeHtml(r.nist_mappings ?? '')}</td>
      <td>${escapeHtml(r.owner ?? '')}</td>
      <td>${escapeHtml(r.status)}</td>
      <td>${escapeHtml(r.due_date ?? '')}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function init() {
  const rows = await fetchRisks();
  renderTable(rows);
}

init();

async function createRisk(payload) {
  const res = await fetch('/api/risks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create risk');
  }
  return res.json();
}

function getFormData(form) {
  const fd = new FormData(form);
  // Convert numeric fields
  const toInt = (v) => (v === '' ? undefined : parseInt(v, 10));
  return {
    asset: fd.get('asset'),
    threat: fd.get('threat'),
    vulnerability: fd.get('vulnerability'),
    likelihood: toInt(fd.get('likelihood')),
    impact: toInt(fd.get('impact')),
    treatment: fd.get('treatment') || 'mitigate',
    owner: fd.get('owner') || undefined,
    status: fd.get('status') || 'open',
    iso_control: fd.get('iso_control') || undefined,
    due_date: fd.get('due_date') || undefined,
  };
}

function wireForm() {
  const form = document.getElementById('riskForm');
  const msg = document.getElementById('formMsg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Saving...';
    try {
      const payload = getFormData(form);
      await createRisk(payload);
      msg.textContent = 'Saved ✅';
      form.reset();
      // Reload table
      const rows = await fetchRisks();
      renderTable(rows);
    } catch (err) {
      console.error(err);
      msg.textContent = 'Error: ' + err.message;
    }
    setTimeout(() => (msg.textContent = ''), 2000);
  });
}

async function init() {
  const rows = await fetchRisks();
  renderTable(rows);
  wireForm();
}

init();


