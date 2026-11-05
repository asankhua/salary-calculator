# Takehome · Salary structure and in-hand pay

Takehome turns an Annual Total Base Pay into a full Indian salary structure and shows the in-hand pay under both the new and the old income-tax regimes for FY 2026-27.

**Live page:** https://asankhua.github.io/salary-calculator/

Architecture and calculation flow: [CASE-STUDY.md](CASE-STUDY.md)

## Features

- Salary structure: Basic (40% or 50% of Total Base Pay), HRA (Metro 50% or Non-metro 40% of Basic), LTA (16.66% of Basic), Employer PF (12% of Basic), internet allowance (₹1,000 a month) and special allowance as the balance.
- Corporate NPS: None, 10% or 14% of Basic, taken from special allowance.
- Employer PF: included in Total Base Pay, or paid over and above it.
- Variable pay: a percentage of Total Base Pay or a fixed annual amount, paid on top of Total Base Pay and spread across 12 months.
- Tax: new and old regime slabs, standard deduction, rebate, surcharge with marginal relief, 4% cess, rounded to the nearest ₹10.
- Old regime: Employee PF counted under section 123 (earlier 80C), up to ₹1,50,000.
- Professional tax of ₹200 a month when monthly cash pay is above ₹15,000, under both regimes.
- Results: in-hand per month and per year, income tax, effective tax rate, Total CTC, retirement savings, a regime comparison and a slab-wise tax table.
- Gratuity estimate from the monthly basic salary, using the 15 ÷ 26 formula.
- Save PDF prints the results with a watermark.
- Responsive layout for phones, laptops and large monitors.

Amounts can be typed in full or in shorthand, for example `22.5L`, `1.2Cr` or `800k`. Total Base Pay must be between ₹1,00,000 and ₹1,00,00,00,000.

## Privacy

All calculations run in the browser. No employee data is stored, sent or retrieved.

## Run locally

No build step is needed. Either open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Files

| File | Purpose |
| ---- | ------- |
| `index.html` | Page layout, form, results and assumptions |
| `styles.css` | Styles, responsive layout and print styles |
| `app.js` | Salary structure, tax computation and gratuity logic |

## Assumptions and limits

- Resident individuals under 60 with salary income only.
- Rent, other investments, health insurance, loan interest and LTA exemption are not claimed. The old regime uses only the automatic items above.
- The HRA choice changes the split between HRA and special allowance. It does not change any tax exemption.
- Tax year 2026-27 under the Income-tax Act, 2025. Section numbers are shown with the earlier numbers that payslips still use.

This calculator gives an illustration. It is not payroll advice or a tax filing, and actual payroll figures may differ.

## Author

© 2026 Ashish Kumar Sankhua
