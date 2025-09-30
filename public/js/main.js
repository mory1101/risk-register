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

