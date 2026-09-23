// fireworks.js
// Rockets that launch upward with a trail, reach a randomized target height,
// then explode into a particle burst using the shared ParticleSystem.

import { Particle, randomColor } from './particle-system.js';

export class Firework {
  constructor(x, targetY, groundY) {
    this.x = x;
    this.y = groundY;
    this.targetY = targetY;
    this.vy = -Math.max(300, (groundY - targetY) * 1.6);
    this.exploded = false;
    this.done = false;
    this.color = randomColor();
    this.trail = [];
  }

  update(dt, particleSystem) {
    if (!this.exploded) {
      this.y += this.vy * dt;
      this.vy += 260 * dt; // gravity gradually slows the ascent

      this.trail.push({ x: this.x, y: this.y, life: 1 });
      this.trail.forEach((t) => (t.life -= dt * 3));
      this.trail = this.trail.filter((t) => t.life > 0);

      if (this.y <= this.targetY || this.vy >= 0) {
        this.exploded = true;
        this.explode(particleSystem);
      }
    } else {
      this.trail.forEach((t) => (t.life -= dt * 3));
      this.trail = this.trail.filter((t) => t.life > 0);
      if (this.trail.length === 0) this.done = true;
    }
    return !this.done;
  }

  explode(particleSystem) {
    particleSystem.spawnFlash(this.x, this.y);

    const count = 60 + Math.floor(Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = 120 + Math.random() * 260;
      particleSystem.particles.push(
        new Particle({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          life: 0.8 + Math.random() * 0.8,
          maxLife: 1.6,
          color: this.color,
          shape: 'circle',
          gravity: 140,
          drag: 0.98,
        })
      );
    }
  }

  drawTrail(ctx) {
    if (this.exploded || this.trail.length < 2) return;
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.trail.forEach((t, i) => {
      ctx.globalAlpha = Math.max(0, t.life);
      if (i === 0) ctx.moveTo(t.x, t.y);
      else ctx.lineTo(t.x, t.y);
    });
    ctx.stroke();
    ctx.restore();
  }
}

export class FireworksManager {
  constructor(particleSystem, width, height) {
    this.ps = particleSystem;
    this.width = width;
    this.height = height;
    this.fireworks = [];
  }

  launch(x, targetY) {
    const launchX = x ?? this.width * 0.2 + Math.random() * this.width * 0.6;
    const ty = targetY ?? this.height * 0.15 + Math.random() * this.height * 0.25;
    this.fireworks.push(new Firework(launchX, ty, this.height));
  }

  update(dt) {
    this.fireworks = this.fireworks.filter((f) => f.update(dt, this.ps));
  }

  draw(ctx) {
    this.fireworks.forEach((f) => f.drawTrail(ctx));
  }

  clear() {
    this.fireworks = [];
  }
}
