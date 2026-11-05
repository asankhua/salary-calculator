# Takehome — Architecture

**Author:** Ashish Kumar Sankhua
**Last Updated:** November 2026
**Status:** Live

**Live page:** https://asankhua.github.io/salary-calculator/

---

## Overview

A browser-only salary structure and in-hand calculator for Indian citizens, FY 2026-27. The user enters an Annual Total Base Pay. The page builds the salary split, compares the new and old tax regimes, and estimates gratuity. Nothing is sent to a server. Results update as the user types.

---

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Markup | HTML | One page, no framework |
| Styles | CSS | Responsive layout and print styles |
| Logic | JavaScript (IIFE) | Structure, tax, gratuity, rendering |
| Fonts | Inter, Plus Jakarta Sans | Loaded from Google Fonts |
| Hosting | GitHub Pages | Static files from `main` |
| Backend | None | No API, database, or account |
| Storage | None | Inputs stay in the page |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEB BROWSER                              │
│                                                                  │
│  index.html                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │  Your details              │  │  Results                   │ │
│  │                            │  │                            │ │
│  │  Annual Total Base Pay     │  │  In-hand · Tax · CTC       │ │
│  │  Basic 40% / 50%           │  │  New regime vs old regime  │ │
│  │  Metro / Non-metro         │  │  Salary structure          │ │
│  │  Corporate NPS             │  │  Take-home waterfall       │ │
│  │  Employer PF included      │  │  Tax table and slabs       │ │
│  │  New regime / Old regime   │  │  Gratuity estimate         │ │
│  │  Professional tax          │  │  Save PDF                  │ │
│  │  Variable pay              │  │                            │ │
│  └─────────────┬──────────────┘  └──────────────▲─────────────┘ │
│                │ input / click                  │ render        │
│                ▼                                │               │
│  app.js                                                          │
│  parseAmount ──▶ compute ──▶ taxFor(new) ──▶ renderAll          │
│                   structure   taxFor(old)                        │
│                                                                  │
│  styles.css   layout · responsive · print watermark             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     No network call for data.
                     The page never stores the salary.
```

---

## Calculation Flow

```
1. READ THE INPUT
   Annual Total Base Pay, from ₹1,00,000 to ₹1,00,00,00,000.
   Shorthand is accepted: 22.5L, 1.2Cr, 800k.
         │
         ▼
2. BUILD THE SALARY STRUCTURE          compute()
   Basic          40% or 50% of Total Base Pay
   HRA            50% of Basic (Metro) or 40% (Non-metro)
   LTA            16.66% of Basic
   Employer PF    12% of Basic
                  inside Total Base Pay, or over and above it
   Internet       ₹1,000 a month, limited to the balance
   Corporate NPS  None, 10% or 14% of Basic, from special allowance
   Special        whatever remains of Total Base Pay
         │
         ▼
3. TAX BOTH REGIMES                    taxFor("new") and taxFor("old")
   Gross salary, deductions, taxable income, slab tax,
   rebate, surcharge, 4% cess. Tax is rounded to the nearest ₹10.
         │
         ▼
4. IN-HAND
   Cash salary + Variable pay − Employee PF − professional tax − income tax.
   The chosen regime changes the tax. It does not change the salary split.
         │
         ▼
5. RENDER
   KPIs, regime comparison, structure, waterfall, tax table, slabs.
   Gratuity is calculated only when the user asks for it.
```

---

## Salary Structure

| Component | Rule | Where it sits |
|-----------|------|----------------|
| Basic | 40% or 50% of Annual Total Base Pay | Cash |
| HRA | Metro 50% of Basic. Non-metro 40% of Basic | Cash |
| LTA | 16.66% of Basic | Cash, paid every month |
| Employer PF | 12% of Basic | Inside Total Base Pay, or over and above |
| Internet | ₹1,000 a month | Cash, reduced if Total Base Pay runs out |
| Corporate NPS | 0%, 10% or 14% of Basic | Taken from special allowance |
| Special allowance | Balance of Total Base Pay | Cash |
| Variable pay | % of Total Base Pay, or a fixed amount | On top of Total Base Pay |

Metro cities: Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad.

HRA and special allowance are both paid as salary. Rent is not claimed, so switching Metro and Non-metro usually leaves in-hand unchanged. The hint under HRA says so. In-hand moves only when the higher HRA leaves less room for Corporate NPS or the internet allowance.

Total CTC is Annual Total Base Pay plus Variable pay. Employer PF paid over and above Total Base Pay is not part of Total CTC.

Retirement savings are Employer PF + Employee PF + Corporate NPS.

---

## Tax

Both regimes are always calculated. The selected regime sets the headline figures.

| | New regime | Old regime |
|--|------------|------------|
| Slabs | 0–4 L nil, 4–8 L 5%, 8–12 L 10%, 12–16 L 15%, 16–20 L 20%, 20–24 L 25%, above 24 L 30% | 0–2.5 L nil, 2.5–5 L 5%, 5–10 L 20%, above 10 L 30% |
| Standard deduction | ₹75,000 | ₹50,000 |
| Rebate | Up to ₹60,000 when taxable income is within ₹12,00,000, with marginal relief | Up to ₹12,500 when taxable income is within ₹5,00,000, no marginal relief |
| Employee PF | Not deducted | Section 123 (earlier 80C), up to ₹1,50,000 |
| Employer NPS | Up to 14% of Basic | Up to 10% of Basic |
| Surcharge | From ₹50 lakh, capped at 25% | From ₹50 lakh, up to 37% above ₹5 crore |
| Cess | 4% | 4% |

Professional tax is ₹200 a month (₹2,400 a year) under both regimes, only when monthly cash pay is above ₹15,000.

Employer PF and Corporate NPS above ₹7,50,000 a year together are added as a taxable perquisite.

These are not claimed: HRA exemption, LTA exemption, other section 123 investments, health insurance, and loan interest.

---

## In-hand

```
Gross cash     Total Base Pay
               − Employer PF, when it is included in Total Base Pay
               − Corporate NPS
+ Variable     paid on top, spread across 12 months
− Employee PF  12% of Basic
− Prof. tax    ₹2,400 a year, when monthly cash pay is above ₹15,000
− Income tax   slab tax + surcharge + 4% cess, rounded to ₹10
= In-hand      shown per year and per month
```

The comparison recommends the regime with the higher in-hand. The gap between the regimes is the tax gap. Cash, Variable pay, PF and professional tax do not depend on the regime.

---

## Gratuity

Optional. It uses the monthly basic salary from the structure.

| Rule | Value |
|------|--------|
| Eligibility | Continuous service date + 4 years + 240 days |
| Tenure | Completed years, plus one year when the remaining months are at least 6 |
| Formula | 15 ÷ 26 × tenure × monthly basic salary |
| Calculation date | 1 December 2026 or later |

Variable pay does not change Basic, PF or gratuity.

---

## What the Page Shows

| Block | Source |
|-------|--------|
| In-hand, tax, rate, CTC, retirement savings | Selected regime |
| Regime cards | Both regimes, with a recommendation |
| Salary structure | Monthly and annual rows, summing to Total Base Pay |
| Waterfall | Total Base Pay down to in-hand |
| Tax table | Income, deductions and take-home, new and old side by side |
| Slab table | The selected regime, with cess in paise and tax rounded to ₹10 |
| Hints | Basic 40% vs 50%, Metro vs Non-metro, and why professional tax may be ₹0 |
| Save PDF | `window.print()`, results only, watermark “Ashish Sankhua” |

---

## Privacy

| Control | Implementation |
|---------|----------------|
| Data location | The salary never leaves the browser |
| Network | No salary is posted. Fonts load from Google Fonts |
| Storage | No cookies, local storage, or account |
| Identity | The form asks for amounts and dates only, not a name |
| Reset | Clears Total Base Pay, Variable pay and gratuity dates |

---

## Folder Structure

```
.
├── index.html        # Page: hero, inputs, results, assumptions
├── styles.css        # Layout, responsive rules, print styles
├── app.js            # Structure, tax, gratuity, rendering
├── CASE-STUDY.md     # This note
└── README.md
```

`app.js` is one function scope. The main steps are `compute`, `taxFor`, `incomeTax` and `renderAll`.

---

## Running

Open `index.html`, or serve the folder so the browser loads the CSS and JavaScript as separate files:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

There is no install and no build.

---

## Deployment

GitHub Pages serves the repository root.

```
main
 └── index.html, styles.css, app.js
        │
        ▼
https://asankhua.github.io/salary-calculator/
```

`index.html` loads `styles.css` and `app.js` with a version query (`?v=`) so a new push is not hidden by an old cached file.

---

## Limits

- Resident individual under 60, salary income only.
- One illustrative professional-tax rate, not a state-wise slab.
- Old-regime claims that need rent, investments or loan interest are left out on purpose.
- The result is an illustration. It is not payroll advice or a tax filing.
