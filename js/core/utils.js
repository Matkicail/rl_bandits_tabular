/** Shared pure utility functions — no state, no side effects. */

export function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function argmax(arr) {
  let best = -Infinity;
  const ties = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > best) { best = arr[i]; ties.length = 0; ties.push(i); }
    else if (arr[i] === best) ties.push(i);
  }
  return ties[Math.floor(Math.random() * ties.length)];
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function smoothData(data, windowSize) {
  const result = new Float64Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const lo = Math.max(0, i - windowSize + 1);
    let sum = 0;
    for (let j = lo; j <= i; j++) sum += data[j];
    result[i] = sum / (i - lo + 1);
  }
  return result;
}

export function getCSSVar(varStr) {
  const prop = varStr.replace('var(', '').replace(')', '');
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || varStr;
}

export function armColors(n) {
  const palette = [
    '#f85149','#58a6ff','#3fb950','#d29922','#bc8cff',
    '#39d2c0','#f778ba','#db61a2','#7ee787','#79c0ff',
    '#ffa657','#d2a8ff','#ff7b72','#a5d6ff','#56d364',
    '#e3b341','#8b949e','#ff9bce','#89dceb','#fab387'
  ];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}
