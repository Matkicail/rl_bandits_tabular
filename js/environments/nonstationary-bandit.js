/** Non-stationary bandit — true values perform a random walk each step. */

import { randn } from '../core/utils.js';
import { BanditEnvironment } from './bandit.js';

export class NonStationaryBanditEnvironment extends BanditEnvironment {
  constructor(k = 10, driftSigma = 0.01) {
    super(k);
    this.driftSigma = driftSigma;
  }

  drift() {
    for (let i = 0; i < this.k; i++) {
      this.trueValues[i] += randn() * this.driftSigma;
    }
  }
}
