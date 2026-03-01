/** Exploration strategies — each implements selectAction(qValues, counts, totalSteps). */

import { argmax } from './utils.js';

export class GreedyStrategy {
  selectAction(qValues) { return argmax(qValues); }
}

export class EpsilonGreedyStrategy {
  constructor(epsilon = 0.1) { this.epsilon = epsilon; }
  selectAction(qValues) {
    if (Math.random() < this.epsilon) return Math.floor(Math.random() * qValues.length);
    return argmax(qValues);
  }
}

export class DecayingEpsilonGreedyStrategy {
  constructor(start = 1.0, decay = 0.995, min = 0.01) {
    this.epsilonStart = start;
    this.decayRate = decay;
    this.epsilonMin = min;
  }
  selectAction(qValues, counts, totalSteps) {
    const eps = Math.max(this.epsilonMin, this.epsilonStart * Math.pow(this.decayRate, totalSteps));
    if (Math.random() < eps) return Math.floor(Math.random() * qValues.length);
    return argmax(qValues);
  }
}

export class UCBStrategy {
  constructor(c = 2) { this.c = c; }
  selectAction(qValues, counts, totalSteps) {
    const n = qValues.length;
    for (let i = 0; i < n; i++) if (counts[i] === 0) return i;
    let bestAction = 0, bestValue = -Infinity;
    for (let i = 0; i < n; i++) {
      const val = qValues[i] + this.c * Math.sqrt(Math.log(totalSteps) / counts[i]);
      if (val > bestValue) { bestValue = val; bestAction = i; }
    }
    return bestAction;
  }
}

export class BoltzmannStrategy {
  constructor(tau = 0.5) { this.tau = tau; }
  selectAction(qValues) {
    const n = qValues.length;
    let maxQ = -Infinity;
    for (let i = 0; i < n; i++) if (qValues[i] > maxQ) maxQ = qValues[i];
    const exps = new Float64Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) { exps[i] = Math.exp((qValues[i] - maxQ) / this.tau); sum += exps[i]; }
    let r = Math.random() * sum;
    for (let i = 0; i < n; i++) { r -= exps[i]; if (r <= 0) return i; }
    return n - 1;
  }
}
