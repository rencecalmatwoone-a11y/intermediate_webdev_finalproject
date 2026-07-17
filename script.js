/**
 * Interest Rate Calculator
 * -------------------------------------------------------------------------
 * Pure calculation functions are kept separate from DOM code so they can be
 * unit-tested with Jasmine in Node (where `document`/`window` don't exist)
 * and still work when the file is loaded directly in the browser.
 * -------------------------------------------------------------------------
 */

/**
 * Safely convert a value to a finite number.
 * Prevents TypeErrors / NaN propagation when a field is empty, contains
 * text, or is otherwise not a valid number.
 *
 * @param {*} value - Raw value, usually from a form input.
 * @param {number} [fallback=0] - Value to return if conversion fails.
 * @returns {number} A finite number.
 */
function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Calculate simple interest.
 * Formula: I = P * (r / 100) * t
 *
 * @param {number} principal - Starting amount.
 * @param {number} rate - Annual interest rate, as a percentage (e.g. 5 for 5%).
 * @param {number} time - Time in years.
 * @returns {number} The interest earned (not including principal).
 */
function calculateSimpleInterest(principal, rate, time) {
  const p = toNumber(principal);
  const r = toNumber(rate);
  const t = toNumber(time);

  if (p < 0 || r < 0 || t < 0) return 0;

  return p * (r / 100) * t;
}

/**
 * Calculate compound interest.
 * Formula: A = P * (1 + r / (100 * n)) ^ (n * t); Interest = A - P
 *
 * @param {number} principal - Starting amount.
 * @param {number} rate - Annual interest rate, as a percentage.
 * @param {number} time - Time in years.
 * @param {number} [frequency=1] - Number of times interest compounds per year.
 * @returns {number} The interest earned (not including principal).
 */
function calculateCompoundInterest(principal, rate, time, frequency = 1) {
  const p = toNumber(principal);
  const r = toNumber(rate);
  const t = toNumber(time);
  const n = toNumber(frequency, 1) || 1;

  if (p < 0 || r < 0 || t < 0 || n <= 0) return 0;

  const amount = p * Math.pow(1 + r / (100 * n), n * t);
  return amount - p;
}

/**
 * Build a series of {year, simpleTotal, compoundTotal} points for charting.
 *
 * @param {number} principal
 * @param {number} rate
 * @param {number} time
 * @param {number} frequency
 * @param {number} [steps=10] - Number of points to generate across the timeline.
 * @returns {Array<{year: number, simpleTotal: number, compoundTotal: number}>}
 */
function buildGrowthSeries(principal, rate, time, frequency, steps = 10) {
  const p = toNumber(principal);
  const t = toNumber(time);
  const series = [];
  const safeSteps = Math.max(1, steps);

  for (let i = 0; i <= safeSteps; i += 1) {
    const year = (t * i) / safeSteps;
    series.push({
      year,
      simpleTotal: p + calculateSimpleInterest(principal, rate, year),
      compoundTotal: p + calculateCompoundInterest(principal, rate, year, frequency),
    });
  }

  return series;
}

/**
 * Format a number as Philippine peso currency for display.
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  const n = toNumber(value);
  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* =========================================================================
 * Browser-only wiring below. Guarded so this file can be safely `require`d
 * from Node/Jasmine without throwing (no `document` in that environment).
 * ========================================================================= */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("calculator-form");
    const principalInput = document.getElementById("principal");
    const rateInput = document.getElementById("rate");
    const timeInput = document.getElementById("time");
    const frequencyInput = document.getElementById("frequency");
    const errorEl = document.getElementById("form-error");

    const simpleValueEl = document.getElementById("simple-value");
    const simpleTotalEl = document.getElementById("simple-total");
    const compoundValueEl = document.getElementById("compound-value");
    const compoundTotalEl = document.getElementById("compound-total");
    const chartEl = document.getElementById("growth-chart");

    /** Read and validate form inputs. Returns null if invalid. */
    function readInputs() {
      const principal = toNumber(principalInput.value, NaN);
      const rate = toNumber(rateInput.value, NaN);
      const time = toNumber(timeInput.value, NaN);
      const frequency = toNumber(frequencyInput.value, 1);

      if (
        !Number.isFinite(principal) ||
        !Number.isFinite(rate) ||
        !Number.isFinite(time) ||
        principal < 0 ||
        rate < 0 ||
        time < 0
      ) {
        return null;
      }

      return { principal, rate, time, frequency };
    }

    /** Render the SVG line chart comparing simple vs. compound growth. */
    function renderChart(series) {
      if (!chartEl) return;

      const width = 480;
      const height = 220;
      const padding = 32;

      const maxValue = series.reduce(
        (max, point) => Math.max(max, point.simpleTotal, point.compoundTotal),
        0
      );
      const maxYear = series.length ? series[series.length - 1].year : 1;

      const scaleX = (year) =>
        padding + (maxYear === 0 ? 0 : (year / maxYear) * (width - padding * 2));
      const scaleY = (value) =>
        height - padding - (maxValue === 0 ? 0 : (value / maxValue) * (height - padding * 2));

      const toPath = (key) =>
        series
          .map((point, i) => `${i === 0 ? "M" : "L"} ${scaleX(point.year).toFixed(1)} ${scaleY(point[key]).toFixed(1)}`)
          .join(" ");

      const simplePath = toPath("simpleTotal");
      const compoundPath = toPath("compoundTotal");

      chartEl.innerHTML = `
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d9d2bf" />
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#d9d2bf" />
        <path d="${simplePath}" fill="none" stroke="#0f1b2d" stroke-width="2.5" />
        <path d="${compoundPath}" fill="none" stroke="#1e7a54" stroke-width="2.5" />
      `;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const inputs = readInputs();

      if (!inputs) {
        errorEl.textContent = "Please enter valid, non-negative numbers in every field.";
        return;
      }

      errorEl.textContent = "";

      const { principal, rate, time, frequency } = inputs;
      const simpleInterest = calculateSimpleInterest(principal, rate, time);
      const compoundInterest = calculateCompoundInterest(principal, rate, time, frequency);

      simpleValueEl.textContent = formatCurrency(simpleInterest);
      simpleTotalEl.textContent = formatCurrency(principal + simpleInterest);
      compoundValueEl.textContent = formatCurrency(compoundInterest);
      compoundTotalEl.textContent = formatCurrency(principal + compoundInterest);

      renderChart(buildGrowthSeries(principal, rate, time, frequency));
    });
  });
}

/* Export for Node / Jasmine unit tests. Ignored by the browser. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    toNumber,
    calculateSimpleInterest,
    calculateCompoundInterest,
    buildGrowthSeries,
    formatCurrency,
  };
}
