/** Non-Stationary Bandits UI — arm evolution + strategy comparison. */

import { getCSSVar, armColors } from '../core/utils.js';
import { EpsilonGreedyStrategy, DecayingEpsilonGreedyStrategy, UCBStrategy, GreedyStrategy } from '../core/strategies.js';
import { NonStationaryBanditEnvironment } from '../environments/nonstationary-bandit.js';
import { ChartRenderer } from '../rendering/chart.js';
import { runBanditSimulation } from '../simulation/runners.js';

function buildLegend(id, items) {
  document.getElementById(id).innerHTML = items.map(item => {
    const c = getCSSVar(item.color);
    return `<div class="legend-item"><div class="legend-swatch" style="background:${c}"></div>${item.label}</div>`;
  }).join('');
}

function populateTable(id, rows) {
  document.querySelector(`#${id} tbody`).innerHTML = rows.map(r => {
    const c = getCSSVar(r.color);
    return `<tr><td><span class="strategy-dot" style="background:${c}"></span>${r.name}</td><td>${r.finalReward}</td><td>${r.totalReward}</td><td>${r.extra}</td></tr>`;
  }).join('');
}

document.getElementById('ns-run').addEventListener('click', function () {
  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Running...';

  setTimeout(() => {
    const arms = +document.getElementById('ns-arms').value;
    const steps = +document.getElementById('ns-steps').value;
    const runs = +document.getElementById('ns-runs').value;
    const drift = +document.getElementById('ns-drift').value;
    const alpha = +document.getElementById('ns-alpha').value;

    const strategies = [
      { strategy: new EpsilonGreedyStrategy(0.1), label: `Constant ε=0.1 (α=${alpha})`, stepSizeMode: 'constant', alpha },
      { strategy: new DecayingEpsilonGreedyStrategy(1.0, 0.997, 0.01), label: 'Decaying ε (sample avg)' },
      { strategy: new UCBStrategy(2), label: 'UCB (sample avg)' },
      { strategy: new GreedyStrategy(), label: 'Pure Greedy (sample avg)' },
    ];
    const colors = ['var(--strategy-epsilon)', 'var(--strategy-decay)', 'var(--strategy-ucb)', 'var(--strategy-greedy)'];
    const configs = strategies.map(s => ({ strategy: s.strategy, stepSizeMode: s.stepSizeMode || 'sample-average', alpha: s.alpha || 0.1 }));

    const result = runBanditSimulation(() => new NonStationaryBanditEnvironment(arms, drift), configs, steps, runs, { trackArmEvolution: true });

    // Arm evolution chart
    if (result.armHistories) {
      const ac = armColors(arms);
      new ChartRenderer(document.getElementById('ns-evolution-chart')).drawEvolutionChart(result.armHistories, ac, { xlabel: 'Steps', ylabel: 'True Arm Value q*(a)' });
      const legendEl = document.getElementById('ns-evolution-legend');
      if (legendEl) {
        legendEl.innerHTML = result.armHistories.map((_, i) =>
          `<div class="legend-item"><div class="legend-swatch" style="background:${ac[i]}"></div>Arm ${i + 1}</div>`
        ).join('');
      }
    }

    // Strategy comparison
    const chartSeries = strategies.map((s, i) => ({ data: result.avgRewards[i], color: colors[i], label: s.label }));
    new ChartRenderer(document.getElementById('ns-chart')).drawLineChart(chartSeries, { xlabel: 'Steps', ylabel: 'Average Reward', smooth: 20 });
    buildLegend('ns-legend', chartSeries);

    populateTable('ns-table', strategies.map((s, i) => {
      const finalAvg = result.avgRewards[i].slice(-100).reduce((a, b) => a + b, 0) / 100;
      const total = result.avgRewards[i].reduce((a, b) => a + b, 0);
      const earlyAvg = result.avgRewards[i].slice(0, 100).reduce((a, b) => a + b, 0) / 100;
      return { name: s.label, color: colors[i], finalReward: finalAvg.toFixed(3), totalReward: total.toFixed(1), extra: finalAvg > earlyAvg ? '✓ Adapts' : '✗ Stale' };
    }));

    btn.disabled = false;
    btn.textContent = 'Run Simulation';
  }, 50);
});
