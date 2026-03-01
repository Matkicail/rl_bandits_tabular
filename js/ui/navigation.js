/** Navigation, scroll spy, and RL agent-environment loop diagram. */

// RL Loop Diagram
const canvas = document.getElementById('rl-loop-diagram');
if (canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  const cx = W / 2, cy = H / 2;

  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, W, H);

  // Agent box
  const ax = cx - 160, ay = cy - 30;
  ctx.fillStyle = 'rgba(57,210,192,0.1)';
  ctx.strokeStyle = '#39d2c0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(ax, ay, 120, 60);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e6edf3';
  ctx.font = '600 16px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Agent', ax + 60, ay + 35);

  // Environment box
  const ex = cx + 40, ey = cy - 30;
  ctx.fillStyle = 'rgba(88,166,255,0.1)';
  ctx.strokeStyle = '#58a6ff';
  ctx.beginPath();
  ctx.rect(ex, ey, 140, 60);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e6edf3';
  ctx.fillText('Environment', ex + 70, ey + 35);

  // Action arrow (top arc, agent → environment)
  ctx.strokeStyle = '#3fb950'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax + 120, ay + 15);
  ctx.quadraticCurveTo(cx, ay - 50, ex, ey + 15);
  ctx.stroke();
  ctx.fillStyle = '#3fb950';
  ctx.beginPath();
  ctx.moveTo(ex, ey + 15); ctx.lineTo(ex - 10, ey + 8); ctx.lineTo(ex - 6, ey + 18);
  ctx.fill();
  ctx.font = '500 13px "DM Sans", sans-serif';
  ctx.fillText('Action (aₜ)', cx, ay - 30);

  // Reward + State arrow (bottom arc, environment → agent)
  ctx.strokeStyle = '#d29922'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex, ey + 45);
  ctx.quadraticCurveTo(cx, ey + 110, ax + 120, ay + 45);
  ctx.stroke();
  ctx.fillStyle = '#d29922';
  ctx.beginPath();
  ctx.moveTo(ax + 120, ay + 45); ctx.lineTo(ax + 130, ay + 38); ctx.lineTo(ax + 126, ay + 50);
  ctx.fill();
  ctx.fillText('Reward (rₜ)', cx - 40, ey + 95);
  ctx.fillStyle = '#bc8cff';
  ctx.fillText('State (sₜ₊₁)', cx + 40, ey + 80);
}

// Scroll spy
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (scrollY >= section.offsetTop - 100) current = section.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}, { passive: true });
