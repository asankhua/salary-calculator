(() => {
  "use strict";

  const RULES_VERSION = "reference-sheet-2026.10.15";
  const MIN_TBP = 100000;
  const MAX_TBP = 1000000000;
  const INTERNET_FULL = 1000;
  const GRATUITY_MIN_CALC_DATE = "2026-12-01";
  const STANDARD_DEDUCTION = { new: 75000, old: 50000 };
  const SECTION_80C_CAP = 150000;
  const EMPLOYER_CONTRIB_CAP = 750000;
  const PROFESSIONAL_TAX_MONTHLY = 200;
  const PT_THRESHOLD_MONTHLY = 15000;
  const REGIMES = {
    new: {
      name: "New regime",
      slabs: [[0, 400000, 0], [400000, 800000, 0.05], [800000, 1200000, 0.10], [1200000, 1600000, 0.15],
        [1600000, 2000000, 0.20], [2000000, 2400000, 0.25], [2400000, Infinity, 0.30]],
      rebateLimit: 1200000, rebateMax: 60000, rebateMarginal: true, npsCapPct: 0.14,
    },
    old: {
      name: "Old regime",
      slabs: [[0, 250000, 0], [250000, 500000, 0.05], [500000, 1000000, 0.20], [1000000, Infinity, 0.30]],
      rebateLimit: 500000, rebateMax: 12500, rebateMarginal: false, npsCapPct: 0.10,
    },
  };
  const COLORS = {
    basic: "#4f46e5", hra: "#8b5cf6", lta: "#0ea5e9", pf: "#10b981",
    internet: "#f59e0b", nps: "#f43f5e", special: "#94a3b8",
  };
  const METRO_CITIES = "Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad";

  const defaults = () => ({
    tbpAnnual: null,
    result: null,
    basicPct: 40,
    metro: true,
    hraPct: 50,
    npsPct: 0,
    regime: "new",
    pt: true,
    variableMode: "percent",
    variablePct: 0,
    variableAnnual: 0,
    pfIncluded: true,
    gratuityShown: false,
  });
  const state = defaults();

  const $ = (id) => document.getElementById(id);
  const round2 = (n) => Math.round(n * 100) / 100;
  const fmt = (d) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  const inr = (n, d = 2) => (n < 0 ? "−₹" : "₹") + fmt(d).format(Math.abs(n));
  const inr0 = (n) => inr(Math.round(n), 0);
  const num = (n, d = 2) => fmt(d).format(n);
  const pct = (n) => `${(n * 100).toFixed(1).replace(/\.0$/, "")}%`;
  const pctOf = (part, whole) => (part / 100) * whole;
  const trim = (n) => String(Number(n.toFixed(2)));
  function short(n) {
    if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
    if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
    return inr0(n);
  }

  // Accepts "22,50,000", "2250000", "22.5L", "22.5 lakh", "1.2Cr" and "800k".
  function parseAmount(raw) {
    const s = String(raw).toLowerCase().replace(/[₹,\s]/g, "");
    if (!s) return NaN;
    const m = s.match(/^(\d+(?:\.\d+)?)(l|lac|lakh|lakhs|cr|crore|crores|k)?$/);
    if (!m) return NaN;
    const mult = { l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7, k: 1e3 }[m[2]] || 1;
    return Math.round(Number(m[1]) * mult);
  }
  function parsePercent(raw) {
    const s = String(raw).trim().replace(/%/g, "").trim();
    if (!s) return 0;
    if (!/^\d+(\.\d*)?$/.test(s)) return NaN;
    return Number(s);
  }

  /* ---------- Income tax, FY 2026-27 ---------- */
  function slabTax(income, slabs) {
    return slabs.reduce((sum, [lo, hi, rate]) => sum + Math.max(0, Math.min(income, hi) - lo) * rate, 0);
  }

  function surchargeRate(income, regime) {
    if (income <= 5000000) return 0;
    if (income <= 10000000) return 0.10;
    if (income <= 20000000) return 0.15;
    if (regime === "new" || income <= 50000000) return 0.25;
    return 0.37;
  }

  // Resident individual under 60. Rebate (old 87A, now section 156), surcharge with
  // marginal relief and 4% cess. Final tax is rounded to the nearest ₹10.
  function incomeTax(taxable, regime) {
    const cfg = REGIMES[regime];
    const income = Math.max(0, taxable);
    const rows = cfg.slabs.map(([lo, hi, rate]) => {
      const inSlab = Math.max(0, Math.min(income, hi) - lo);
      return { lo, hi, rate, inSlab, tax: inSlab * rate };
    });
    const base = rows.reduce((s, r) => s + r.tax, 0);

    let rebate = 0;
    let marginalRelief = false;
    if (income <= cfg.rebateLimit) {
      rebate = Math.min(base, cfg.rebateMax);
    } else if (cfg.rebateMarginal && base > income - cfg.rebateLimit) {
      rebate = base - (income - cfg.rebateLimit);
      marginalRelief = true;
    }
    const afterRebate = base - rebate;

    const rate = surchargeRate(income, regime);
    let surcharge = afterRebate * rate;
    let surchargeRelief = false;
    const thresholds = regime === "new" ? [5000000, 10000000, 20000000] : [5000000, 10000000, 20000000, 50000000];
    const crossed = thresholds.filter((t) => income > t).pop();
    if (crossed && rate > 0) {
      const atThreshold = slabTax(crossed, cfg.slabs) * (1 + surchargeRate(crossed, regime));
      const ceiling = atThreshold + (income - crossed);
      if (afterRebate + surcharge > ceiling) {
        surcharge = Math.max(0, ceiling - afterRebate);
        surchargeRelief = true;
      }
    }
    const cess = (afterRebate + surcharge) * 0.04;
    const total = Math.round((afterRebate + surcharge + cess) / 10) * 10;
    const topRate = rows.filter((r) => r.inSlab > 0).map((r) => r.rate).pop() || 0;
    return { rows, base, rebate, marginalRelief, surcharge, surchargeRelief, surchargeRate: rate, cess, total, topRate };
  }

  /* ---------- Salary structure ---------- */
  function compute(tbpAnnual) {
    const basicA = round2(pctOf(state.basicPct, tbpAnnual));
    const hraA = round2(pctOf(state.hraPct, basicA));
    const ltaA = round2(basicA * 0.1666);
    const pfA = round2(basicA * 0.12);
    // When employer PF is included, it is carved out of Total Base Pay. Otherwise the employer pays it on top
    // and the allowance pool is larger by that amount.
    const pfInside = state.pfIncluded ? pfA : 0;
    const roomA = round2(tbpAnnual - (basicA + hraA + ltaA + pfInside));
    const internetA = Math.min(INTERNET_FULL * 12, Math.max(0, roomA));
    const poolA = round2(roomA - internetA);
    const npsWantedA = round2(pctOf(state.npsPct, basicA));
    const npsA = Math.min(npsWantedA, Math.max(0, poolA));
    const specialA = round2(poolA - npsA);

    const month = (annual) => round2(annual / 12);
    const city = state.metro ? "Metro" : "Non-metro";
    const drafted = [
      { key: "basic", name: "Basic salary", sub: `${state.basicPct}% of Total Base Pay`, annual: basicA },
      { key: "hra", name: "House rent allowance", sub: `${state.hraPct}% of Basic · ${city}`, annual: hraA },
      { key: "lta", name: "Leave travel allowance", sub: "16.66% of Basic", annual: ltaA },
    ];
    if (state.pfIncluded) {
      drafted.push({ key: "pf", name: "Employer PF", sub: "12% of Basic, included in Total Base Pay", annual: pfA });
    }
    drafted.push({
      key: "internet", name: "Internet allowance",
      sub: internetA < INTERNET_FULL * 12 ? "₹1,000 a month, limited to the balance of Total Base Pay" : "₹1,000 a month",
      annual: internetA,
    });
    if (state.npsPct > 0) {
      drafted.push({ key: "nps", name: "Corporate NPS", sub: `${state.npsPct}% of Basic, taken from special allowance`, annual: npsA });
    }
    drafted.forEach((row) => { row.amount = month(row.annual); });
    const monthlyTotal = month(tbpAnnual);
    let specialMonthly = round2(monthlyTotal - drafted.reduce((sum, row) => sum + row.amount, 0));
    // A paisa of rounding can leave Special Allowance at -₹0.01 when the annual balance is zero.
    if (specialMonthly < 0 && specialMonthly > -0.05 && specialA >= 0) {
      const host = [...drafted].reverse().find((row) => row.amount >= -specialMonthly);
      if (host) host.amount = round2(host.amount + specialMonthly);
      specialMonthly = 0;
    }
    const rows = drafted.concat({ key: "special", name: "Special allowance", sub: "Remaining balance", annual: specialA, amount: specialMonthly });

    return {
      tbpAnnual, basicAnnual: basicA, rows,
      pfAnnual: pfA, pfMonthly: month(pfA), pfIncluded: state.pfIncluded,
      variable: state.variableAnnual,
      pool: month(poolA), npsWanted: month(npsWantedA), nps: month(npsA),
      internetLimited: internetA < INTERNET_FULL * 12,
      totalMonthly: monthlyTotal,
      wage: month(basicA),
      generatedAt: new Date(),
    };
  }

  const annualOf = (r, key) => { const row = r.rows.find((x) => x.key === key); return row ? row.annual : 0; };

  function taxFor(regime, r) {
    const old = regime === "old";
    const basic = annualOf(r, "basic");
    const hra = annualOf(r, "hra");
    const pf = r.pfAnnual;
    const nps = annualOf(r, "nps");
    const variable = r.variable || 0;
    const cash = ["basic", "hra", "lta", "internet", "special"].reduce((s, k) => s + Math.max(0, annualOf(r, k)), 0);
    const excess = Math.max(0, pf + nps - EMPLOYER_CONTRIB_CAP);
    const gross = cash + nps + excess + variable;
    const pt = state.pt && cash / 12 > PT_THRESHOLD_MONTHLY ? PROFESSIONAL_TAX_MONTHLY * 12 : 0;

    const standard = Math.min(STANDARD_DEDUCTION[regime], gross);
    const lta = annualOf(r, "lta");
    const ptDed = pt;
    // Old regime counts Employee PF under section 123 (earlier 80C), up to ₹1,50,000. No other claims are entered.
    const c80 = old ? Math.min(SECTION_80C_CAP, pf) : 0;
    const npsCap = basic * REGIMES[regime].npsCapPct;
    const npsDed = Math.min(nps, npsCap);

    const deductions = standard + ptDed + c80 + npsDed;
    const taxable = Math.max(0, gross - deductions);
    const tax = incomeTax(taxable, regime);
    // Variable pay is spread over 12 months. Slab tax is on the full year, including that variable pay, and the same tax is spread into monthly in-hand.
    const inhand = cash + variable - pf - pt - tax.total;
    return { regime, basic, hra, lta, pf, nps, variable, cash, excess, gross, pt, standard, ptDed, c80, npsCap, npsDed, deductions: gross - taxable, taxable, tax, inhand };
  }

  function c80Note(pf) {
    const counted = Math.min(SECTION_80C_CAP, pf);
    return counted < pf
      ? `Employee PF ${inr0(pf)}. Only ${inr0(counted)} is within the ₹1,50,000 limit`
      : `Employee PF ${inr0(pf)}`;
  }

  /* ---------- Rendering ---------- */
  function renderAll() {
    const r = state.result;
    $("emptyState").hidden = !!r;
    $("resultsBody").hidden = !r;
    $("printBtn").disabled = !r;
    if (!r) {
      $("annualBasic").value = "";
      $("monthlyWage").value = "";
      $("resultMeta").textContent = "Enter Annual Total Base Pay to see your salary structure.";
      $("npsHint").textContent = "Of Basic, from special allowance";
      renderHints();
      clearGratuityResult();
      return;
    }
    const both = { new: taxFor("new", r), old: taxFor("old", r) };
    const sel = both[state.regime];
    renderHints();
    renderStructure(r);
    renderKpis(r, sel, both);
    renderCompare(both);
    renderWaterfall(r, sel);
    renderTaxTable(both);
    renderSlabs(sel);
    $("resultMeta").textContent = `Rules ${RULES_VERSION} · Updated ${r.generatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    $("monthlyWage").value = num(r.wage);
    if (state.gratuityShown) calculateGratuity();
  }

  // In-hand at the other Basic %, for the regime currently selected. State is restored.
  function inhandAtBasic(basicPct, regime) {
    const saved = state.basicPct;
    state.basicPct = basicPct;
    const structure = compute(state.tbpAnnual);
    const tax = taxFor(regime, structure);
    state.basicPct = saved;
    return tax.inhand;
  }

  function basicHint(r) {
    if (!r) return `${state.basicPct}% of Annual Total Base Pay`;
    const other = state.basicPct === 50 ? 40 : 50;
    const here = taxFor(state.regime, r).inhand;
    const there = inhandAtBasic(other, state.regime);
    const gap = Math.round(here / 12) - Math.round(there / 12);
    const move = gap === 0
      ? `the same monthly in-hand as ${other}%`
      : `${inr0(Math.abs(gap))} a month ${gap > 0 ? "more" : "less"} in-hand than ${other}%`;
    return `${state.basicPct}% is ${inr0(r.basicAnnual)} a year. This Basic gives ${move} on the ${REGIMES[state.regime].name.toLowerCase()}.`;
  }

  function inhandAtMetro(metro, regime) {
    const savedMetro = state.metro;
    const savedHra = state.hraPct;
    state.metro = metro;
    state.hraPct = metro ? 50 : 40;
    const structure = compute(state.tbpAnnual);
    const tax = taxFor(regime, structure);
    state.metro = savedMetro;
    state.hraPct = savedHra;
    return tax.inhand;
  }

  function hraHint(r) {
    const rate = state.metro ? "50%" : "40%";
    const where = state.metro ? METRO_CITIES : "all other cities";
    if (!r) return `${rate} of Basic · ${where}`;
    const otherName = state.metro ? "Non-metro" : "Metro";
    const here = taxFor(state.regime, r).inhand;
    const there = inhandAtMetro(!state.metro, state.regime);
    const gap = Math.round(here / 12) - Math.round(there / 12);
    const amount = `${rate} of Basic is ${inr0(annualOf(r, "hra"))} a year`;
    const regime = REGIMES[state.regime].name.toLowerCase();
    if (gap === 0) return `${amount}. In-hand is the same as ${otherName} on the ${regime}.`;
    return `${amount}. This HRA gives ${inr0(Math.abs(gap))} a month ${gap > 0 ? "more" : "less"} in-hand than ${otherName} on the ${regime}.`;
  }

  function ptHint(r) {
    if (!r) return "";
    const t = taxFor(state.regime, r);
    if (!state.pt) return "Turned off.";
    if (t.pt === 0) return `Not deducted. Monthly cash pay is ${inr0(t.cash / 12)}, which is not above ₹15,000.`;
    return `₹2,400 a year is deducted. Monthly cash pay is ${inr0(t.cash / 12)}.`;
  }

  function renderHints() {
    const r = state.result;
    const percent = state.variableMode === "percent";
    $("basicHint").textContent = basicHint(r);
    $("hraHint").textContent = hraHint(r);
    const ptMsg = ptHint(r);
    $("ptHint").hidden = !ptMsg;
    $("ptHint").textContent = ptMsg;
    $("pfHint").textContent = state.pfIncluded
      ? "12% of Basic is part of Total Base Pay."
      : "12% of Basic is paid over and above Total Base Pay. It is not part of Total CTC.";
    if (!$("variablePay").value.trim()) {
      $("variableHint").textContent = percent
        ? "Percentage of Annual Total Base Pay. Leave blank for none."
        : "Fixed amount for the year. Leave blank for none.";
    } else if (state.variableAnnual > 0) {
      $("variableHint").textContent = percent
        ? `${trim(state.variablePct)}% of Total Base Pay · ${inr0(state.variableAnnual)} a year, on top of Total Base Pay`
        : `${inr0(state.variableAnnual)} a year, on top of Total Base Pay`;
    } else if (percent && state.variablePct > 0) {
      $("variableHint").textContent = `${trim(state.variablePct)}% of Total Base Pay, on top of it`;
    } else {
      $("variableHint").textContent = percent
        ? "Percentage of Annual Total Base Pay. Leave blank for none."
        : "Fixed amount for the year. Leave blank for none.";
    }
    if (r) {
      $("annualBasic").value = num(r.basicAnnual);
      $("tbpHint").textContent = `${short(r.tbpAnnual)} a year · ${inr0(r.totalMonthly)} a month`;
      $("npsHint").textContent = state.npsPct === 0 ? "Of Basic, from special allowance" : `${inr(r.nps)} a month, from special allowance`;
    } else {
      $("tbpHint").textContent = "From ₹1,00,000 a year. You can also type 22.5L or 1.2Cr.";
    }
  }

  function renderStructure(r) {
    $("structureBody").innerHTML = r.rows.map((row) => `
      <tr>
        <td><div class="comp-name"><i style="background:${COLORS[row.key]}"></i>${row.name}</div><div class="comp-sub">${row.sub}</div></td>
        <td class="num amt${row.amount < 0 ? " neg" : ""}">${inr(row.amount)}</td>
        <td class="num amt${row.annual < 0 ? " neg" : ""}">${inr(row.annual)}</td>
      </tr>`).join("");
    const foot = [
      `<tr><td>Total Base Pay</td><td class="num">${inr(r.totalMonthly)}</td><td class="num">${inr(r.tbpAnnual)}</td></tr>`,
    ];
    if (!r.pfIncluded) {
      foot.push(`<tr class="extra"><td>Employer PF, over and above Total Base Pay<div class="comp-sub">12% of Basic, paid outside Total Base Pay. Not part of Total CTC.</div></td><td class="num">${inr(r.pfMonthly)}</td><td class="num">${inr(r.pfAnnual)}</td></tr>`);
    }
    if (r.variable > 0) {
      const how = state.variableMode === "percent" ? `${trim(state.variablePct)}% of Total Base Pay` : "Fixed annual amount";
      foot.push(`<tr class="extra"><td>Variable pay, on top of Total Base Pay<div class="comp-sub">${how}. Spread across 12 months. Taxed with salary on the slab. Not part of PF.</div></td><td class="num">${inr(r.variable / 12)}</td><td class="num">${inr(r.variable)}</td></tr>`);
    }
    if (r.variable > 0) {
      foot.push(`<tr class="ctc"><td>Total CTC<div class="comp-sub">${ctcDetail(r)}</div></td><td class="num">${inr(annualCtc(r) / 12)}</td><td class="num">${inr(annualCtc(r))}</td></tr>`);
    }
    $("structureFoot").innerHTML = foot.join("");
    $("structureSub").textContent =
      `Basic ${state.basicPct}% of Total Base Pay · HRA ${state.hraPct}% of Basic (${state.metro ? "Metro" : "Non-metro"}) · Corporate NPS ${state.npsPct ? state.npsPct + "% of Basic" : "None"} · Employer PF ${r.pfIncluded ? "included" : "over and above"}${r.variable > 0 ? ` · Variable ${inr0(r.variable)}` : ""}`;

    const parts = r.rows.filter((row) => row.annual > 0);
    $("compBar").innerHTML = parts.map((row) =>
      `<span style="width:${(row.annual / r.tbpAnnual) * 100}%;background:${COLORS[row.key]}" title="${row.name}: ${pct(row.annual / r.tbpAnnual)}"></span>`).join("");
    $("compLegend").innerHTML = parts.map((row) =>
      `<span><i style="background:${COLORS[row.key]}"></i>${row.name} ${pct(row.annual / r.tbpAnnual)}</span>`).join("");

    const over = r.pool < 0;
    const capped = state.npsPct > 0 && r.nps < r.npsWanted;
    $("structureWarn").hidden = !over && !capped && !r.internetLimited;
    $("structureWarn").textContent = [
      over ? `These allowances are over Total Base Pay by ${inr(-r.pool)} a month. Lower the Basic %.` : "",
      r.internetLimited && !over ? "Internet allowance is below ₹1,000 a month so the structure stays within Total Base Pay." : "",
      capped ? "Corporate NPS is capped at the special allowance available." : "",
    ].filter(Boolean).join(" ");
  }

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countTo(id, target, format) {
    const el = $(id);
    const prev = Number(el.dataset.value);
    const from = Number.isFinite(prev) ? prev : 0;
    el.dataset.value = String(target);
    cancelAnimationFrame(el._raf);
    if (reduceMotion || from === target) { el.textContent = format(target); return; }
    const start = performance.now();
    const duration = 650;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      if (p >= 1) { el.textContent = format(target); return; }
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (target - from) * eased);
      el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  function renderKpis(r, t, both) {
    const name = REGIMES[t.regime].name;
    const otherKey = t.regime === "new" ? "old" : "new";
    const gap = t.inhand - both[otherKey].inhand;
    countTo("kpiInhand", t.inhand / 12, inr0);
    let inhandSub = gap === 0
      ? `${name} · same in-hand as the ${REGIMES[otherKey].name.toLowerCase()}`
      : `${name} · ${inr0(Math.abs(gap) / 12)} a month ${gap > 0 ? "more" : "less"} than the ${REGIMES[otherKey].name.toLowerCase()}`;
    if (r.variable > 0) inhandSub += " · Variable pay spread across 12 months";
    $("kpiInhandSub").textContent = inhandSub;
    countTo("kpiInhandYear", t.inhand, inr0);
    $("kpiInhandYearSub").textContent = r.variable > 0
      ? `Includes Variable pay of ${inr0(r.variable)}, after slab tax`
      : `${pct(t.inhand / r.tbpAnnual)} of Total Base Pay`;
    countTo("kpiTax", t.tax.total, inr0);
    $("kpiTaxSub").textContent = r.variable > 0
      ? `${inr0(t.tax.total / 12)} a month in TDS · slab tax on fixed pay plus Variable pay`
      : `${inr0(t.tax.total / 12)} a month in TDS`;
    countTo("kpiRate", t.gross > 0 ? t.tax.total / t.gross : 0, pct);
    $("kpiRateSub").textContent = t.tax.total > 0 ? `Of gross salary · top slab ${pct(t.tax.topRate)}` : "No tax payable";
    countTo("kpiCtc", annualCtc(r), inr0);
    $("kpiCtcSub").textContent = ctcDetail(r);
    const employerPf = r.pfAnnual;
    const employeePf = r.pfAnnual;
    const nps = annualOf(r, "nps");
    countTo("kpiInvest", employerPf + employeePf + nps, inr0);
    $("kpiInvestSub").textContent = `Employer PF ${inr0(employerPf)} + Employee PF ${inr0(employeePf)} + NPS ${inr0(nps)}`;
  }

  function annualCtc(r) {
    return r.tbpAnnual + r.variable;
  }

  function ctcDetail(r) {
    if (!(r.variable > 0)) return "Equal to Annual Total Base Pay";
    return `Annual Total Base Pay ${inr0(r.tbpAnnual)} + Variable pay ${inr0(r.variable)}`;
  }

  function renderCompare(both) {
    const gain = both.new.inhand - both.old.inhand;
    const better = gain > 0 ? "new" : gain < 0 ? "old" : null;
    const other = better === "new" ? "old" : "new";
    const more = Math.abs(gain);
    const tile = (t) => `
      <button type="button" class="regime-tile${state.regime === t.regime ? " active" : ""}" data-regime="${t.regime}" aria-pressed="${state.regime === t.regime}">
        <div class="tile-top">
          <span class="tile-name">${REGIMES[t.regime].name}</span>
          <span>${better === t.regime ? '<span class="flag flag-best">Recommended</span> ' : ""}${state.regime === t.regime ? '<span class="flag flag-sel">Selected</span>' : ""}</span>
        </div>
        <div class="tile-inhand"><span class="tile-note">In-hand per month</span><strong>${inr0(t.inhand / 12)}</strong></div>
        <div class="tile-rows">
          <span>Income tax</span><span>${inr0(t.tax.total)}</span>
          <span>Deductions and exemptions</span><span>${inr0(t.deductions)}</span>
          <span>Taxable income</span><span>${inr0(t.taxable)}</span>
          <span>Gross salary</span><span>${inr0(t.gross)}</span>
          ${t.variable > 0 ? `<span>Variable pay</span><span>${inr0(t.variable)}</span>` : ""}
        </div>
      </button>`;
    let saving;
    if (!better) {
      saving = `<div class="saving even">Both regimes give the same in-hand of ${inr0(both.new.inhand / 12)} a month with these inputs.</div>`;
    } else {
      const chosen = state.regime === better;
      const follow = chosen
        ? "This is the regime you have selected."
        : `Switch to the ${REGIMES[better].name.toLowerCase()} to raise in-hand by ${inr0(more / 12)} a month.`;
      saving = `<div class="saving${chosen ? "" : " switch"}"><strong>Recommended: ${REGIMES[better].name}.</strong> In-hand is ${inr0(both[better].inhand / 12)} a month, ${inr0(more / 12)} more than the ${REGIMES[other].name.toLowerCase()} (${inr0(more)} a year). ${follow}</div>`;
    }
    $("regimeCompare").innerHTML = saving + tile(both.new) + tile(both.old);
  }

  function renderWaterfall(r, t) {
    const tbp = r.tbpAnnual;
    const v = t.variable;
    const ctc = annualCtc(r);
    const steps = [
      { label: "Total Base Pay", value: tbp, cls: "" },
      v > 0 ? { label: "Add Variable pay", note: `${inr0(v / 12)} a month, on top of Total Base Pay`, value: v, cls: "plus" } : null,
      v > 0 ? { label: "Total CTC", note: "Annual Total Base Pay + Variable pay", value: ctc, cls: "sub" } : null,
      r.pfIncluded ? { label: "Less Employer PF", note: "Part of Total Base Pay, paid into your PF account", value: t.pf, cls: "minus" } : null,
      t.nps > 0 ? { label: "Less Corporate NPS", note: "Paid into your NPS account", value: t.nps, cls: "minus" } : null,
      { label: "Gross cash salary", note: v > 0 ? "Includes Variable pay" : "", value: t.cash + v, cls: "sub" },
      { label: "Less Employee PF", note: "12% of Basic", value: t.pf, cls: "minus" },
      t.pt > 0 ? { label: "Less professional tax", note: "₹200 a month", value: t.pt, cls: "minus" } : null,
      { label: "Less income tax", note: `${REGIMES[t.regime].name}${t.variable > 0 ? " · slab tax on fixed pay plus Variable pay" : ""}`, value: t.tax.total, cls: "minus" },
      { label: "In-hand salary", note: `${inr0(t.inhand / 12)} a month`, value: t.inhand, cls: "final" },
    ].filter(Boolean);
    const scale = Math.max(tbp, ...steps.map((s) => s.value), 1);
    $("waterfallSub").textContent = `Per year · ${REGIMES[t.regime].name}${r.pfIncluded ? "" : " · Employer PF is paid over and above"}`;
    $("waterfall").innerHTML = steps.map((s) => `
      <div class="wf-row ${s.cls}">
        <div class="wf-label">${s.label}${s.note ? `<small>${s.note}</small>` : ""}</div>
        <div class="wf-track"><div class="wf-fill" style="width:${Math.max(0.5, Math.min(100, (Math.max(0, s.value) / scale) * 100))}%"></div></div>
        <div class="wf-amt">${s.cls === "minus" ? "− " : s.cls === "plus" ? "+ " : ""}${inr0(s.value)}</div>
      </div>`).join("");
  }

  function renderTaxTable(both) {
    const n = both.new;
    const o = both.old;
    const selNew = state.regime === "new";
    $("thNew").className = `num${selNew ? " sel" : ""}`;
    $("thOld").className = `num${selNew ? "" : " sel"}`;
    const cls = (reg) => `num${state.regime === reg ? " sel" : ""}`;
    const NA = '<span class="na">Not applicable</span>';
    const val = (v, opts = {}) => `<div class="amt">${opts.minus && v > 0 ? "− " : ""}${inr(v)}</div>${opts.note ? `<div class="amt-sub">${opts.note}</div>` : ""}`;
    const row = (name, sub, cellNew, cellOld, rowCls = "") => `
      <tr class="${rowCls}">
        <td><div class="comp-name">${name}</div>${sub ? `<div class="comp-sub">${sub}</div>` : ""}</td>
        <td class="${cls("new")}">${cellNew}</td>
        <td class="${cls("old")}">${cellOld}</td>
      </tr>`;
    const group = (label) => `<tr class="group"><td colspan="3">${label}</td></tr>`;

    const rows = [
      group("Income"),
      row("Gross cash salary", state.pfIncluded ? "Total Base Pay less Employer PF and Corporate NPS" : "Total Base Pay less Corporate NPS. Employer PF is paid over and above.", val(n.cash), val(o.cash)),
      n.variable > 0 ? row("Add: Variable pay, on top of Total Base Pay", state.variableMode === "percent" ? `${trim(state.variablePct)}% of Total Base Pay. Taxed as salary.` : "Fixed annual amount. Taxed as salary.", val(n.variable), val(o.variable)) : "",
      n.nps > 0 ? row("Add: Corporate NPS", "Employer contribution, deducted below up to the regime limit", val(n.nps), val(o.nps)) : "",
      n.excess > 0 ? row("Add: Employer PF and NPS above ₹7,50,000", "Taxable perquisite", val(n.excess), val(o.excess)) : "",
      row("Gross salary", "", val(n.gross), val(o.gross), "total"),

      group("Deductions and exemptions"),
      row("Standard deduction", "₹75,000 new · ₹50,000 old", val(n.standard, { minus: true }), val(o.standard, { minus: true })),
      row("Professional tax", "Deducted under both regimes. ₹200 a month when monthly cash pay is above ₹15,000.", val(n.ptDed, { minus: true }), val(o.ptDed, { minus: true })),
      row("Section 123, Employee PF", "Earlier section 80C. Old regime only, up to ₹1,50,000", NA,
        val(o.c80, { minus: true, note: c80Note(o.pf) })),
      row("Employer NPS, section 124", "Earlier 80CCD(2). Up to 14% of Basic new · 10% old", val(n.npsDed, { minus: true }), val(o.npsDed, { minus: true })),
      row("Taxable income", "", val(n.taxable), val(o.taxable), "total"),

      group("Income tax"),
      row("Tax on slabs", "", val(n.tax.base), val(o.tax.base)),
      row("Rebate, 87A (now 156)", "Up to ₹60,000 new · ₹12,500 old",
        val(n.tax.rebate, { minus: true, note: n.tax.marginalRelief ? "Includes marginal relief" : "" }), val(o.tax.rebate, { minus: true })),
      (n.tax.surcharge > 0 || o.tax.surcharge > 0) ? row("Surcharge", "From taxable income above ₹50 lakh",
        val(n.tax.surcharge, { note: n.tax.surchargeRelief ? "Marginal relief applied" : "" }),
        val(o.tax.surcharge, { note: o.tax.surchargeRelief ? "Marginal relief applied" : "" })) : "",
      row("Health and education cess", "4%", val(n.tax.cess), val(o.tax.cess)),
      row("Income tax payable", "Rounded to the nearest ₹10", val(n.tax.total), val(o.tax.total), "total"),

      group("Take-home"),
      row("Gross cash salary", "", val(n.cash), val(o.cash)),
      n.variable > 0 ? row("Add: Variable pay, on top of Total Base Pay", "Paid on top of Total Base Pay", val(n.variable), val(o.variable)) : "",
      row("Less: Employee PF", "12% of Basic", val(n.pf, { minus: true }), val(o.pf, { minus: true })),
      row("Less: professional tax", state.pt ? "₹200 a month when monthly cash pay is above ₹15,000" : "Turned off", val(n.pt, { minus: true }), val(o.pt, { minus: true })),
      row("Less: income tax", n.variable > 0 ? "Includes tax on Variable pay" : "", val(n.tax.total, { minus: true }), val(o.tax.total, { minus: true })),
      row("In-hand salary per year", n.variable > 0 ? "Fixed pay plus Variable pay, after slab tax" : "", val(n.inhand), val(o.inhand), "grand"),
      row("In-hand salary per month", n.variable > 0 ? "Variable pay and slab tax spread across 12 months" : "", val(n.inhand / 12), val(o.inhand / 12), "grand"),
    ];
    $("taxBody").innerHTML = rows.join("");
  }

  function renderSlabs(t) {
    const label = (lo, hi) => (hi === Infinity ? `Above ${inr0(lo)}` : `${inr0(lo)} – ${inr0(hi)}`);
    $("slabTitle").textContent = `Slab-wise tax · ${REGIMES[t.regime].name}`;
    const rows = t.tax.rows.map((s) => `
      <tr${s.inSlab > 0 ? "" : ' class="muted"'}>
        <td>${label(s.lo, s.hi)}</td>
        <td class="num">${pct(s.rate)}</td>
        <td class="num">${inr0(s.inSlab)}</td>
        <td class="num">${inr0(s.tax)}</td>
      </tr>`);
    rows.push(`<tr><td colspan="3">Less rebate${t.tax.marginalRelief ? " (marginal relief)" : ""}</td><td class="num">${t.tax.rebate > 0 ? "− " : ""}${inr(t.tax.rebate)}</td></tr>`);
    if (t.tax.surcharge > 0) rows.push(`<tr><td colspan="3">Add surcharge (${pct(t.tax.surchargeRate)})${t.tax.surchargeRelief ? " · marginal relief" : ""}</td><td class="num">${inr(t.tax.surcharge)}</td></tr>`);
    rows.push(`<tr><td colspan="3">Add 4% cess</td><td class="num">${inr(t.tax.cess)}</td></tr>`);
    rows.push(`<tr class="total"><td colspan="3"><strong>Income tax payable</strong><div class="comp-sub">Rounded to the nearest ₹10</div></td><td class="num"><strong>${inr0(t.tax.total)}</strong></td></tr>`);
    $("slabBody").innerHTML = rows.join("");
  }

  /* ---------- Input and validation ---------- */
  function setError(msg) {
    $("tbpError").textContent = msg;
    $("annualTbp").closest(".input-wrap").classList.toggle("invalid", !!msg);
  }

  function setVariableError(msg) {
    $("variableError").textContent = msg;
    $("variableWrap").classList.toggle("invalid", !!msg);
  }

  function variableMessage(raw) {
    if (!String(raw).trim()) return "";
    if (state.variableMode === "percent") {
      const p = parsePercent(raw);
      if (!Number.isFinite(p)) return "Enter a percentage, for example 10.";
      if (p < 0 || p > 100) return "Enter a percentage from 0 to 100.";
      return "";
    }
    const v = parseAmount(raw);
    if (!Number.isFinite(v) || v < 0) return "Enter a valid Variable pay amount.";
    if (v > MAX_TBP) return "Enter at most ₹1,00,00,00,000.";
    return "";
  }

  // Reads the variable field into state. An invalid entry counts as zero and shows an error.
  function applyVariable(strict) {
    const input = $("variablePay");
    const msg = variableMessage(input.value);
    setVariableError(msg);
    if (msg || !String(input.value).trim()) {
      state.variablePct = 0;
      state.variableAnnual = 0;
      return;
    }
    if (state.variableMode === "percent") {
      state.variablePct = parsePercent(input.value);
      state.variableAnnual = state.tbpAnnual ? round2(state.tbpAnnual * state.variablePct / 100) : 0;
      if (strict) input.value = trim(state.variablePct);
    } else {
      state.variablePct = 0;
      state.variableAnnual = parseAmount(input.value);
      if (strict) input.value = num(state.variableAnnual, 0);
    }
  }

  function syncVariableField() {
    const percent = state.variableMode === "percent";
    $("variablePrefix").textContent = percent ? "%" : "₹";
    $("variablePay").inputMode = percent ? "decimal" : "numeric";
  }

  function validationMessage(raw) {
    if (!String(raw).trim()) return "Enter your Annual Total Base Pay.";
    const v = parseAmount(raw);
    if (!Number.isFinite(v) || v <= 0) return "Enter a valid Annual Total Base Pay.";
    if (v < MIN_TBP) return "Enter at least ₹1,00,000.";
    if (v > MAX_TBP) return "Enter at most ₹1,00,00,00,000.";
    return "";
  }

  // strict: show errors and reformat the field. Otherwise update quietly while typing.
  function calculateStructure(strict = true) {
    const input = $("annualTbp");
    const msg = validationMessage(input.value);
    if (msg) {
      state.result = null;
      state.tbpAnnual = null;
      setError(strict && String(input.value).trim() ? msg : strict ? msg : "");
      renderAll();
      return;
    }
    const val = parseAmount(input.value);
    setError("");
    state.tbpAnnual = val;
    state.pfIncluded = $("pfIncluded").checked;
    if (strict) input.value = num(val, 0);
    applyVariable(false);
    state.result = compute(val);
    renderAll();
  }

  function readDeductions() {
    state.pt = $("ptToggle").checked;
  }

  function syncChoices() {
    const on = (sel, test) => document.querySelectorAll(sel).forEach((b) => {
      const active = test(b);
      b.classList.toggle("active", active);
      if (b.classList.contains("choice")) b.setAttribute("aria-pressed", String(active));
    });
    on("[data-basic]", (b) => Number(b.dataset.basic) === state.basicPct);
    on("[data-metro]", (b) => (b.dataset.metro === "1") === state.metro);
    on("[data-nps]", (b) => Number(b.dataset.nps) === state.npsPct);
    on(".choice[data-regime]", (b) => b.dataset.regime === state.regime);
    on("[data-variable]", (b) => b.dataset.variable === state.variableMode);
    syncVariableField();
  }

  function resetAll() {
    Object.assign(state, defaults());
    ["annualTbp", "variablePay", "serviceDate", "calcDate"]
      .forEach((id) => { $(id).value = ""; });
    $("ptToggle").checked = true;
    $("pfIncluded").checked = true;
    setError("");
    setVariableError("");
    syncChoices();
    renderAll();
    $("annualTbp").focus();
  }

  /* ---------- Gratuity ---------- */
  function parseDate(s) {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const fmtDate = (dt) => dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  function addYearsDays(dt, years, days) {
    const r = new Date(dt.getFullYear() + years, dt.getMonth(), dt.getDate());
    r.setDate(r.getDate() + days);
    return r;
  }
  function completedYearsMonths(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) months -= 1;
    return { years: Math.floor(months / 12), months: months % 12 };
  }
  function setStatus(msg, cls) {
    const el = $("gratuityStatus");
    el.textContent = msg;
    el.className = "status-text " + (cls || "");
  }
  function clearGratuityResult() {
    $("gratResult").hidden = true;
    $("eligDate").textContent = "—";
    $("tenure").textContent = "—";
    $("tenureSub").textContent = "";
    $("gratAmount").textContent = "—";
    setStatus("");
  }
  function calculateGratuity() {
    const start = parseDate($("serviceDate").value);
    const end = parseDate($("calcDate").value);
    clearGratuityResult();
    state.gratuityShown = true;
    if (!state.result) return setStatus("Enter Annual Total Base Pay first. Gratuity uses the monthly basic salary.", "err");
    if (!start || !end) return setStatus("Enter both the continuous service date and the gratuity calculation date.", "err");
    if (end < parseDate(GRATUITY_MIN_CALC_DATE)) return setStatus("The gratuity calculation date must be 1 December 2026 or later.", "err");
    if (end <= start) return setStatus("The gratuity calculation date must be after the continuous service date.", "err");

    const elig = addYearsDays(start, 4, 240);
    const { years, months } = completedYearsMonths(start, end);
    const tenure = years + (months >= 6 ? 1 : 0);
    $("gratResult").hidden = false;
    $("eligDate").textContent = fmtDate(elig);
    $("tenure").textContent = `${tenure} ${tenure === 1 ? "year" : "years"}`;
    $("tenureSub").textContent = `${years} years ${months} months completed`;
    if (end < elig) {
      $("gratAmount").textContent = "Not eligible";
      return setStatus(`Not eligible on the calculation date. Eligibility starts on ${fmtDate(elig)}.`, "warn");
    }
    const amount = Math.round((15 / 26) * tenure * state.result.wage);
    $("gratAmount").textContent = inr0(amount);
    setStatus(`Eligible. 15 ÷ 26 × ${tenure} × ${inr(state.result.wage)} = ${inr0(amount)}.`, "ok");
  }

  /* ---------- Events ---------- */
  $("salaryForm").addEventListener("submit", (e) => { e.preventDefault(); calculateStructure(true); });
  $("resetTableBtn").addEventListener("click", resetAll);
  $("printBtn").addEventListener("click", () => window.print());

  $("annualTbp").addEventListener("input", () => calculateStructure(false));
  $("annualTbp").addEventListener("blur", () => { if (String($("annualTbp").value).trim()) calculateStructure(true); });

  $("ptToggle").addEventListener("change", () => { readDeductions(); renderAll(); });

  $("variablePay").addEventListener("input", () => {
    applyVariable(false);
    if (state.tbpAnnual) {
      state.result = compute(state.tbpAnnual);
      renderAll();
    } else renderHints();
  });
  $("variablePay").addEventListener("blur", () => {
    if (!String($("variablePay").value).trim()) return;
    applyVariable(true);
    if (state.tbpAnnual) {
      state.result = compute(state.tbpAnnual);
      renderAll();
    } else renderHints();
  });
  $("pfIncluded").addEventListener("change", () => {
    state.pfIncluded = $("pfIncluded").checked;
    if (state.tbpAnnual) {
      state.result = compute(state.tbpAnnual);
      renderAll();
    } else renderHints();
  });

  document.body.addEventListener("click", (e) => {
    const b = e.target.closest("[data-basic], [data-nps], [data-regime], [data-metro], [data-variable]");
    if (!b) return;
    if (b.dataset.basic) state.basicPct = Number(b.dataset.basic);
    if (b.dataset.nps) state.npsPct = Number(b.dataset.nps);
    if (b.dataset.regime) state.regime = b.dataset.regime;
    if (b.dataset.metro) {
      state.metro = b.dataset.metro === "1";
      state.hraPct = state.metro ? 50 : 40;
    }
    if (b.dataset.variable && b.dataset.variable !== state.variableMode) {
      state.variableMode = b.dataset.variable;
      state.variablePct = 0;
      state.variableAnnual = 0;
      $("variablePay").value = "";
      setVariableError("");
    }
    syncChoices();
    if (state.result && !b.dataset.regime) state.result = compute(state.tbpAnnual);
    renderAll();
  });

  $("calcGratuityBtn").addEventListener("click", calculateGratuity);
  ["serviceDate", "calcDate"].forEach((id) => $(id).addEventListener("change", () => { if (state.gratuityShown) calculateGratuity(); }));
  $("clearGratuityBtn").addEventListener("click", () => {
    $("serviceDate").value = "";
    $("calcDate").value = "";
    state.gratuityShown = false;
    clearGratuityResult();
  });

  syncChoices();
  renderAll();
})();
