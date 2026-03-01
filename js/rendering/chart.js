/** Canvas 2D chart renderer — line, bar, and evolution charts. */

import { getCSSVar } from '../core/utils.js';

export class ChartRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  _setup() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    return { W: rect.width, H: rect.height };
  }

  _drawAxes(pad, plotW, plotH) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#2d333b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();
  }

  _drawYTicks(pad, plotH, yMin, yMax, ticks = 5) {
    const ctx = this.ctx;
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= ticks; i++) {
      const v = yMin + (yMax - yMin) * (i / ticks);
      const y = pad.top + plotH - (i / ticks) * plotH;
      ctx.fillText(v.toFixed(1), pad.left - 8, y + 4);
      if (i > 0 && i < ticks) {
        ctx.strokeStyle = '#2d333b44';
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + pad.plotW, y);
        ctx.stroke();
      }
    }
  }

  _drawLabels(pad, W, H, plotW, plotH, xlabel, ylabel) {
    const ctx = this.ctx;
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px "JetBrains Mono", monospace';
    if (xlabel) {
      ctx.textAlign = 'center';
      ctx.fillText(xlabel, pad.left + plotW / 2, H - 4);
    }
    if (ylabel) {
      ctx.save();
      ctx.translate(12, pad.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(ylabel, 0, 0);
      ctx.restore();
    }
  }

  /** Multi-series line chart. series: [{ data, color, label }] */
  drawLineChart(series, opts = {}) {
    const { W, H } = this._setup();
    const ctx = this.ctx;
    const pad = { top: 20, right: 20, bottom: 36, left: 56 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.fillStyle = getCSSVar('var(--bg-secondary)');
    ctx.fillRect(0, 0, W, H);

    let yMin = Infinity, yMax = -Infinity;
    const maxLen = Math.max(...series.map(s => s.data.length));
    for (const s of series) {
      for (let i = 0; i < s.data.length; i++) {
        if (s.data[i] < yMin) yMin = s.data[i];
        if (s.data[i] > yMax) yMax = s.data[i];
      }
    }
    const yPad = (yMax - yMin) * 0.08 || 0.5;
    yMin -= yPad;
    yMax += yPad;

    // Axes
    ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Y ticks
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const v = yMin + (yMax - yMin) * (i / 5);
      const y = pad.top + plotH - (i / 5) * plotH;
      ctx.fillText(v.toFixed(1), pad.left - 8, y + 4);
      if (i > 0 && i < 5) {
        ctx.strokeStyle = '#2d333b44';
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();
      }
    }

    // X ticks
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6e7681';
    for (let i = 0; i <= 5; i++) {
      const v = Math.round(maxLen * (i / 5));
      ctx.fillText(v, pad.left + (i / 5) * plotW, pad.top + plotH + 20);
    }

    this._drawLabels(pad, W, H, plotW, plotH, opts.xlabel, opts.ylabel);

    // Lines
    const maxPoints = 600;
    for (const s of series) {
      const data = s.data;
      const len = data.length;
      const step = len > maxPoints ? Math.ceil(len / maxPoints) : 1;
      ctx.strokeStyle = getCSSVar(s.color);
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < len; i += step) {
        let val = data[i];
        if (opts.smooth && opts.smooth > 1) {
          const lo = Math.max(0, i - opts.smooth);
          const hi = Math.min(len - 1, i + opts.smooth);
          let sum = 0, cnt = 0;
          for (let j = lo; j <= hi; j++) { sum += data[j]; cnt++; }
          val = sum / cnt;
        }
        const x = pad.left + (i / Math.max(1, maxLen - 1)) * plotW;
        const y = pad.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  /** Bar chart for showing bandit arm values with ±1σ whiskers. */
  drawBarChart(values, colors, opts = {}) {
    const { W, H } = this._setup();
    const ctx = this.ctx;
    const pad = { top: 20, right: 20, bottom: 36, left: 56 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.fillStyle = getCSSVar('var(--bg-secondary)');
    ctx.fillRect(0, 0, W, H);

    const yMin = Math.min(...values, 0) - 1.8;
    const yMax = Math.max(...values, 0) + 1.8;
    const yRange = yMax - yMin;

    // Axes
    ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Zero line
    const zeroY = pad.top + plotH - ((0 - yMin) / yRange) * plotH;
    ctx.strokeStyle = '#6e768144';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(pad.left + plotW, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y ticks
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = yMin + yRange * (i / 4);
      ctx.fillText(v.toFixed(1), pad.left - 8, pad.top + plotH - (i / 4) * plotH + 4);
    }

    const n = values.length;
    const barWidth = Math.min(40, (plotW / n) * 0.65);
    const gap = (plotW - barWidth * n) / (n + 1);

    for (let i = 0; i < n; i++) {
      const x = pad.left + gap + i * (barWidth + gap);
      const val = values[i];
      const barH = Math.abs(val) / yRange * plotH;
      const barY = val >= 0 ? zeroY - barH : zeroY;
      const color = colors[i % colors.length];

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, barY, barWidth, barH);

      // ±1σ whiskers
      if (opts.showDistribution) {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const cx = x + barWidth / 2;
        const topY = pad.top + plotH - ((val + 1 - yMin) / yRange) * plotH;
        const botY = pad.top + plotH - ((val - 1 - yMin) / yRange) * plotH;
        ctx.beginPath();
        ctx.moveTo(cx, topY); ctx.lineTo(cx, botY);
        ctx.moveTo(cx - 6, topY); ctx.lineTo(cx + 6, topY);
        ctx.moveTo(cx - 6, botY); ctx.lineTo(cx + 6, botY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Label
      ctx.fillStyle = '#6e7681';
      ctx.textAlign = 'center';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${i + 1}`, x + barWidth / 2, pad.top + plotH + 16);
    }

    this._drawLabels(pad, W, H, plotW, plotH, opts.xlabel, opts.ylabel);
  }

  /** Multi-line arm evolution chart showing drift over time. */
  drawEvolutionChart(histories, colors, opts = {}) {
    const { W, H } = this._setup();
    const ctx = this.ctx;
    const pad = { top: 20, right: 20, bottom: 36, left: 56 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.fillStyle = getCSSVar('var(--bg-secondary)');
    ctx.fillRect(0, 0, W, H);

    const numArms = histories.length;
    const numSteps = histories[0].length;

    let yMin = Infinity, yMax = -Infinity;
    for (let a = 0; a < numArms; a++) {
      for (let t = 0; t < numSteps; t++) {
        if (histories[a][t] < yMin) yMin = histories[a][t];
        if (histories[a][t] > yMax) yMax = histories[a][t];
      }
    }
    const yPad = (yMax - yMin) * 0.08 || 0.5;
    yMin -= yPad;
    yMax += yPad;

    // Axes
    ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Y ticks
    ctx.fillStyle = '#6e7681';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (yMax - yMin) * (i / 4);
      ctx.fillText(v.toFixed(1), pad.left - 8, pad.top + plotH - (i / 4) * plotH + 4);
    }

    // X ticks
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const v = Math.round(numSteps * (i / 5));
      ctx.fillText(v, pad.left + (i / 5) * plotW, pad.top + plotH + 20);
    }

    // Arm trajectories
    const maxPoints = 500;
    const step = numSteps > maxPoints ? Math.ceil(numSteps / maxPoints) : 1;

    for (let a = 0; a < numArms; a++) {
      ctx.strokeStyle = colors[a % colors.length];
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.7;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let first = true;
      for (let t = 0; t < numSteps; t += step) {
        const x = pad.left + (t / Math.max(1, numSteps - 1)) * plotW;
        const y = pad.top + plotH - ((histories[a][t] - yMin) / (yMax - yMin)) * plotH;
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    this._drawLabels(pad, W, H, plotW, plotH, opts.xlabel, opts.ylabel);
  }
}
