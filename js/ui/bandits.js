/** Multi-Armed Bandits UI — arm preview + simulation runner. */

import { getCSSVar, armColors } from '../core/utils.js';
import { GreedyStrategy, EpsilonGreedyStrategy, UCBStrategy, BoltzmannStrategy } from '../core/strategies.js';
import { BanditEnvironment } from '../environments/bandit.js';
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

function showArmPreview() {
  const arms = +document.getElementById('mab-arms').value;
  const env = new BanditEnvironment(arms);
  const canvas = document.getElementById('mab-arms-chart');
  if (!canvas) return;
  new ChartRenderer(canvas).drawBarChart(Array.from(env.trueValues), armColors(arms), {
    ylabel: 'True Value q*(a)', xlabel: 'Arm', showDistribution: true
  });
}

document.getElementById('mab-generate').addEventListener('click', showArmPreview);

document.getElementById('mab-run').addEventListener('click', function () {
  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Running...';

  setTimeout(() => {
    const arms = +document.getElementById('mab-arms').value;
    const steps = +document.getElementById('mab-steps').value;
    const runs = +document.getElementById('mab-runs').value;
    const epsilon = +document.getElementById('mab-epsilon').value;
    const ucbC = +document.getElementById('mab-ucb-c').value;
    const tau = +document.getElementById('mab-tau').value;

    showArmPreview();

    const strategies = [
      { strategy: new GreedyStrategy(), label: 'Pure Greedy' },
      { strategy: new EpsilonGreedyStrategy(epsilon), label: `ε-Greedy (ε=${epsilon})` },
      { strategy: new UCBStrategy(ucbC), label: `UCB (c=${ucbC})` },
      { strategy: new BoltzmannStrategy(tau), label: `Boltzmann (τ=${tau})` },
    ];
    const colors = ['var(--strategy-greedy)', 'var(--strategy-epsilon)', 'var(--strategy-ucb)', 'var(--strategy-boltzmann)'];
    const configs = strategies.map(s => ({ strategy: s.strategy }));

    const { avgRewards, optimalCounts } = runBanditSimulation(() => new BanditEnvironment(arms), configs, steps, runs);

    const chartSeries = strategies.map((s, i) => ({ data: avgRewards[i], color: colors[i], label: s.label }));
    new ChartRenderer(document.getElementById('mab-chart')).drawLineChart(chartSeries, { xlabel: 'Steps', ylabel: 'Average Reward', smooth: 10 });
    buildLegend('mab-legend', chartSeries);

    populateTable('mab-table', strategies.map((s, i) => {
      const last50 = avgRewards[i].slice(-50);
      const finalAvg = last50.reduce((a, b) => a + b, 0) / 50;
      const total = avgRewards[i].reduce((a, b) => a + b, 0);
      const optPct = optimalCounts[i].slice(-50).reduce((a, b) => a + b, 0) / 50 * 100;
      return { name: s.label, color: colors[i], finalReward: finalAvg.toFixed(3), totalReward: total.toFixed(1), extra: optPct.toFixed(1) + '%' };
    }));

    btn.disabled = false;
    btn.textContent = 'Run Simulation';
  }, 50);
});

// Initial preview on load
showArmPreview();
