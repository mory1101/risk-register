import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { Parser } from 'json2csv';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());


// Serve everything inside /public
app.use(express.static(path.join(__dirname, 'public')));

// Health check route
app.get('/healthz', (req, res) => res.json({ ok: true }));


// Return risks with ISO title + aggregated NIST mappings (via VIEW)
app.get('/api/risks', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      id, asset, threat, vulnerability,
      likelihood, impact, risk_rating,
      treatment, owner, status,
      iso_control, iso_title, nist_mappings,
      due_date, created_at, updated_at
    FROM risk_with_nist
    ORDER BY risk_rating DESC, id DESC
  `).all();

  res.json(rows);
});


// POST create a new risk
app.post('/api/risks', (req, res) => {
  const {
    asset, threat, vulnerability,
    likelihood, impact,
    treatment, owner, status,
    iso_control, due_date
  } = req.body;

  // Basic validation
  if (!asset || !threat || !vulnerability) {
    return res.status(400).json({ error: "asset, threat, and vulnerability are required" });
  }
  const L = parseInt(likelihood, 10);
  const I = parseInt(impact, 10);
  if (!(L >= 1 && L <= 5)) {
    return res.status(400).json({ error: "likelihood must be 1–5" });
  }
  if (!(I >= 1 && I <= 5)) {
    return res.status(400).json({ error: "impact must be 1–5" });
  }

  // Insert into risks table
  const stmt = db.prepare(`
    INSERT INTO risks
      (asset, threat, vulnerability, likelihood, impact,
       treatment, owner, status, iso_control, due_date)
    VALUES (@asset, @threat, @vulnerability, @likelihood, @impact,
            @treatment, @owner, @status, @iso_control, @due_date)
  `);

  const info = stmt.run({
    asset: asset.trim(),
    threat: threat.trim(),
    vulnerability: vulnerability.trim(),
    likelihood: L,
    impact: I,
    treatment: treatment || 'mitigate',
    owner: owner || null,
    status: status || 'open',
    iso_control: iso_control || null,
    due_date: due_date || null
  });

  // Read it back from the view so it includes ISO/NIST mapping
  const row = db.prepare(`
    SELECT id, asset, threat, vulnerability, likelihood, impact, risk_rating,
           treatment, owner, status, iso_control, iso_title, nist_mappings,
           due_date, created_at, updated_at
    FROM risk_with_nist
    WHERE id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(row);
});

// GET ISO → NIST mapping for dropdowns / drill-downs
app.get('/api/mappings', (req, res) => {
  try {
    // Distinct ISO controls + a stable title
    const isos = db.prepare(`
      SELECT 
        iso_control,
        MIN(COALESCE(iso_title, '')) AS iso_title
      FROM iso_to_csf
      GROUP BY iso_control
      ORDER BY iso_control
    `).all();

    // NIST subcategories for a given ISO control
    const nistStmt = db.prepare(`
      SELECT nist_csf, COALESCE(nist_desc, '') AS nist_desc
      FROM iso_to_csf
      WHERE iso_control = ?
      ORDER BY nist_csf
    `);

    const result = isos.map(({ iso_control, iso_title }) => ({
      iso_control,
      iso_title,
      nist: nistStmt.all(iso_control)
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load mappings' });
  }
});

app.get('/export/csv', (req, res) => {
  // Pull from the enriched view so you include ISO title + NIST mappings
  const risks = db.prepare(`
    SELECT
      id,
      asset,
      threat,
      vulnerability,
      likelihood,
      impact,
      risk_rating,
      treatment,           -- note: not "mitigation"
      owner,
      status,
      iso_control,
      iso_title,
      nist_mappings,
      due_date,
      created_at,
      updated_at
    FROM risk_with_nist
    ORDER BY risk_rating DESC, id DESC
  `).all();

  // Choose the columns you want in the CSV (adjust order to taste)
  const fields = [
    'id',
    'asset',
    'threat',
    'vulnerability',
    'likelihood',
    'impact',
    'risk_rating',
    'treatment',          // ✅ matches your schema
    'owner',
    'status',
    'iso_control',
    'iso_title',
    'nist_mappings',
    'due_date',
    'created_at',
    'updated_at'
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(risks);

  res.header('Content-Type', 'text/csv');
  res.attachment('risk_register.csv');
  return res.send(csv);
});







const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
