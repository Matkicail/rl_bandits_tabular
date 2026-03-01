/**
 * Main entry point — imports all UI controllers.
 * Each module self-initialises by binding event listeners on import.
 *
 * NOTE: This must be loaded as <script type="module" src="js/main.js">
 * and served via a local HTTP server (not file://).
 *
 * Quick start:
 *   npx serve .          (Node.js)
 *   python3 -m http.server   (Python)
 */

import './ui/navigation.js';
import './ui/bandits.js';
import './ui/nonstationary.js';
import './ui/gridworld.js';
import './ui/cliffwalking.js';
