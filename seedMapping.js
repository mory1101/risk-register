import db from './db.js';

// Upsert with descriptive fields
const upsert = db.prepare(`
  INSERT INTO iso_to_csf (iso_control, nist_csf, iso_title, nist_desc)
  VALUES (@iso_control, @nist_csf, @iso_title, @nist_desc)
  ON CONFLICT(iso_control, nist_csf) DO UPDATE SET
    iso_title=excluded.iso_title,
    nist_desc=excluded.nist_desc
`);

const pairs = [
  {
    iso_control: 'A.9.2.3',
    iso_title: 'User password management',
    nist_csf: 'PR.AC-1',
    nist_desc: 'Identities and credentials are managed'
  },
  {
    iso_control: 'A.9.2.3',
    iso_title: 'User password management',
    nist_csf: 'PR.AC-7',
    nist_desc: 'Users are authenticated commensurate with risk'
  },
  {
    iso_control: 'A.12.3.1',
    iso_title: 'Event logging / monitoring',
    nist_csf: 'DE.CM-7',
    nist_desc: 'Monitoring for unauthorized personnel, connections, devices, and software'
  },
  {
    iso_control: 'A.17.1.1',
    iso_title: 'Business continuity planning',
    nist_csf: 'RC.BC-1',
    nist_desc: 'Recovery plans are in place and managed'
  }
];

db.transaction(() => {
  pairs.forEach(p => upsert.run(p));
})();

console.log('Seeded enriched ISO→NIST mappings:', pairs.length);
