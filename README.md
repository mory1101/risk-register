Title: Cybersecurity Risk Register — Web App (Work in progress)

One-line: Web-based risk register to identify, score, and track cybersecurity risks with ISO 27001 / NIST CSF mapping.

About
This project is a practical risk register designed to help small/medium teams inventory assets, assess likelihood & impact, and map ISO/NIST controls to each risk. The repo is open-source and actively maintained.


Screenshots
./screenshots/dashboard.png

Features

Likelihood & impact scoring engine (configurable scales - see below)

Risk matrix and prioritization view

Mapping to ISO 27001 controls and NIST CSF functions

Basic CRUD for assets, risks, and mitigations

Exportable CSV/Excel reports for stakeholders

Tech stack

Backend: Node.js + Express 

Database: SQLite

Frontend: HTML, CSS, AND JAVASCRIPT

How to run (short)

## How to run
1. Clone the repository  
   git clone https://github.com/mory1101/risk-register.git 
   `cd risk-register`  

2. Install dependencies  
   `npm install`  

3. Start the server  
   `npm start`  

By default, the app runs on **http://localhost:3000**.  
If you want to run it on a different port, set the PORT environment variable before starting:  

### On Linux/macOS:
`PORT=8000 npm start`

### On Windows (Powershell):
`$env:PORT=8000; npm start`




## Scoring Methodology

**Likelihood (1–5)** estimates frequency (threat activity, exposure, control strength).  
**Impact (1–5)** captures reasonable-worst-case business harm (take the maximum across confidentiality, integrity, availability, regulatory/legal, financial, reputation).  
**Risk Rating** = Likelihood × Impact. Bands: Low (1–5), Moderate (6–10), High (11–15), Critical (16–25).

### Likelihood scale
1 — Rare: ≤ once in 5 years; strong deterrents; no history  
2 — Unlikely: Once every 2–5 years; specific conditions  
3 — Possible: Once per 1–2 years; observed in industry  
4 — Likely: Quarterly–annually; active campaigns; high exposure  
5 — Very likely: Monthly+; widespread exploits; known weakness

### Impact scale
1 — Negligible: No material harm; <1h minor blip; trivial cost  
2 — Low: Small subset; <4h localized outage; <$10k  
3 — Moderate: Noticeable; 4–24h partial outage; $10k–$100k  
4 — High: Major segment; 1–3 days loss or data compromise; $100k–$1M  
5 — Severe/Critical: Enterprise-level; >3 days outage or widespread breach; >$1M; regulatory
