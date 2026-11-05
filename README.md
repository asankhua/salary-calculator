https://github.com/asankhua/salary-calculator/issues/1#issue-6223833707

# Takehome · Salary structure and in-hand pay

A browser-only calculator for an Indian offer letter. Takehome turns an Annual Total Base Pay into a salary structure and shows monthly in-hand under the new and the old tax regimes for FY 2026-27.

**Live page:** https://asankhua.github.io/salary-calculator/

Product case study: [CASE-STUDY.md](CASE-STUDY.md) · Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## Features

- **Salary structure:** Basic (40% or 50% of Total Base Pay), HRA (Metro 50% or Non-metro 40% of Basic), LTA (16.66% of Basic), Employer PF (12% of Basic), internet allowance (₹1,000 a month), and special allowance as the balance
- **Corporate NPS:** None, 10%, or 14% of Basic, taken from special allowance
- **Employer PF:** Included in Total Base Pay, or paid over and above it and left out of Total CTC
- **Variable pay:** A percentage of Total Base Pay or a fixed annual amount, on top of Total Base Pay and spread across 12 months
- **Both tax regimes:** New and old slabs, standard deduction, rebate, surcharge with marginal relief, and 4% cess. Tax is rounded to the nearest ₹10
- **Old regime:** Employee PF under section 123 (earlier 80C), up to ₹1,50,000. Employer NPS up to 10% of Basic
- **Professional tax:** ₹200 a month when monthly cash pay is above ₹15,000, under both regimes
- **Results:** In-hand per month and per year, income tax, effective tax rate, Total CTC, retirement savings, a regime comparison, and a slab-wise tax table
- **Gratuity:** Estimated from monthly basic salary with the 15 ÷ 26 formula
- **Save PDF:** Prints the results with a watermark
- **Responsive:** Phones, laptops, and large monitors

Amounts can be typed in full or in shorthand, for example `22.5L`, `1.2Cr`, or `800k`. Total Base Pay must be between ₹1,00,000 and ₹1,00,00,00,000.

Worked example at ₹22.5 L, Basic 40%, Metro, Employer PF included, no Corporate NPS: new regime **₹1,50,567** a month (tax ₹2,24,800); old regime **₹1,34,028** a month (tax ₹4,23,260).

## Architecture

The page is static. `app.js` runs the whole path in the browser.

| Step | Function | Description |
|------|----------|-------------|
| 1 | `parseAmount` | Reads Total Base Pay, including `22.5L`, `1.2Cr`, and `800k` |
| 2 | `compute` | Builds Basic, HRA, LTA, PF, internet, NPS, and special allowance |
| 3 | `taxFor` | Runs the new regime and the old regime on that structure |
| 4 | `incomeTax` | Slabs, rebate, surcharge, 4% cess, rounded to the nearest ₹10 |
| 5 | `renderAll` | Writes in-hand, the comparison, the structure, the waterfall, and the slabs |
| 6 | `calculateGratuity` | Eligibility, tenure, and the 15 ÷ 26 amount, when asked |

Details: [ARCHITECTURE.md](ARCHITECTURE.md).

## Deployment

**GitHub Pages**

- URL: https://asankhua.github.io/salary-calculator/
- Source: the `main` branch, repository root
- Build: none. `index.html`, `styles.css`, and `app.js` are served as they are

`index.html` loads the CSS and JavaScript with a version query (`?v=`). Bump it when those files change so a returning browser does not keep an old copy.

## Setup

### Prerequisites

- A browser
- Python 3, only if you want a local server

No API key, install, or build step.

### Local development

```bash
git clone https://github.com/asankhua/salary-calculator.git
cd salary-calculator
python3 -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` directly also works.

## Project structure

```
.
├── index.html         # Hero, form, results, assumptions
├── styles.css         # Layout, responsive rules, print
├── app.js             # Structure, tax, gratuity, rendering
├── ARCHITECTURE.md    # System design
├── CASE-STUDY.md      # Product case study
└── README.md
```

## Constraints

- **Salary income only:** A resident individual under 60. No other income, and no age above 60.
- **No guessed deductions:** Rent, other investments, health insurance, and loan interest are not claimed. The old regime uses the standard deduction, professional tax, Employee PF up to ₹1,50,000, and employer NPS up to 10% of Basic.
- **HRA is a split, not an exemption:** Metro and Non-metro change HRA and special allowance. They do not apply a rent exemption.
- **One professional-tax rate:** ₹200 a month. It is illustrative, not a state slab.
- **No employee data:** The salary stays in the browser. It is not stored or sent.
- **Illustration only:** This is not payroll advice or a tax filing. Actual payroll figures may differ.

Tax year 2026-27, under the Income-tax Act, 2025. Older section numbers are shown because payslips still use them: 80C is section 123, 80CCD is section 124, and the 87A rebate is section 156.

## Author

Ashish Kumar Sankhua
