/** Cliff Walking UI — trains SARSA and Q-learning side-by-side. */

import { argmax, smoothData, getCSSVar } from '../core/utils.js';
import { CliffWalkingEnvironment } from '../environments/cliffwalking.js';
import { ChartRenderer } from '../rendering/chart.js';
import { runQLearning, runSarsa } from '../simulation/runners.js';

let sarsaQ = null;
let qlearnQ = null;

function renderCliffGrid(containerId, env, Q, agentPos) {
  const container = document.getElementById(containerId);
  container.style.gridTemplateColumns = `repeat(${env.cols}, 46px)`;
  container.innerHTML = '';

  const arrows = ['↑', '→', '↓', '←'];
  let maxV = -Infinity, minV = Infinity;

  if (Q) {
    for (let r = 0; r < env.rows; r++) {
      for (let c = 0; c < env.cols; c++) {
        if (env.isCliff(r, c)) continue;
        const v = Math.max(...Q[r * env.cols + c]);
        if (v > maxV) maxV = v;
        if (v < minV) minV = v;
      }
    }
  }

  for (let r = 0; r < env.rows; r++) {
    for (let c = 0; c < env.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cliff-cell';

      if (env.isCliff(r, c)) {
        cell.classList.add('cliff-danger');
        cell.textContent = '☠';
      } else if (r === env.start[0] && c === env.start[1]) {
        cell.classList.add('cliff-start');
        if (Q) cell.innerHTML = `<span class="arrow">${arrows[argmax(Q[r * env.cols + c])]}</span>`;
        else cell.textContent = 'S';
      } else if (r === env.goal[0] && c === env.goal[1]) {
        cell.classList.add('cliff-goal');
        cell.textContent = 'G';
      } else if (Q) {
        const state = r * env.cols + c;
        const v = Math.max(...Q[state]);
        const norm = maxV > minV ? (v - minV) / (maxV - minV) : 0;
        cell.style.background = `rgba(57,210,192,${0.03 + norm * 0.2})`;
        cell.innerHTML = `<span class="arrow">${arrows[argmax(Q[state])]}</span>`;
      }

      if (agentPos && r === agentPos[0] && c === agentPos[1]) cell.classList.add('cliff-agent');
      container.appendChild(cell);
    }
  }
}

// Initial empty grids
const initEnv = new CliffWalkingEnvironment();
renderCliffGrid('cliff-grid-sarsa', initEnv, null, null);
renderCliffGrid('cliff-grid-qlearn', initEnv, null, null);

document.getElementById('cliff-run').addEventListener('click', function () {
  const btn = this;
  const watchS = document.getElementById('cliff-watch-sarsa');
  const watchQ = document.getElementById('cliff-watch-qlearn');
  btn.disabled = true;
  btn.textContent = 'Training...';
  watchS.disabled = true;
  watchQ.disabled = true;

  setTimeout(() => {
    const episodes = +document.getElementById('cliff-episodes').value;
    const alpha = +document.getElementById('cliff-alpha').value;
    const gamma = +document.getElementById('cliff-gamma').value;
    const epsilon = +document.getElementById('cliff-epsilon').value;

    const sarsaResult = runSarsa(new CliffWalkingEnvironment(), episodes, alpha, gamma, epsilon);
    sarsaQ = sarsaResult.Q.map(row => Float64Array.from(row));

    const qlResult = runQLearning(new CliffWalkingEnvironment(), episodes, alpha, gamma, epsilon);
    qlearnQ = qlResult.Q.map(row => Float64Array.from(row));

    // Reward comparison chart
    const smoothedS = smoothData(Float64Array.from(sarsaResult.rewardPerEpisode), 50);
    const smoothedQ = smoothData(Float64Array.from(qlResult.rewardPerEpisode), 50);

    new ChartRenderer(document.getElementById('cliff-chart')).drawLineChart([
      { data: smoothedS, color: 'var(--strategy-ucb)', label: 'SARSA (on-policy)' },
      { data: smoothedQ, color: 'var(--strategy-boltzmann)', label: 'Q-learning (off-policy)' },
    ], { xlabel: 'Episode', ylabel: 'Reward per Episode (smoothed)' });

    document.getElementById('cliff-legend').innerHTML =
      `<div class="legend-item"><div class="legend-swatch" style="background:${getCSSVar('var(--strategy-ucb)')}"></div>SARSA</div>` +
      `<div class="legend-item"><div class="legend-swatch" style="background:${getCSSVar('var(--strategy-boltzmann)')}"></div>Q-learning</div>`;

    // Render policy grids
    const displayEnv = new CliffWalkingEnvironment();
    renderCliffGrid('cliff-grid-sarsa', displayEnv, sarsaQ, null);
    renderCliffGrid('cliff-grid-qlearn', displayEnv, qlearnQ, null);

    // Stats
    const sAvg = (sarsaResult.rewardPerEpisode.slice(-100).reduce((a, b) => a + b, 0) / 100).toFixed(1);
    const qAvg = (qlResult.rewardPerEpisode.slice(-100).reduce((a, b) => a + b, 0) / 100).toFixed(1);
    document.getElementById('cliff-stats').innerHTML =
      `<div>SARSA last 100 avg: <span class="stat-value">${sAvg} reward</span></div>` +
      `<div>Q-learning last 100 avg: <span class="stat-value">${qAvg} reward</span></div>`;

    btn.disabled = false;
    btn.textContent = 'Train Both Agents';
    watchS.disabled = false;
    watchQ.disabled = false;
  }, 50);
});

function watchAgent(Q, gridId) {
  const env = new CliffWalkingEnvironment();
  env.reset();
  renderCliffGrid(gridId, env, Q, env.agentPos);
  let steps = 0;

  function step() {
    const action = argmax(Q[env.getState()]);
    const result = env.step(action);
    steps++;
    renderCliffGrid(gridId, env, Q, env.agentPos);
    if (!result.done && steps < 100) setTimeout(step, 120);
  }
  setTimeout(step, 200);
}

document.getElementById('cliff-watch-sarsa').addEventListener('click', () => { if (sarsaQ) watchAgent(sarsaQ, 'cliff-grid-sarsa'); });
document.getElementById('cliff-watch-qlearn').addEventListener('click', () => { if (qlearnQ) watchAgent(qlearnQ, 'cliff-grid-qlearn'); });
