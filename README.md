# Reinforcement Learning — Interactive Demos

Interactive browser-based simulations covering core tabular RL concepts. No frameworks, no build step, no dependencies — just vanilla JS and Canvas.

## Demos

| Demo | What it covers |
|------|---------------|
| **Multi-Armed Bandit** | Exploration vs exploitation — Pure Greedy, ε-Greedy, UCB, and Boltzmann strategies head-to-head |
| **Non-Stationary Bandit** | What happens when the environment drifts — constant step-size vs sample averages |
| **Grid World** | Q-learning on a 9×9 grid with walls — watch an agent learn to navigate from scratch |
| **Cliff Walking** | SARSA vs Q-learning side-by-side — on-policy safety vs off-policy optimality |

## Getting Started

The project uses ES modules, so it needs to be served over HTTP rather than opened as a local file.

**Option 1 — Python (no install needed)**

```bash
python3 -m http.server
```

Then open [http://localhost:8000](http://localhost:8000)

**Option 2 — npx**

```bash
npx serve .
```

Then open the URL shown in your terminal (usually [http://localhost:3000](http://localhost:3000))

That's it. Everything runs client-side.

## Project Structure

```
├── index.html
├── styles.css
└── js/
    ├── main.js                  # Entry point — imports all UI modules
    ├── core/
    │   ├── agent.js             # Agent — pairs a strategy with Q-value bookkeeping
    │   ├── strategies.js        # Greedy, ε-Greedy, UCB, Boltzmann, Decaying ε
    │   └── utils.js             # Shared utilities — randn, argmax, smoothing
    ├── environments/
    │   ├── bandit.js            # Stationary k-armed bandit
    │   ├── nonstationary-bandit.js  # Random walk bandit
    │   ├── gridworld.js         # Grid world with walls
    │   └── cliffwalking.js      # 4×12 cliff walking
    ├── simulation/
    │   └── runners.js           # Experiment runners — bandit sims, Q-learning, SARSA
    ├── rendering/
    │   └── chart.js             # Canvas 2D chart renderer
    └── ui/
        ├── navigation.js        # Scroll spy + RL loop diagram
        ├── bandits.js           # MAB controls and visualisation
        ├── nonstationary.js     # Non-stationary MAB controls
        ├── gridworld.js         # Grid world controls and watch mode
        └── cliffwalking.js      # Cliff walking controls and watch mode
```

## Usage

Each demo has configurable parameters — number of arms, episodes, learning rate, discount factor, exploration rate, etc. Tweak them and hit the run button. The simulations are deliberately fast enough to re-run on the fly so you can experiment.

A few things worth trying:

- **MAB:** Set ε to 0 and watch Pure Greedy get stuck. Compare with UCB.
- **Non-stationary:** Increase drift σ and see which strategies survive. Try switching step-size mode.
- **Grid World:** Increase grid size to 12×12 and see how Q-learning scales. Drop γ to 0.5 and watch the agent become myopic.
- **Cliff Walking:** Set ε to 0.01 and watch SARSA and Q-learning converge. Set it to 0.4 and watch them diverge dramatically.

## Companion Article

This repo accompanies a Medium post walking through the concepts and results in detail:

[placeholder-link]

## Licence

MIT
