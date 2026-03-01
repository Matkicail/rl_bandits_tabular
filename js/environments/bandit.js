/** Stationary k-armed bandit. True values drawn from N(0,1), rewards N(q*(a), 1). */

import { randn, argmax } from '../core/utils.js';

export class BanditEnvironment {
  constructor(k = 10) {
    this.k = k;
    this.trueValues = null;
    this.reset();
  }

  reset() {
    this.trueValues = new Float64Array(this.k);
    for (let i = 0; i < this.k; i++) this.trueValues[i] = randn();
    return null;
  }

  step(action) {
    return { reward: this.trueValues[action] + randn(), done: false };
  }

  getNumActions() { return this.k; }
  getOptimalAction() { return argmax(this.trueValues); }
  drift() { /* no-op for stationary */ }
}
