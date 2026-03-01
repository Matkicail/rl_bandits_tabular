/** Simulation runners — stateless functions that execute experiments. */

import { argmax } from '../core/utils.js';
import { Agent } from '../core/agent.js';

/**
 * Runs multi-armed bandit experiment, averaging over multiple runs.
 * @param {Function} envFactory - creates a fresh environment per run
 * @param {Object[]} agentConfigs - [{ strategy, stepSizeMode, alpha }]
 * @param {number} steps - steps per run
 * @param {number} runs - number of independent runs to average
 * @param {Object} opts - { trackArmEvolution: bool }
 * @returns {{ avgRewards, optimalCounts, armHistories }}
 */
export function runBanditSimulation(envFactory, agentConfigs, steps, runs, opts = {}) {
  const n = agentConfigs.length;
  const avgRewards = agentConfigs.map(() => new Float64Array(steps));
  const optimalCounts = agentConfigs.map(() => new Float64Array(steps));
  let armHistories = null;

  for (let run = 0; run < runs; run++) {
    const env = envFactory();
    const agents = agentConfigs.map(cfg =>
      new Agent(env.getNumActions(), cfg.strategy, cfg.stepSizeMode || 'sample-average', cfg.alpha || 0.1)
    );

    // Track arm evolution on first run only
    if (opts.trackArmEvolution && run === 0) {
      armHistories = Array.from({ length: env.k }, () => new Float64Array(steps));
    }

    for (let t = 0; t < steps; t++) {
      const optimal = argmax(env.trueValues);

      if (opts.trackArmEvolution && run === 0) {
        for (let a = 0; a < env.k; a++) armHistories[a][t] = env.trueValues[a];
      }

      for (let s = 0; s < n; s++) {
        const action = agents[s].selectAction();
        const { reward } = env.step(action);
        agents[s].update(action, reward);
        avgRewards[s][t] += reward;
        if (action === optimal) optimalCounts[s][t] += 1;
      }
      env.drift();
    }
  }

  for (let s = 0; s < n; s++) {
    for (let t = 0; t < steps; t++) {
      avgRewards[s][t] /= runs;
      optimalCounts[s][t] /= runs;
    }
  }

  return { avgRewards, optimalCounts, armHistories };
}

/**
 * Runs Q-learning (off-policy) on any environment with getNumStates/getNumActions.
 */
export function runQLearning(env, episodes, alpha, gamma, epsilon, onEpisodeEnd, initialQ) {
  const numStates = env.getNumStates();
  const numActions = env.getNumActions();
  const Q = initialQ || Array.from({ length: numStates }, () => new Float64Array(numActions));
  const stepsPerEpisode = [];
  const rewardPerEpisode = [];
  const maxSteps = (env.size || 12) * (env.size || 12) * 10;

  for (let ep = 0; ep < episodes; ep++) {
    let state = env.reset();
    let totalReward = 0;
    let steps = 0;

    while (steps < maxSteps) {
      const action = Math.random() < epsilon
        ? Math.floor(Math.random() * numActions)
        : argmax(Q[state]);

      const result = env.step(action);
      const bestNext = Math.max(...Q[result.state]);
      Q[state][action] += alpha * (result.reward + gamma * bestNext - Q[state][action]);

      totalReward += result.reward;
      state = result.state;
      steps++;
      if (result.done) break;
    }

    stepsPerEpisode.push(steps);
    rewardPerEpisode.push(totalReward);
    if (onEpisodeEnd) onEpisodeEnd(ep, steps, totalReward, Q);
  }

  return { Q, stepsPerEpisode, rewardPerEpisode };
}

/**
 * Runs SARSA (on-policy) on any environment.
 */
export function runSarsa(env, episodes, alpha, gamma, epsilon, onEpisodeEnd) {
  const numStates = env.getNumStates();
  const numActions = env.getNumActions();
  const Q = Array.from({ length: numStates }, () => new Float64Array(numActions));
  const rewardPerEpisode = [];
  const maxSteps = 500;

  const choose = (state) =>
    Math.random() < epsilon
      ? Math.floor(Math.random() * numActions)
      : argmax(Q[state]);

  for (let ep = 0; ep < episodes; ep++) {
    let state = env.reset();
    let action = choose(state);
    let totalReward = 0;
    let steps = 0;

    while (steps < maxSteps) {
      const result = env.step(action);
      const nextAction = choose(result.state);

      Q[state][action] += alpha * (result.reward + gamma * Q[result.state][nextAction] - Q[state][action]);

      totalReward += result.reward;
      state = result.state;
      action = nextAction;
      steps++;
      if (result.done) break;
    }

    rewardPerEpisode.push(totalReward);
    if (onEpisodeEnd) onEpisodeEnd(ep, steps, totalReward, Q);
  }

  return { Q, rewardPerEpisode };
}
