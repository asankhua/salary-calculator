# Takehome
*Salary structure and in-hand pay, before you sign the offer*

**Author:** Ashish Kumar Sankhua | Product Manager
**Date:** November 2026 | **Status:** Live

**Live page:** https://asankhua.github.io/salary-calculator/
**Code:** https://github.com/asankhua/salary-calculator

---

## 1. Executive Summary

**Takehome** turns an Annual Total Base Pay into a full Indian salary structure and shows monthly in-hand under the new and the old tax regimes for FY 2026-27. The person comparing an offer types one number. The page splits that number into Basic, HRA, LTA, PF, NPS and special allowance, applies slab tax with 4% cess, and estimates gratuity.

The calculation runs in the browser. No employee data is stored or sent.

### What the product does

- One input, Annual Total Base Pay, from ₹1,00,000. Shorthand such as `22.5L` and `1.2Cr` works.
- Salary structure with Basic at 40% or 50%, Metro or Non-metro HRA, Corporate NPS, and Employer PF inside Total Base Pay or over and above it.
- New and old regimes compared on every change. The headline follows the regime the user selects.
- In-hand per month and per year, income tax, Total CTC, retirement savings, a take-home waterfall and a slab table.
- Gratuity estimate from monthly basic salary.
- Save PDF of the results, with a watermark.

### Worked example

₹22.5 L, Basic 40%, Metro, Employer PF included, no Corporate NPS, professional tax on:

| | New regime | Old regime |
|--|------------|------------|
| In-hand per month | ₹1,50,567 | ₹1,34,028 |
| Income tax per year | ₹2,24,800 | ₹4,23,260 |

The new regime is ₹16,538 a month higher in this example. The salary split is the same in both regimes. Only the tax changes.

---

## 2. Problem Statement

### 2.1 Core problem

An offer letter states CTC or Total Base Pay. The number a person can spend is smaller, and the gap is hard to see before signing.

- The letter mixes cash, employer PF and allowances.
- Tax depends on the regime, and the two regimes do not move together.
- Basic, HRA and PF change the PF deduction and the old-regime Employee PF claim, so the same Total Base Pay does not always produce the same in-hand.
- Gratuity is quoted as a formula and rarely tied to the basic salary in that offer.

### 2.2 Who feels it

| Persona | Situation | What they need |
|---------|-----------|----------------|
| **Candidate** | Comparing two offers, often on a phone, before accepting | Monthly in-hand for both regimes, from the number on the letter |
| **Hiring manager or HR** | Explaining why CTC is not take-home | A structure that adds back to Total Base Pay, and a tax line they can point at |
| **Payroll or finance reviewer** | Checking that a published calculator matches the stated rules | Slabs, caps and rounding written down, and the same rules in the code |

Design assumption: a resident individual under 60, with salary as the income, using the offer as the only input. The product does not collect a name, PAN, employer or bank account.

### 2.3 What usually goes wrong

| Stage | Typical experience | Result |
|-------|--------------------|--------|
| Read the letter | CTC, gross and in-hand are used as if they were the same | The candidate overestimates monthly cash |
| Look up tax | A generic calculator asks for rent, 80C and insurance the letter does not contain | The old regime looks better only because the form was filled with guesses |
| Change Basic or city | The structure moves and the take-home barely does | It looks like the calculator is stuck |
| Ask about data | The tool wants an email or account | The candidate will not type an offer into it |

---

## 3. Solution

### 3.1 What the user can do

1. **Enter Total Base Pay.** Full rupees, or `22.5L`, `1.2Cr`, `800k`.
2. **Set the structure.** Basic 40% or 50%. Metro or Non-metro. Corporate NPS none, 10% or 14%. Employer PF included or over and above. Variable pay as a percent or a fixed amount. Professional tax on or off.
3. **Pick a regime.** New or old. Both stay visible.
4. **Read the result.** In-hand, tax, CTC, retirement savings, the component table, the waterfall, and the slab table.
5. **Estimate gratuity.** Continuous service date and a calculation date of 1 December 2026 or later.
6. **Save a PDF** of the results.
7. **Reset** the form.

### 3.2 Journey

```
Offer letter
    │
    ▼
Type Annual Total Base Pay          22.5L or 2250000
    │
    ▼
Choose the split                    Basic, city, NPS, PF, variable pay, professional tax
    │
    ▼
See both regimes                    In-hand first, then tax
    │
    ▼
Open the structure and the slabs    Confirm the rows add up, and where the tax came from
    │
    ▼
Optional                            Gratuity, Save PDF, Reset
```

There is no Calculate button. The result updates as the user types or changes a choice.

### 3.3 Journey compared with a manual worksheet

| | Worksheet or a long tax form | Takehome |
|--|------------------------------|----------|
| Starting point | Many cells, or rent and investment fields the letter does not have | Annual Total Base Pay |
| Structure | Built by hand, easy to leave a row out | Basic, HRA, LTA, PF, internet, NPS, special allowance. The rows sum to Total Base Pay |
| Regimes | One regime, or a second sheet | Both, on every change |
| Old regime | Easy to invent deductions | Employee PF up to ₹1,50,000, standard deduction, professional tax, employer NPS. Nothing else |
| Data | Often a sheet in email or a drive | Stays in the browser tab |
| Time to a first figure | A sitting | One amount |

---

## 4. Requirement mapping

The product is scoped to the offer-letter question: given this Total Base Pay and this structure, what is in-hand under each regime.

| Requirement | How it is met |
|-------------|----------------|
| Indian salary, FY 2026-27 | New regime under the Income-tax Act, 2025. Old section numbers kept where payslips still use them |
| Start from Total Base Pay | Single amount, minimum ₹1,00,000, maximum ₹1,00,00,00,000 |
| Show the split | `compute()` in `app.js` |
| Compare regimes | `taxFor("new")` and `taxFor("old")` on every update |
| Do not invent old-regime claims | No rent, no extra 80C, no 80D, no home-loan or education-loan interest, no LTA exemption |
| Count Employee PF in the old regime | Section 123, capped at ₹1,50,000 |
| Employer NPS at the legal cap | 14% of Basic in the new regime, 10% in the old regime, even if 14% was taken from salary |
| Variable pay | On top of Total Base Pay, taxed with salary, spread across 12 months. It does not change Basic, PF or gratuity |
| Professional tax | ₹200 a month when monthly cash pay is above ₹15,000, both regimes |
| Gratuity | 15 ÷ 26 × tenure × monthly basic salary. Eligibility is the service date plus 4 years and 240 days |
| Privacy | No account, no save, no salary request to a server |
| Phone and desktop | Responsive layout. Checked at phone and laptop widths |
| A figure the user can keep | Save PDF, results only |

Removed on purpose after use: optional old-regime deduction fields, sample amount pills (₹6 L, ₹12 L, ₹22.5 L, ₹50 L), and a hero comparison card. The regime choice is the tax choice. The amount is typed.

---

## 5. Why this build

| Approach | What happens | Decision |
|----------|----------------|----------|
| Spreadsheet | Flexible, and every copy drifts from the slabs | Not the product |
| Generic tax site with rent, 80C and insurance | The old regime depends on numbers the offer does not contain | Rejected for this scope |
| One-regime CTC calculator | Hides the comparison the user came for | Rejected |
| Server app with an account | The offer would leave the browser | Rejected |
| **Static page, both regimes, structure from Total Base Pay** | The letter’s number is enough. The rules sit in one file | **Shipped** |

The logic is plain JavaScript so a reviewer can read `compute`, `taxFor` and `incomeTax` without a build step. GitHub Pages serves the same files the browser runs locally.

---

## 6. Product requirements

### 6.1 Functional

| ID | Requirement | Priority | State |
|----|-------------|----------|-------|
| FR-01 | Accept Annual Total Base Pay, including `22.5L` and `1.2Cr` | P0 | Shipped |
| FR-02 | Reject amounts under ₹1,00,000 and over ₹1,00,00,00,000 | P0 | Shipped |
| FR-03 | Build Basic, HRA, LTA, Employer PF, internet, NPS and special allowance | P0 | Shipped |
| FR-04 | Basic 40% or 50% | P0 | Shipped |
| FR-05 | Metro HRA 50% of Basic, Non-metro 40% | P0 | Shipped |
| FR-06 | Corporate NPS none, 10% or 14%, from special allowance | P0 | Shipped |
| FR-07 | Employer PF included in Total Base Pay, or over and above and outside CTC | P0 | Shipped |
| FR-08 | Variable pay as a percent (0–100) or a fixed amount | P0 | Shipped |
| FR-09 | Compute new and old regime on every change | P0 | Shipped |
| FR-10 | Recommend the regime with the higher in-hand | P0 | Shipped |
| FR-11 | Professional tax with the ₹15,000 monthly cash test | P0 | Shipped |
| FR-12 | Gratuity from monthly basic salary | P1 | Shipped |
| FR-13 | Save PDF of the results | P1 | Shipped |
| FR-14 | Reset to an empty form | P1 | Shipped |
| FR-15 | Explain when Metro, Basic or professional tax does not move in-hand | P1 | Shipped |

### 6.2 Non-functional

| ID | Requirement | How it is met |
|----|-------------|----------------|
| NFR-01 | No salary leaves the browser | No fetch of user input. No storage |
| NFR-02 | Usable on a phone and a laptop | Layout stacks under 960px. Inputs are 16px on small screens so iOS does not zoom |
| NFR-03 | A reviewer can see the rule | Assumptions panel states slabs, caps and what is left out |
| NFR-04 | A new deploy is not hidden by an old file | `styles.css` and `app.js` are loaded with a version query |
| NFR-05 | The structure adds up | Component rows sum to Total Base Pay. A warning shows when internet or NPS is capped by the balance |

### 6.3 Tax rules encoded

| Rule | New regime | Old regime |
|------|------------|------------|
| Slabs | 0–4 L nil, then 5%, 10%, 15%, 20%, 25%, 30% above 24 L | 0–2.5 L nil, 5% to 5 L, 20% to 10 L, 30% above |
| Standard deduction | ₹75,000 | ₹50,000 |
| Rebate | Up to ₹60,000 within ₹12,00,000 taxable, with marginal relief | Up to ₹12,500 within ₹5,00,000 taxable, no marginal relief |
| Employee PF | Not a deduction | Section 123, up to ₹1,50,000 |
| Employer NPS | Up to 14% of Basic | Up to 10% of Basic |
| Surcharge | From ₹50 lakh, capped at 25% | From ₹50 lakh, up to 37% above ₹5 crore |
| Cess | 4%. Tax rounded to the nearest ₹10 | Same |

Employer PF plus Corporate NPS above ₹7,50,000 a year is a taxable perquisite.

---

## 7. Technical architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         WEB BROWSER                               │
│                                                                   │
│   index.html                                                      │
│   ┌─────────────────────────┐    ┌────────────────────────────┐  │
│   │ Your details            │    │ Results                    │  │
│   │ Total Base Pay          │    │ In-hand, tax, CTC          │  │
│   │ Basic, HRA, NPS, PF     │    │ New regime and old regime  │  │
│   │ Regime, professional tax│    │ Structure, waterfall       │  │
│   │ Variable pay            │    │ Tax table, slabs           │  │
│   └────────────┬────────────┘    │ Gratuity, Save PDF         │  │
│                │ input            └──────────────▲─────────────┘  │
│                ▼                                 │                │
│   app.js         parseAmount → compute → taxFor(new)             │
│                                      → taxFor(old) → renderAll   │
│   styles.css     layout, responsive, print watermark             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    No salary request.
                    GitHub Pages only serves the files.
```

| Layer | Technology | Role |
|-------|------------|------|
| Page | `index.html` | Form, results, assumptions |
| Presentation | `styles.css` | Layout, phone and desktop, print |
| Calculation | `app.js` | Structure, tax, gratuity, rendering |
| Type | Inter, Plus Jakarta Sans | Loaded from Google Fonts. No salary is sent with that request |
| Host | GitHub Pages | Static files from `main` |
| Server, database, account | None | |

### In-hand

```
Gross cash     Total Base Pay
               − Employer PF, when it is included
               − Corporate NPS
+ Variable     on top of Total Base Pay, spread across 12 months
− Employee PF  12% of Basic
− Prof. tax    ₹2,400 a year, when monthly cash pay is above ₹15,000
− Income tax   slabs + surcharge + 4% cess, rounded to ₹10
= In-hand
```

Total CTC is Annual Total Base Pay plus Variable pay. Retirement savings are Employer PF + Employee PF + Corporate NPS.

### Gratuity

| Rule | Value |
|------|--------|
| Eligibility | Continuous service date + 4 years + 240 days |
| Tenure | Completed years, plus one year when the leftover months are at least 6 |
| Formula | 15 ÷ 26 × tenure × monthly basic salary |
| Calculation date | 1 December 2026 or later |

---

## 8. Interface

The page is one screen: a short hero, the form on the left, the results on the right. On a phone the results sit under the form.

| Block | What the user sees |
|-------|--------------------|
| Hero | FY 2026-27, the promise, four points, and the privacy line |
| Salary | Total Base Pay, calculated Basic, Variable pay as % or amount |
| Structure | Basic 40/50, Metro/Non-metro, Corporate NPS, Employer PF included |
| Tax | New regime or old regime, professional tax |
| Results | Five summary figures, regime cards, structure, waterfall, tax table, slabs |
| Gratuity | Two dates, monthly basic salary, eligibility, tenure, amount |
| Save PDF / Reset | Print the results, or clear the form |
| Assumptions | The rules, including what the old regime does not claim |

Hints do the work that a second screen would do:

- Basic states the rupee gap versus the other percentage, for the selected regime.
- HRA states when Metro and Non-metro produce the same in-hand, because rent is not claimed.
- Professional tax states when the box is on and the deduction is still ₹0, because monthly cash pay is not above ₹15,000.

Save PDF uses the browser print dialog. The hero, the form and the footer are hidden. The results carry the watermark “Ashish Sankhua”.

---

## 9. Verification

There is no analytics on the page, so there is no measured conversion rate. The check that was run is a calculation check.

| Check | What was done | Result |
|-------|----------------|--------|
| Combination sweep | ₹1 L to ₹50 L, Basic 40 and 50, Metro and Non-metro, NPS 0/10/14, Employer PF on and off, both regimes. 2,688 cases | Structure sums to Total Base Pay. In-hand equals cash + variable − Employee PF − professional tax − tax. Tax is a multiple of ₹10 |
| Reference, ₹22.5 L, Basic 40%, Metro, PF included, no NPS | New and old regime | ₹1,50,567 / ₹2,24,800 and ₹1,34,028 / ₹4,23,260 |
| Basic 50% at the same salary | New regime | ₹1,46,652, which is ₹3,915 a month lower |
| Old-regime PF cap | ₹32 L at 40% Basic, and ₹26 L at 50% | Deduction stops at ₹1,50,000 and the note says so |
| Employer NPS | 14% taken from a ₹22.5 L salary | New regime deducts ₹1,26,000. Old regime deducts ₹90,000 |
| Surcharge | Taxable income ₹50,02,600 | New-regime surcharge ₹1,820 after marginal relief |
| Variable pay | `10 %` with a space, and a fixed `5L` | Percent is accepted. CTC is Total Base Pay plus that variable |
| Gratuity | 1 Apr 2020 to 1 Dec 2026, monthly basic ₹75,000 | ₹3,02,885, tenure 7 years |
| Invalid input | Below ₹1 L, above the maximum, and a non-number | The field shows an error and the results stay empty |
| Layout | Phone width 390px and a laptop width | No horizontal scroll |

### Issues found in that pass, and fixed

| What looked wrong | Cause | Fix |
|-------------------|--------|-----|
| Metro and Non-metro showed the same in-hand | HRA and special allowance are both taxed. Rent is not claimed | The HRA hint says the in-hand is the same, or shows the monthly gap when NPS or internet is squeezed |
| The HRA tip mentioned an exemption | The exemption is not calculated | The tip now describes the salary split only |
| Professional tax did nothing on a ₹1 L salary | Monthly cash pay was under ₹15,000 | The hint says it is not deducted, and shows the cash pay |
| `10 %` was rejected | The space before % failed the parser | The space is ignored |
| Slab cess was ₹1 short of the total | Cess was rounded to a rupee before the ₹10 tax rounding | Cess, rebate and surcharge show paise. The total says it is rounded to ₹10 |
| Surcharge always said marginal relief | The relief often does not reduce the bill | The note appears only when the relief cuts the surcharge |

---

## 10. Risks

| Risk | Likelihood | Impact | What the product does |
|------|------------|--------|------------------------|
| The user treats the figure as a payroll number | Medium | High | The assumptions and the footer say it is an illustration, not a filing |
| The user expects rent or 80C to change the old regime | High | Medium | Those inputs are absent. The tax table says they are not included |
| Metro looks broken because in-hand does not move | High | Low | The HRA hint states the comparison in rupees |
| A slab or cap in the code drifts from the Act | Medium | High | Rules are in one object in `app.js`, and the assumptions panel repeats them. The rules version string is `reference-sheet-2026.10.15` |
| Professional tax differs by state | High | Low | One illustrative rate, ₹200 a month, stated on the control |
| Someone pastes a real offer and worries where it went | Medium | High | The privacy line is on the hero. The script does not post the form |
| Print layout hides a result | Low | Medium | Print CSS keeps the results and drops the form |

---

## 11. How it reaches people

Takehome is a public page, not a priced product.

| Channel | Role |
|---------|------|
| https://asankhua.github.io/salary-calculator/ | The calculator |
| https://github.com/asankhua/salary-calculator | Source, README, this case study |
| Offer-comparison moment | A candidate opens the page, types the Total Base Pay, and compares regimes |
| HR or campus explanation | The structure table is the exhibit. Save PDF keeps it |

There is no login, no plan, and no call quota. A change ships by pushing `main`. GitHub Pages serves the repository root.

---

## 12. What the build taught, and what is left

### What held

1. **Lead with in-hand.** Gross salary is the same in both regimes. The decision is the monthly cash after tax.
2. **Automatic old regime.** Asking for rent and investments made the old regime a guessing game. Employee PF, the standard deduction and professional tax are enough for an offer letter.
3. **Say when a control does not move the result.** Basic, Metro and professional tax each needed a sentence, because a silent result looks like a bug.
4. **One file of rules.** Slabs, caps and rounding live next to the render code, so a sweep can check them together.

### What had to change

1. Optional old-regime fields were removed.
2. Sample amount pills were removed. The amount is typed, including shorthand.
3. A hero comparison card was removed. The comparison lives in the results.
4. The slab table showed cess to the nearest rupee, so the column missed the payable tax by ₹1.

### Possible next steps

These are not scheduled. They are the gaps a later version could close.

| Gap | Why it is still open |
|-----|----------------------|
| State-wise professional tax | The page uses one illustrative rate |
| Rent and other old-regime claims | Left out so the offer letter is sufficient |
| Age above 60, and income other than salary | Out of scope |
| A shareable link that does not store the salary | Would need a design that keeps the privacy line true |

---

## 13. Conclusion

Takehome answers one question from an offer letter: given this Annual Total Base Pay and this structure, what is the monthly in-hand under the new regime and under the old regime.

The page does that without an account and without asking for deductions the letter does not contain. The structure adds back to Total Base Pay. The regime changes the tax. A sweep from ₹1 L to ₹50 L, across Basic, city, NPS, PF and both regimes, matched those rules, and the mismatches that sweep found are fixed.

**Proof that is in the product, not in a survey:**

- Live at https://asankhua.github.io/salary-calculator/
- ₹22.5 L reference: new regime ₹1,50,567 a month and ₹2,24,800 tax; old regime ₹1,34,028 and ₹4,23,260
- 2,688 structure and tax checks from ₹1 L to ₹50 L
- No salary request in the page

---

## Appendix

Technical design: [ARCHITECTURE.md](ARCHITECTURE.md).

### A. Files

```
.
├── index.html        # Hero, form, results, assumptions
├── styles.css        # Layout, responsive rules, print
├── app.js            # compute, taxFor, incomeTax, gratuity, render
├── ARCHITECTURE.md   # System design
├── CASE-STUDY.md     # This note
└── README.md
```

### B. Main functions

| Function | Role |
|----------|------|
| `parseAmount` | `2250000`, `22,50,000`, `22.5L`, `1.2Cr`, `800k` |
| `compute` | Salary structure for the current choices |
| `taxFor` | One regime: gross, deductions, taxable income, tax, in-hand |
| `incomeTax` | Slabs, rebate, surcharge with marginal relief, 4% cess, round to ₹10 |
| `renderAll` | Writes every result block |
| `calculateGratuity` | Eligibility, tenure and the 15 ÷ 26 amount |

### C. Run locally

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Opening `index.html` directly also works. There is no install and no build.

### D. Deploy

Push to `main`. GitHub Pages serves the repository root at https://asankhua.github.io/salary-calculator/. Bump the `?v=` on `styles.css` and `app.js` in `index.html` when those files change.

### E. Limits

- Resident individual under 60, salary income only.
- Professional tax is illustrative, not a state slab.
- HRA exemption, LTA exemption, other investments and loan interest are not claimed.
- The result is an illustration. It is not payroll advice or a tax filing.

---

**Document version:** 2.0
**Last updated:** 5 November 2026
**Author:** Ashish Kumar Sankhua
