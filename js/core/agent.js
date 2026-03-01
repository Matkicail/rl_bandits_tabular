/** Agent — pairs a Strategy with Q-value bookkeeping. */

export class Agent {
  constructor(numActions, strategy, stepSizeMode = 'sample-average', alpha = 0.1) {
    this.numActions = numActions;
    this.strategy = strategy;
    this.stepSizeMode = stepSizeMode;
    this.alpha = alpha;
    this.reset();
  }

  reset() {
    this.qValues = new Float64Array(this.numActions);
    this.counts = new Uint32Array(this.numActions);
    this.totalSteps = 0;
  }

  selectAction() {
    return this.strategy.selectAction(this.qValues, this.counts, this.totalSteps);
  }

  update(action, reward) {
    this.counts[action]++;
    this.totalSteps++;
    const step = this.stepSizeMode === 'constant' ? this.alpha : 1.0 / this.counts[action];
    this.qValues[action] += step * (reward - this.qValues[action]);
  }
}
