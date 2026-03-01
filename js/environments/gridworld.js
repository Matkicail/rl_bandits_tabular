/** Grid World — agent navigates from top-left to goal at bottom-right, avoiding walls. */

import { shuffle } from '../core/utils.js';

export class GridWorldEnvironment {
  constructor(size = 7) {
    this.size = size;
    this.actions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    this.actionNames = ['↑', '→', '↓', '←'];
    this.walls = new Set();
    this.start = [0, 0];
    this.goal = [size - 1, size - 1];
    this.agentPos = [0, 0];
    this._generateWalls();
  }

  _generateWalls() {
    this.walls.clear();
    const s = this.size;
    const candidates = [];
    for (let r = 1; r < s - 1; r++)
      for (let c = 1; c < s - 1; c++)
        candidates.push(`${r},${c}`);
    shuffle(candidates);
    const n = Math.floor(candidates.length * 0.15);
    for (let i = 0; i < n; i++) this.walls.add(candidates[i]);
    while (!this._pathExists()) {
      if (this.walls.size === 0) break;
      const arr = Array.from(this.walls);
      this.walls.delete(arr[arr.length - 1]);
    }
  }

  _pathExists() {
    const visited = new Set();
    const queue = [`${this.start[0]},${this.start[1]}`];
    visited.add(queue[0]);
    const goalKey = `${this.goal[0]},${this.goal[1]}`;
    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr === goalKey) return true;
      const [r, c] = curr.split(',').map(Number);
      for (const [dr, dc] of this.actions) {
        const nr = r + dr, nc = c + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size
            && !visited.has(key) && !this.walls.has(key)) {
          visited.add(key);
          queue.push(key);
        }
      }
    }
    return false;
  }

  reset() {
    this.agentPos = [...this.start];
    return this.getState();
  }

  getState() { return this.agentPos[0] * this.size + this.agentPos[1]; }
  getNumActions() { return 4; }
  getNumStates() { return this.size * this.size; }

  step(action) {
    const [dr, dc] = this.actions[action];
    const nr = this.agentPos[0] + dr, nc = this.agentPos[1] + dc;
    if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size
        && !this.walls.has(`${nr},${nc}`)) {
      this.agentPos = [nr, nc];
    }
    const done = this.agentPos[0] === this.goal[0] && this.agentPos[1] === this.goal[1];
    return { reward: done ? 10 : -0.1, done, state: this.getState() };
  }

  isWall(r, c) { return this.walls.has(`${r},${c}`); }
}
