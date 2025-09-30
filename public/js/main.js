// --- Scoring config (drives dropdown labels + tooltips) ---
const SCORING = {
  likelihood: [
    { score: 1, label: "Rare", desc: "≤ once in 5 years; strong deterrents; no history" },
    { score: 2, label: "Unlikely", desc: "Once every 2–5 years; needs specific conditions" },
    { score: 3, label: "Possible", desc: "Once per 1–2 years; observed in industry; partial controls" },
    { score: 4, label: "Likely", desc: "Quarterly–annually; active campaigns; high exposure" },
    { score: 5, label: "Very likely", desc: "Monthly+; widespread exploits; known weakness" }
  ],
  impact: [
    { score: 1, label: "Negligible", desc: "No material harm; <1h minor blip; trivial cost" },
    { score: 2, label: "Low", desc: "Small subset; <4h localized outage; <$10k" },
    { score: 3, label: "Moderate", desc: "Noticeable; 4–24h partial outage; $10k–$100k" },
    { score: 4, label: "High", desc: "Major segment; 1–3 days loss or data compromise; $100k–$1M" },
    { score: 5, label: "Severe", desc: "Enterprise-level; >3 days outage or widespread breach; >$1M; regulatory" }
  ],
  bands: [
    { min: 1, max: 5, label: "Low" },
    { min: 6, max: 10, label: "Moderate" },
    { min: 11, max: 15, label: "High" },
    { min: 16, max: 25, label: "Critical" }
  ]
};

function populateScoreSelect(selectEl, items) {
  selectEl.innerHTML = "";
  items.forEach(({ score, label, desc }) => {
    const opt = document.createElement("option");
    opt.value = String(score);
    opt.textContent = `${score} — ${label}`;
    opt.title = desc; // native tooltip on hover
    selectEl.appendChild(opt);
  });
}




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

async function loadMappings() {
  const res = await fetch('/api/mappings');
  if (!res.ok) return [];
  return res.json();
}

async function populateIsoDropdown() {
  const isoSelect = document.getElementById('isoControl');
  const help = document.getElementById('isoHelp');
  if (!isoSelect) return;

  const mappings = await loadMappings();

  // Populate dropdown
  mappings.forEach(({ iso_control, iso_title }) => {
    const opt = document.createElement('option');
    opt.value = iso_control;
    opt.textContent = iso_title
      ? `${iso_control} — ${iso_title}`
      : iso_control;
    isoSelect.appendChild(opt);
  });

  // Show mapped NIST on change
  isoSelect.addEventListener('change', () => {
    const selected = mappings.find(m => m.iso_control === isoSelect.value);
    if (!selected) {
      help.textContent = '';
      return;
    }
    help.textContent = selected.nist
      .map(x => `${x.nist_csf} — ${x.nist_desc}`)
      .join(' | ');
  });
}


async function init() {
  const rows = await fetchRisks();
  renderTable(rows);
  await populateIsoDropdown();  // you added earlier
  // NEW: populate scoring selects
  populateScoreSelect(document.getElementById('likelihoodSelect'), SCORING.likelihood);
  populateScoreSelect(document.getElementById('impactSelect'), SCORING.impact);
  wireForm();
  wireScoreHelp();
}



init();


