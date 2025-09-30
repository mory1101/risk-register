import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';


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



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
