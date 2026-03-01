/** Cliff Walking — 4×12 grid, cliff along bottom edge, classic SARSA vs Q-learning benchmark. */

export class CliffWalkingEnvironment {
  constructor() {
    this.rows = 4;
    this.cols = 12;
    this.actions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    this.actionNames = ['↑', '→', '↓', '←'];
    this.start = [3, 0];
    this.goal = [3, 11];
    this.agentPos = [3, 0];
  }

  reset() {
    this.agentPos = [...this.start];
    return this.getState();
  }

  getState() { return this.agentPos[0] * this.cols + this.agentPos[1]; }
  getNumActions() { return 4; }
  getNumStates() { return this.rows * this.cols; }

  isCliff(r, c) { return r === 3 && c >= 1 && c <= 10; }

  step(action) {
    const [dr, dc] = this.actions[action];
    const nr = this.agentPos[0] + dr, nc = this.agentPos[1] + dc;
    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
      this.agentPos = [nr, nc];
    }
    if (this.isCliff(this.agentPos[0], this.agentPos[1])) {
      this.agentPos = [...this.start];
      return { reward: -100, done: false, state: this.getState() };
    }
    const done = this.agentPos[0] === this.goal[0] && this.agentPos[1] === this.goal[1];
    return { reward: done ? 0 : -1, done, state: this.getState() };
  }
}
