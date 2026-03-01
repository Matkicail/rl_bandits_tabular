/** Grid World UI — Q-learning training, grid rendering, watch mode. */

import { argmax, smoothData } from '../core/utils.js';
import { GridWorldEnvironment } from '../environments/gridworld.js';
import { ChartRenderer } from '../rendering/chart.js';
import { runQLearning } from '../simulation/runners.js';

let gwEnv = null;
let gwQ = null;

function renderGrid(containerId, env, Q, agentPos) {
  const container = document.getElementById(containerId);
  const size = env.size;
  container.style.gridTemplateColumns = `repeat(${size}, 52px)`;
  container.innerHTML = '';

  let maxV = -Infinity, minV = Infinity;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (env.isWall(r, c)) continue;
      const v = Q ? Math.max(...Q[r * size + c]) : 0;
      if (v > maxV) maxV = v;
      if (v < minV) minV = v;
    }
  }

  const arrows = ['↑', '→', '↓', '←'];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';

      if (env.isWall(r, c)) {
        cell.classList.add('wall');
      } else if (r === env.goal[0] && c === env.goal[1]) {
        cell.classList.add('goal');
        cell.textContent = '★';
      } else if (Q) {
        const state = r * size + c;
        const bestAction = argmax(Q[state]);
        const v = Math.max(...Q[state]);
        const norm = maxV > minV ? (v - minV) / (maxV - minV) : 0;
        cell.style.background = `rgba(57,210,192,${0.05 + norm * 0.25})`;
        cell.innerHTML = `<span class="arrow">${arrows[bestAction]}</span>`;
      }

      if (agentPos && r === agentPos[0] && c === agentPos[1]) cell.classList.add('agent');
      container.appendChild(cell);
    }
  }
}

document.getElementById('gw-run').addEventListener('click', function () {
  const btn = this;
  const watchBtn = document.getElementById('gw-watch');
  btn.disabled = true;
  btn.textContent = 'Training...';
  watchBtn.disabled = true;

  setTimeout(() => {
    const size = +document.getElementById('gw-size').value;
    const episodes = +document.getElementById('gw-episodes').value;
    const alpha = +document.getElementById('gw-alpha').value;
    const gamma = +document.getElementById('gw-gamma').value;
    const epsilon = +document.getElementById('gw-epsilon').value;

    gwEnv = new GridWorldEnvironment(size);
    renderGrid('gw-grid', gwEnv, null, gwEnv.start);

    const stepsData = [];
    const counterEl = document.getElementById('gw-counter');
    const chart = new ChartRenderer(document.getElementById('gw-chart'));

    // Persistent Q-table — shared across all batches
    const numStates = gwEnv.getNumStates();
    const numActions = gwEnv.getNumActions();
    const Q = Array.from({ length: numStates }, () => new Float64Array(numActions));

    let ep = 0;
    const batchSize = Math.max(1, Math.floor(episodes / 50));

    function trainBatch() {
      runQLearning(gwEnv, Math.min(batchSize, episodes - ep), alpha, gamma, epsilon,
        (_, steps, __, batchQ) => {
          stepsData.push(steps);
          gwQ = batchQ;
        },
        Q
      );
      ep += Math.min(batchSize, episodes - ep);
      counterEl.textContent = `Episode ${ep} / ${episodes}`;

      const smoothed = smoothData(Float64Array.from(stepsData), 100);
      chart.drawLineChart([{ data: smoothed, color: 'var(--strategy-epsilon)', label: 'Steps (100-ep avg)' }],
        { xlabel: 'Episode', ylabel: 'Steps to Goal (smoothed)' });
      renderGrid('gw-grid', gwEnv, gwQ, null);

      if (ep < episodes) {
        requestAnimationFrame(trainBatch);
      } else {
        const last100 = stepsData.slice(-100);
        const avg = (last100.reduce((a, b) => a + b, 0) / last100.length).toFixed(1);
        document.getElementById('gw-stats').innerHTML =
          `<div>Last 100 episodes avg: <span class="stat-value">${avg} steps</span></div>` +
          `<div>Best episode: <span class="stat-value">${Math.min(...stepsData)} steps</span></div>` +
          `<div>Total episodes: <span class="stat-value">${episodes}</span></div>`;
        btn.disabled = false;
        btn.textContent = 'Train Agent';
        watchBtn.disabled = false;
      }
    }
    trainBatch();
  }, 50);
});

document.getElementById('gw-watch').addEventListener('click', function () {
  if (!gwEnv || !gwQ) return;
  const btn = this;
  btn.disabled = true;

  gwEnv.reset();
  renderGrid('gw-grid', gwEnv, gwQ, gwEnv.agentPos);

  let steps = 0;
  const maxSteps = gwEnv.size * gwEnv.size * 4;

  function stepAgent() {
    const action = argmax(gwQ[gwEnv.getState()]);
    const result = gwEnv.step(action);
    steps++;
    renderGrid('gw-grid', gwEnv, gwQ, gwEnv.agentPos);
    document.getElementById('gw-counter').textContent = `Watching: step ${steps}`;

    if (!result.done && steps < maxSteps) setTimeout(stepAgent, 150);
    else {
      document.getElementById('gw-counter').textContent = result.done
        ? `Goal reached in ${steps} steps!` : `Timed out after ${steps} steps`;
      btn.disabled = false;
    }
  }
  setTimeout(stepAgent, 300);
});
