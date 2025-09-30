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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
