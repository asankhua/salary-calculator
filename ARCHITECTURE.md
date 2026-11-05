# Takehome — Architecture

**Author:** Ashish Kumar Sankhua
**Last Updated:** November 2026
**Status:** Live

**Live page:** https://asankhua.github.io/salary-calculator/

---

## Overview

A browser-only salary structure and in-hand calculator for an Indian offer letter, FY 2026-27. The user types an Annual Total Base Pay. The page builds the salary split, runs the new regime and the old regime, and can estimate gratuity. Nothing is posted to a server.

---

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Page | HTML | One document. Form, results, assumptions |
| Styles | CSS | Responsive layout and print styles. No framework |
| Logic | JavaScript, one IIFE | `app.js`. No build step |
| Type | Inter, Plus Jakarta Sans | Google Fonts. The only network request besides loading the page |
| Host | GitHub Pages | Static files from `main` |
| Backend | None | No API, database, or account |
| Storage | None | The salary stays in the tab |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEB BROWSER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Takehome                                                │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌────────────┐  │   │
│  │  │ Salary      │  │ Results          │  │ Gratuity   │  │   │
│  │  │ inputs      │  │ in-hand, tax,    │  │ 15 ÷ 26    │  │   │
│  │  │             │  │ structure, slabs │  │            │  │   │
│  │  └─────────────┘  └──────────────────┘  └────────────┘  │   │
│  │                                                          │   │
│  │  Pipeline: Parse › Structure › Tax (new) › Tax (old) › Render │
│  │  Regime on the headline: [New] | [Old]   Both always run │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ input and click events
                              │ no HTTP call for the salary
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         app.js                                   │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ parseAmount  │   │ compute      │   │ taxFor               │ │
│  │ 22.5L, 1.2Cr │──▶│ salary split │──▶│ new regime           │ │
│  │ 800k         │   │              │   │ old regime           │ │
│  └──────────────┘   └──────────────┘   └──────────┬───────────┘ │
│                                                   │             │
│                                                   ▼             │
│                                        ┌──────────────────────┐ │
│                                        │ incomeTax            │ │
│                                        │ slabs, rebate,       │ │
│                                        │ surcharge, 4% cess   │ │
│                                        │ round to nearest ₹10 │ │
│                                        └──────────┬───────────┘ │
│                                                   │             │
│                                                   ▼             │
│                                        ┌──────────────────────┐ │
│                                        │ renderAll            │ │
│                                        │ KPIs, compare,       │ │
│                                        │ structure, waterfall,│ │
│                                        │ tax table, slabs     │ │
│                                        └──────────────────────┘ │
│                                                                  │
│  calculateGratuity    only when the user asks                   │
│  window.print         Save PDF. Results only                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Pages                                                    │
│  Serves index.html, styles.css, app.js                           │
│  Does not receive the salary                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Calculation Flow

```
1. READ
   Annual Total Base Pay.
   Accepts 2250000, 22,50,000, 22.5L, 1.2Cr, 800k.
   Range ₹1,00,000 to ₹1,00,00,00,000.
         │
         ▼
2. STRUCTURE                         compute()
   Basic            40% or 50% of Total Base Pay
   HRA              50% of Basic (Metro) or 40% (Non-metro)
   LTA              16.66% of Basic
   Employer PF      12% of Basic
                    inside Total Base Pay, or over and above it
   Internet         ₹1,000 a month, limited to the balance
   Corporate NPS    none, 10% or 14% of Basic, from special allowance
   Special          the remainder
   Variable pay     percent or fixed amount, on top of Total Base Pay
         │
         ▼
3. TAX, BOTH REGIMES                 taxFor("new"), taxFor("old")
   Gross, deductions, taxable income.
   incomeTax(): slabs, rebate, surcharge, 4% cess.
   Payable tax rounded to the nearest ₹10.
         │
         ▼
4. IN-HAND
   Cash + Variable pay − Employee PF − professional tax − income tax.
   The selected regime changes the tax. It does not change the split.
         │
         ▼
5. RENDER                            renderAll()
   KPIs, regime cards, structure, waterfall, tax table, slabs.
         │
         ▼
6. OPTIONAL
   Gratuity, from monthly basic salary.
   Save PDF, via window.print().
   Reset, which clears the amount and the dates.
```

There is no Calculate button. `input` and `click` call this path again.

---

## The Two Regimes

Both run on every update. The choice on the form selects which figures lead the page.

| | New regime | Old regime |
|--|------------|------------|
| Slabs | 0–4 L nil, 5%, 10%, 15%, 20%, 25%, 30% above 24 L | 0–2.5 L nil, 5% to 5 L, 20% to 10 L, 30% above |
| Standard deduction | ₹75,000 | ₹50,000 |
| Rebate | Up to ₹60,000 within ₹12,00,000, with marginal relief | Up to ₹12,500 within ₹5,00,000, no marginal relief |
| Employee PF | Not a deduction | Section 123, up to ₹1,50,000 |
| Employer NPS cap | 14% of Basic | 10% of Basic |
| Surcharge | From ₹50 lakh, capped at 25% | From ₹50 lakh, up to 37% above ₹5 crore |
| Cess | 4% | 4% |

Switching regime does not rebuild the salary split. `renderAll` reads the regime and repaints from the two tax results already computed.

---

## Modules

| Module | Function | Input | Output |
|--------|----------|-------|--------|
| Amount parser | `parseAmount` | Raw field text | Rupees, or an error |
| Percent parser | `parsePercent` | `10` or `10 %` | 0–100 |
| Structure | `compute` | Total Base Pay and the current choices | Component rows |
| Regime tax | `taxFor` | `"new"` or `"old"`, plus the structure | Gross, deductions, tax, in-hand |
| Slab engine | `incomeTax` | Taxable income and regime | Base, rebate, surcharge, cess, total |
| Hints | `basicHint`, `hraHint`, `ptHint` | The other Basic %, city, or cash level | Why the figure did or did not move |
| Gratuity | `calculateGratuity` | Service date, calculation date, monthly basic | Eligibility, tenure, amount |
| Render | `renderAll` | Structure and both tax results | The results column |
| Print | `window.print` | Current results | Browser print dialog. Watermark “Ashish Sankhua” |
| Reset | `resetAll` | — | Empty form, default choices |

---

## What Updates on the Page

`renderAll` writes the blocks in this order:

```
Hints › Structure › KPIs › Regime cards › Waterfall › Tax table › Slabs
```

Gratuity runs again only if the user has already calculated it and then changes the salary. Save PDF stays disabled until a valid Total Base Pay exists.

A warning appears on the structure when the internet allowance is cut to fit Total Base Pay, or when Corporate NPS is capped by the remaining special allowance.

---

## In-hand Identity

```
Gross cash   = Total Base Pay
               − Employer PF, when that PF is included in Total Base Pay
               − Corporate NPS
In-hand      = Gross cash
               + Variable pay
               − Employee PF (12% of Basic)
               − professional tax (₹2,400 a year, if monthly cash pay > ₹15,000)
               − income tax
Total CTC    = Annual Total Base Pay + Variable pay
Retirement   = Employer PF + Employee PF + Corporate NPS
```

Employer PF paid over and above Total Base Pay is not part of Total CTC. Employee PF is still deducted from in-hand, and it still counts toward the old-regime cap of ₹1,50,000.

Employer PF and Corporate NPS above ₹7,50,000 a year together are added to gross salary as a taxable perquisite.

---

## Privacy

| Control | Implementation |
|---------|----------------|
| Salary data | Read from the form. Never posted |
| Persistence | No cookies, local storage, or account for the salary |
| Identity | The form asks for amounts and two gratuity dates. No name, PAN, or employer |
| External request | Google Fonts for Inter and Plus Jakarta Sans |
| Reset | Clears Total Base Pay, Variable pay, and the gratuity dates |
| Disclaimer | Assumptions panel, and the line under the form: illustration only |

Rent, other investments, health insurance, and loan interest are not collected, because they are not used.

---

## Folder Structure

```
.
├── index.html        # Hero, form, results, assumptions, print mark
├── styles.css        # Layout, breakpoints, print
├── app.js            # Parse, structure, tax, gratuity, render
├── ARCHITECTURE.md   # This note
├── CASE-STUDY.md     # Product case study
└── README.md
```

`app.js` keeps the rules in one place: `REGIMES` (slabs, rebate, NPS cap), `STANDARD_DEDUCTION`, `SECTION_80C_CAP` (₹1,50,000), `EMPLOYER_CONTRIB_CAP` (₹7,50,000), and the professional-tax threshold. The rules version string is `reference-sheet-2026.10.15`.

---

## Running

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Opening `index.html` in a browser also works. There is no install and no build.

---

## Deployment

### GitHub Pages

`main` is the site. GitHub Pages serves the repository root.

```
main
 └── index.html
     styles.css?v=
     app.js?v=
        │
        ▼
https://asankhua.github.io/salary-calculator/
```

`index.html` loads the CSS and JavaScript with a version query. Bump `?v=` when those files change so a returning browser does not keep an old copy.

### What a push does not do

There is no server process, no secret, and no sync to another host. A push updates the static files only.

---

## Notes

- No `.env`. No API key. No credential file.
- The salary is not written to a log.
- Fonts are the only third-party request.
- The result is an illustration for a resident individual under 60 with salary income. It is not payroll advice or a tax filing.
