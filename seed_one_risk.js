// seed_one_risk.js
import db from './db.js';

const insert = db.prepare(`
  INSERT INTO risks
    (asset, threat, vulnerability, likelihood, impact, treatment, owner, status, iso_control, due_date)
  VALUES
    (@asset, @threat, @vulnerability, @likelihood, @impact, @treatment, @owner, @status, @iso_control, @due_date)
`);

const info = insert.run({
  asset: 'Customer Database',
  threat: 'Data Breach (hacker)',
  vulnerability: 'Unpatched SQL server',
  likelihood: 4,
  impact: 4,
  treatment: 'mitigate',
  owner: 'IT Security',
  status: 'open',
  iso_control: 'A.9.2.3',  // maps to PR.AC-1 and PR.AC-7
  due_date: '2025-11-01'
});

console.log('Inserted risk id:', info.lastInsertRowid);

// Check via view
const row = db.prepare(`
  SELECT id, asset, iso_control, iso_title, nist_mappings
  FROM risk_with_nist
  WHERE id = ?
`).get(info.lastInsertRowid);

console.log('View result:', row);
