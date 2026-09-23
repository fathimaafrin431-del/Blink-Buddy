// particle-system.js
// A lightweight Canvas 2D particle engine. No DOM elements are created for
// particles - everything is drawn directly to a single canvas each frame.

const COLORS = [
  '#ff595e', '#ffca3a', '#8ac926', '#1982c4',
  '#6a4c93', '#ff924c', '#f15bb5', '#00f5d4',
];

export function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function drawStar(ctx, size) {
  const spikes = 5;
  const outer = size;
  const inner = size / 2.5;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

export class Particle {
  constructor(opts) {
    Object.assign(
      this,
      {
        x: 0, y: 0,
        vx: 0, vy: 0,
        ax: 0, ay: 0,
        size: 4,
        life: 1, maxLife: 1,
        opacity: 1,
        rotation: 0, rotationSpeed: 0,
        color: '#fff',
        shape: 'circle', // circle | rect | triangle | star | line
        drag: 0.98,
        gravity: 0,
      },
      opts
    );
  }

  update(dt) {
    this.vx += this.ax * dt;
    this.vy += (this.ay + this.gravity) * dt;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotationSpeed * dt;
    this.life -= dt;
    this.opacity = Math.max(0, this.life / this.maxLife);
    return this.life > 0;
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
    ctx.fillStyle = this.color;

    switch (this.shape) {
      case 'rect':
        ctx.fillRect(-this.size / 2, -this.size / 1.6, this.size, this.size * 1.6);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        drawStar(ctx, this.size);
        break;
      case 'line':
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1, this.size / 3);
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
        break;
      case 'circle':
      default:
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    ctx.restore();
  }
}

export class Ring {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.maxRadius = 650;
    this.speed = 950;
    this.lineWidth = 14;
    this.life = 1;
    this.color = color;
  }

  update(dt) {
    this.radius += this.speed * dt;
    this.speed *= 0.965;
    this.life = 1 - this.radius / this.maxRadius;
    this.lineWidth = Math.max(0, 14 * this.life);
    return this.life > 0;
  }

  draw(ctx) {
    if (this.lineWidth <= 0.2) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0, this.radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class Flash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxLife = 0.25;
    this.life = this.maxLife;
    this.radius = 0;
  }

  update(dt) {
    this.life -= dt;
    const t = 1 - Math.max(0, this.life) / this.maxLife;
    this.radius = t * 280;
    return this.life > 0;
  }

  draw(ctx) {
    const t = Math.max(0, this.life / this.maxLife);
    if (t <= 0) return;
    const r = this.radius + 40;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    grad.addColorStop(0, `rgba(255,255,255,${t})`);
    grad.addColorStop(0.4, `rgba(255,220,120,${t * 0.8})`);
    grad.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Feather {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 180 + Math.random() * 520;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 150;
    this.size = 14 + Math.random() * 18;
    this.color = color || ['#e63946', '#ffd166', '#1d3557', '#ffffff', '#2a9d8f', '#f77f00'][Math.floor(Math.random() * 6)];
    this.life = 3.0 + Math.random() * 2.5;
    this.maxLife = this.life;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 5;
    this.swaySpeed = 3.5 + Math.random() * 3.5;
    this.swayAmount = 35 + Math.random() * 45;
    this.time = Math.random() * 10;
  }

  update(dt) {
    this.time += dt;
    this.vx *= 0.94;
    this.vy += 70 * dt; // gentle floating gravity
    this.vy *= 0.97;
    this.x += (this.vx + Math.sin(this.time * this.swaySpeed) * this.swayAmount) * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.min(1, this.life / 0.6) * Math.min(1, (this.maxLife - this.life) / 0.15);
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Feather vane
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size / 3.4, this.size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark cartoon border
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Feather center spine/quill
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.2, this.size / 9);
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.15);
    ctx.lineTo(0, this.size * 1.15);
    ctx.stroke();

    ctx.restore();
  }
}

export class WoodPlank {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.85;
    const speed = 280 + Math.random() * 700;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.width = 20 + Math.random() * 28;
    this.height = 8 + Math.random() * 12;
    this.color = ['#c48b57', '#9c6632', '#d9a779', '#784b23'][Math.floor(Math.random() * 4)];
    this.life = 2.4 + Math.random() * 1.6;
    this.maxLife = this.life;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 18;
    this.gravity = 750;
  }

  update(dt) {
    this.vy += this.gravity * dt;
    this.vx *= 0.985;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.min(1, this.life / 0.4);
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#2b1704';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Nail/rivet marks
    ctx.fillStyle = '#1a0d02';
    ctx.beginPath();
    ctx.arc(-this.width / 2 + 4, 0, 1.8, 0, Math.PI * 2);
    ctx.arc(this.width / 2 - 4, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class SmokePuff {
  constructor(x, y, isFiery = false) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 380;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 50;
    this.radius = 22 + Math.random() * 26;
    this.maxRadius = this.radius * (2.6 + Math.random() * 1.8);
    this.growthSpeed = 80 + Math.random() * 140;
    this.life = 1.0 + Math.random() * 1.0;
    this.maxLife = this.life;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 2;
    this.isFiery = isFiery;
    this.blobs = [
      { ox: 0, oy: 0, r: 1.0 },
      { ox: -0.4, oy: -0.3, r: 0.75 },
      { ox: 0.45, oy: -0.2, r: 0.7 },
      { ox: -0.25, oy: 0.4, r: 0.65 },
      { ox: 0.35, oy: 0.35, r: 0.68 },
    ];
  }

  update(dt) {
    this.radius = Math.min(this.maxRadius, this.radius + this.growthSpeed * dt);
    this.growthSpeed *= 0.93;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.vy -= 30 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = 1 - this.life / this.maxLife;
    const alpha = Math.max(0, Math.min(1, (1 - progress) * 1.4));
    if (alpha <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = alpha;

    let fillColor;
    if (this.isFiery && progress < 0.28) {
      fillColor = progress < 0.14 ? '#ffea00' : '#ff7b00';
    } else {
      const v = Math.floor(238 - progress * 45);
      fillColor = `rgb(${v},${v},${v + 6})`;
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = 'rgba(35, 20, 15, 0.45)';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    for (const b of this.blobs) {
      const bx = b.ox * this.radius;
      const by = b.oy * this.radius;
      const br = b.r * this.radius;
      ctx.moveTo(bx + br, by);
      ctx.arc(bx, by, br, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export class ComicBurst {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxLife = 0.48;
    this.life = this.maxLife;
    this.points = 22;
    this.rotation = Math.random() * Math.PI;
    this.spikes = [];
    for (let i = 0; i < this.points; i++) {
      this.spikes.push(i % 2 === 0 ? 1.0 : 0.42 + Math.random() * 0.25);
    }
  }

  update(dt) {
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const t = 1 - this.life / this.maxLife;
    const scale = Math.sin(t * Math.PI * 0.85) * 1.8;
    const alpha = Math.max(0, 1 - Math.pow(t, 2.2));
    if (alpha <= 0 || scale <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = alpha;

    const baseRadius = 260 * scale;

    // 1. Outer red/orange layer with thick cartoon outline
    this.drawSpikes(ctx, baseRadius, '#e63946', '#1d0b04', 9);
    // 2. Middle bright yellow layer
    this.drawSpikes(ctx, baseRadius * 0.74, '#ffca3a', null, 0);
    // 3. Core hot white layer
    this.drawSpikes(ctx, baseRadius * 0.42, '#ffffff', null, 0);

    ctx.restore();
  }

  drawSpikes(ctx, r, fill, stroke, lineWidth) {
    ctx.beginPath();
    const angleStep = (Math.PI * 2) / this.points;
    for (let i = 0; i < this.points; i++) {
      const radius = r * this.spikes[i];
      const a = i * angleStep;
      const px = Math.cos(a) * radius;
      const py = Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke && lineWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }
}

export class CartoonBomb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 58;
    this.life = 0.65;
    this.maxLife = 0.65;
    this.pulse = 0;
  }

  update(dt) {
    this.life -= dt;
    this.pulse += dt * 28;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = 1 - this.life / this.maxLife;
    const swell = 1 + Math.pow(progress, 2.2) * 0.7 + Math.sin(this.pulse) * 0.08;
    const r = this.size * swell;

    ctx.save();
    ctx.translate(this.x, this.y);

    const redAmt = Math.min(255, Math.floor(progress * 255));
    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    bodyGrad.addColorStop(0, `rgb(${redAmt + 40}, 55, 55)`);
    bodyGrad.addColorStop(0.7, `rgb(${Math.max(25, redAmt)}, 18, 22)`);
    bodyGrad.addColorStop(1, '#050205');

    ctx.shadowColor = `rgba(255, 60, 0, ${progress * 0.95})`;
    ctx.shadowBlur = 40 * progress;

    // Bomb sphere
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0d0305';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Fuse top collar
    ctx.fillStyle = '#8c5931';
    ctx.fillRect(-r * 0.22, -r - 10 * swell, r * 0.44, 12 * swell);
    ctx.strokeRect(-r * 0.22, -r - 10 * swell, r * 0.44, 12 * swell);

    // Curving fuse rope
    const fuseTipX = r * 0.38;
    const fuseTipY = -r - 30 * swell;
    ctx.beginPath();
    ctx.moveTo(0, -r - 8 * swell);
    ctx.quadraticCurveTo(0, -r - 22 * swell, fuseTipX, fuseTipY);
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Sizzling spark at fuse tip
    const sparkR = 12 + Math.random() * 14;
    const sparkGrad = ctx.createRadialGradient(fuseTipX, fuseTipY, 0, fuseTipX, fuseTipY, sparkR);
    sparkGrad.addColorStop(0, '#ffffff');
    sparkGrad.addColorStop(0.3, '#ffea00');
    sparkGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = sparkGrad;
    ctx.beginPath();
    ctx.arc(fuseTipX, fuseTipY, sparkR, 0, Math.PI * 2);
    ctx.fill();

    // Cartoon Face (Angry Bird style: big angry eyebrows, white eyes, orange beak)
    const eyeR = 12 * swell;
    const eyeSpacing = 16 * swell;

    // White eye sclera
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(-eyeSpacing, -r * 0.1, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(eyeSpacing, -r * 0.1, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bulging pupils looking at viewer
    ctx.fillStyle = '#000000';
    const pupilR = 5.5 * swell;
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 2, -r * 0.1, pupilR, 0, Math.PI * 2);
    ctx.arc(eyeSpacing - 2, -r * 0.1, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Angry Birds thick black V-eyebrows
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - eyeR * 1.3, -r * 0.32);
    ctx.lineTo(0, -r * 0.08);
    ctx.lineTo(eyeSpacing + eyeR * 1.3, -r * 0.32);
    ctx.lineTo(eyeSpacing + eyeR * 1.2, -r * 0.44);
    ctx.lineTo(0, -r * 0.2);
    ctx.lineTo(-eyeSpacing - eyeR * 1.2, -r * 0.44);
    ctx.closePath();
    ctx.fill();

    // Orange beak
    ctx.fillStyle = '#ff9f1c';
    ctx.strokeStyle = '#b35d00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8 * swell, 2 * swell);
    ctx.lineTo(8 * swell, 2 * swell);
    ctx.lineTo(0, 18 * swell);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.flashes = [];
    this.feathers = [];
    this.woodPlanks = [];
    this.smokePuffs = [];
    this.comicBursts = [];
    this.bombs = [];
  }

  spawnCartoonBomb(x, y) {
    this.bombs.push(new CartoonBomb(x, y));
  }

  spawnComicBurst(x, y) {
    this.comicBursts.push(new ComicBurst(x, y));
  }

  spawnFeathers(x, y, count = 55) {
    for (let i = 0; i < count; i++) {
      this.feathers.push(new Feather(x, y));
    }
  }

  spawnWoodDebris(x, y, count = 35) {
    for (let i = 0; i < count; i++) {
      this.woodPlanks.push(new WoodPlank(x, y));
    }
  }

  spawnSmokePuffs(x, y, count = 45) {
    for (let i = 0; i < count; i++) {
      this.smokePuffs.push(new SmokePuff(x, y, i < count * 0.4));
    }
  }

  spawnBurst(x, y, count = 220) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 550;
      this.particles.push(
        new Particle({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 5,
          life: 0.8 + Math.random() * 1.2,
          maxLife: 2,
          color: randomColor(),
          shape: Math.random() < 0.4 ? 'star' : 'circle',
          gravity: 280,
          drag: 0.985,
          rotationSpeed: (Math.random() - 0.5) * 10,
        })
      );
    }
  }

  spawnDebris(x, y, count = 22) {
    this.spawnWoodDebris(x, y, count);
  }

  spawnPopper(x, y, count = 140) {
    const shapes = ['rect', 'circle', 'triangle', 'star'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
      const speed = 320 + Math.random() * 520;
      this.particles.push(
        new Particle({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 5,
          life: 1 + Math.random() * 1.5,
          maxLife: 2.5,
          color: randomColor(),
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          gravity: 320,
          drag: 0.98,
          rotationSpeed: (Math.random() - 0.5) * 12,
        })
      );
    }
  }

  spawnConfettiRain(width, count = 8) {
    const shapes = ['rect', 'circle', 'star'];
    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle({
          x: Math.random() * width,
          y: -20,
          vx: (Math.random() - 0.5) * 90,
          vy: 60 + Math.random() * 90,
          size: 4 + Math.random() * 6,
          life: 3 + Math.random() * 2,
          maxLife: 5,
          color: randomColor(),
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          gravity: 40,
          drag: 0.999,
          rotationSpeed: (Math.random() - 0.5) * 6,
        })
      );
    }
  }

  spawnRing(x, y, color) {
    // Circle rings disabled per user request
  }

  spawnFlash(x, y) {
    this.flashes.push(new Flash(x, y));
  }

  update(dt) {
    this.bombs = this.bombs.filter((b) => b.update(dt));
    this.comicBursts = this.comicBursts.filter((c) => c.update(dt));
    this.smokePuffs = this.smokePuffs.filter((s) => s.update(dt));
    this.woodPlanks = this.woodPlanks.filter((w) => w.update(dt));
    this.feathers = this.feathers.filter((f) => f.update(dt));
    this.particles = this.particles.filter((p) => p.update(dt));
    this.flashes = this.flashes.filter((f) => f.update(dt));
  }

  draw(ctx) {
    // 1. Smoke clouds behind
    this.smokePuffs.forEach((s) => s.draw(ctx));
    // 2. Flashes
    this.flashes.forEach((f) => f.draw(ctx));
    // 3. Giant comic starburst
    this.comicBursts.forEach((c) => c.draw(ctx));
    // 4. Pre-explosion cartoon bomb
    this.bombs.forEach((b) => b.draw(ctx));
    // 5. Wooden debris and planks
    this.woodPlanks.forEach((w) => w.draw(ctx));
    // 6. Flying feathers
    this.feathers.forEach((f) => f.draw(ctx));
    // 7. Confetti and stars
    this.particles.forEach((p) => p.draw(ctx));
  }

  clear() {
    this.particles = [];
    this.rings = [];
    this.flashes = [];
    this.feathers = [];
    this.woodPlanks = [];
    this.smokePuffs = [];
    this.comicBursts = [];
    this.bombs = [];
  }

  get count() {
    return (
      this.particles.length +
      this.rings.length +
      this.flashes.length +
      this.feathers.length +
      this.woodPlanks.length +
      this.smokePuffs.length +
      this.comicBursts.length +
      this.bombs.length
    );
  }
}

