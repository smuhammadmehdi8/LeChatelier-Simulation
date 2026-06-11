import { Application, Graphics, Container } from "pixi.js";


const CHAMBER_LEFT_X = 20; //35 for debugging, ALSO DONT FORGET TO CHANGE THE pistonY + 20 to + 35
const CHAMBER_RIGHT_X = 380; //365
const CHAMBER_BOTTOM_Y = 480; //460

const MIN_VOLUME = 0.5;
const MAX_VOLUME = 2.0;

const HIGHEST_PISTON_Y = 50;
const LOWEST_PISTON_Y = 320;

const PARTICLES_PER_CONCENTRATION_UNIT = 8;
const PARTICLE_RADIUS = 6;

type MovingParticle = Graphics & {
  species: string;
  vx: number;
  vy: number;
  radius: number;
};

const calculatePistonY = (volume: number): number => {
  const volumePercentage =
    (volume - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME);

  return (
    LOWEST_PISTON_Y -
    volumePercentage * (LOWEST_PISTON_Y - HIGHEST_PISTON_Y)
  );
};

const getParticleBounds = (volume: number) => {
  const pistonY = calculatePistonY(volume);

  return {
    left: CHAMBER_LEFT_X,
    right: CHAMBER_RIGHT_X,
    top: pistonY + 20,
    bottom: CHAMBER_BOTTOM_Y,
  };
};

export const initSimulation = async (container : HTMLDivElement) => {
    const app = new Application();
    await app.init({
        width: 400,
        height: 500,
        backgroundColor: 0xffffff, 
        antialias: true,
    });

    const particleLayer = new Container();
    app.stage.addChild(particleLayer);

    const containerWalls = new Graphics();
    containerWalls.rect(0, 50, 20, 450).fill({color: 0xBDC3C7}); //;eft wall
    containerWalls.rect(380, 50, 20, 450).fill({color: 0xBDC3C7}); //right wall 
    containerWalls.rect(0, 480, 400, 20).fill({color: 0xBDC3C7}); //bottom wall
    app.stage.addChild(containerWalls);

    const pistonLid = new Graphics();

    pistonLid.rect(20, 0, 360, 20).fill({color: 0x2C3E50});
    pistonLid.rect(190, -100, 20, 100).fill({color: 0x7F8C8D}); 
    pistonLid.rect(150, -120, 100, 20).fill({color: 0x2C3E50}); 
    pistonLid.y = 50;
    app.stage.addChild(pistonLid);

    container.appendChild(app.canvas);
    
    return { app, pistonLid, particleLayer };
};

//function calculates piston position
export const updateSimulation = (volume: number, piston: Graphics) => {
  piston.y = calculatePistonY(volume);
};

export const getSpeciesCssColor = (species: string): string => {
  const speciesColors: Record<string, string> = {
    "N₂": "#2563eb",
    "H₂": "#14b8a6",
    "NH₃": "#7c3aed",
    "N₂O₄": "#f97316",
    "NO₂": "#dc2626",
    "I₂": "#374151",
    "HI": "#0891b2",
    "He": "#94a3b8",
    "Ar": "#64748b",
  };

  return speciesColors[species] ?? "#111827";
};

const getSpeciesColor = (species: string): number => {
  const cssColor = getSpeciesCssColor(species);

  return Number(`0x${cssColor.replace("#", "")}`);
};

export const updateParticleVisuals = (
  particleLayer: Container,
  concentrations: Record<string, number>,
  volume: number
) => {
  const targetParticleCounts: Record<string, number> = {};

  Object.entries(concentrations).forEach(([species, concentration]) => {
    targetParticleCounts[species] = Math.round(
      concentration * PARTICLES_PER_CONCENTRATION_UNIT
    );
  });

  const allParticles = particleLayer.children as MovingParticle[];

  allParticles.forEach((particle) => {
    if (!(particle.species in targetParticleCounts)) {
      particleLayer.removeChild(particle);
      particle.destroy();
    }
  });

  Object.entries(targetParticleCounts).forEach(
    ([species, targetCount], speciesIndex) => {
      const currentParticles = (particleLayer.children as MovingParticle[]).filter(
        (particle) => particle.species === species
      );

      if (currentParticles.length > targetCount) {
        const particlesToRemove = currentParticles.slice(targetCount);

        particlesToRemove.forEach((particle) => {
          particleLayer.removeChild(particle);
          particle.destroy();
        });

        return;
      }

      const particlesToAdd = targetCount - currentParticles.length;

      for (let i = 0; i < particlesToAdd; i++) {
        const particle = createMovingParticle(
          species,
          speciesIndex,
          particleLayer,
          volume
        );

        particleLayer.addChild(particle);
      }
    }
  );
};

//if anyone opens this, please notice this it legit took me some time to do ts
const createMovingParticle = (species: string, speciesIndex: number, particleLayer: Container,volume: number): MovingParticle => {
  const bounds = getParticleBounds(volume);
  const existingParticles = particleLayer.children as MovingParticle[];

  const particle = new Graphics() as MovingParticle;

  const position = findOpenParticlePosition(existingParticles, bounds);

  const speed = 0.6 + Math.random() * 0.6;
  const angle = Math.random() * Math.PI * 2;

    const particleColor = getSpeciesColor(species);

    particle.circle(2, 2, PARTICLE_RADIUS).fill({
    color: 0x000000,
    alpha: 0.22,
    });

    particle.circle(0, 0, PARTICLE_RADIUS).fill({
    color: particleColor,
    });

    particle.circle(-2, -2, PARTICLE_RADIUS * 0.35).fill({
    color: 0xffffff,
    alpha: 0.55,
    });

  particle.x = position.x;
  particle.y = position.y;

  particle.species = species;
  particle.radius = PARTICLE_RADIUS;
  particle.vx = Math.cos(angle) * speed;
  particle.vy = Math.sin(angle) * speed;

  if (speciesIndex % 2 === 1) {
    particle.vx *= -1;
  }

  return particle;
};

const findOpenParticlePosition = (existingParticles: MovingParticle[], bounds: {left: number; right: number; top: number; bottom: number;} ): { x: number; y: number } => {
  const maxAttempts = 40;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = bounds.left + PARTICLE_RADIUS + Math.random() * (bounds.right - bounds.left - PARTICLE_RADIUS * 2);

    const y = bounds.top + PARTICLE_RADIUS + Math.random() * (bounds.bottom - bounds.top - PARTICLE_RADIUS * 2);

    const overlapsExistingParticle = existingParticles.some((particle) => {
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance < PARTICLE_RADIUS * 2.3;
    });

    if (!overlapsExistingParticle) {
      return { x, y };
    }
  }

  return {
    x:
      bounds.left +
      PARTICLE_RADIUS +
      Math.random() *
        (bounds.right - bounds.left - PARTICLE_RADIUS * 2),
    y:
      bounds.top +
      PARTICLE_RADIUS +
      Math.random() *
        (bounds.bottom - bounds.top - PARTICLE_RADIUS * 2),
  };
};

const resolveParticleCollisions = (particles: MovingParticle[]) => {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const particleA = particles[i];
      const particleB = particles[j];

      const dx = particleB.x - particleA.x;
      const dy = particleB.y - particleA.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const minimumDistance = particleA.radius + particleB.radius;

      if (distance === 0 || distance >= minimumDistance) {
        continue;
      }

      const normalX = dx / distance;
      const normalY = dy / distance;

      const overlap = minimumDistance - distance;

      particleA.x -= normalX * overlap * 0.5;
      particleA.y -= normalY * overlap * 0.5;

      particleB.x += normalX * overlap * 0.5;
      particleB.y += normalY * overlap * 0.5;

      const relativeVelocityX = particleB.vx - particleA.vx;
      const relativeVelocityY = particleB.vy - particleA.vy;

      const velocityAlongNormal =
        relativeVelocityX * normalX + relativeVelocityY * normalY;

      if (velocityAlongNormal > 0) {
        continue;
      }

      const bounceStrength = 1.0;

      const impulse = -velocityAlongNormal * bounceStrength;

      particleA.vx -= impulse * normalX;
      particleA.vy -= impulse * normalY;

      particleB.vx += impulse * normalX;
      particleB.vy += impulse * normalY;
    }
  }
};

const MIN_TEMPERATURE_K = 273.15;
const MAX_TEMPERATURE_K = 600;

const MIN_PARTICLE_SPEED = 0.7;
const MAX_PARTICLE_SPEED = 2.5;

const calculateTargetParticleSpeed = (temperatureK: number): number => {
  const clampedTemperature = Math.max(
    MIN_TEMPERATURE_K,
    Math.min(MAX_TEMPERATURE_K, temperatureK)
  );

  const temperaturePosition =
    (clampedTemperature - MIN_TEMPERATURE_K) /
    (MAX_TEMPERATURE_K - MIN_TEMPERATURE_K);

  return (
    MIN_PARTICLE_SPEED +
    temperaturePosition * (MAX_PARTICLE_SPEED - MIN_PARTICLE_SPEED)
  );
};

const normalizeParticleSpeed = (particle: MovingParticle, targetSpeed: number) => {
  const currentSpeed = Math.sqrt(
    particle.vx * particle.vx + particle.vy * particle.vy
  );

  if (currentSpeed < 0.01) {
    const angle = Math.random() * Math.PI * 2;

    particle.vx = Math.cos(angle) * targetSpeed;
    particle.vy = Math.sin(angle) * targetSpeed;

    return;
  }

  const scaleFactor = targetSpeed / currentSpeed;

  particle.vx *= scaleFactor;
  particle.vy *= scaleFactor;
};

const normalizeAllParticleSpeeds = (particles: MovingParticle[],targetSpeed: number) => {
  particles.forEach((particle) => {
    normalizeParticleSpeed(particle, targetSpeed);
  });
};

export const updateParticleMotion = (particleLayer: Container, volume: number, temperatureK: number) => {
  const bounds = getParticleBounds(volume);
  const particles = particleLayer.children as MovingParticle[];

  const targetSpeed = calculateTargetParticleSpeed(temperatureK);

  normalizeAllParticleSpeeds(particles, targetSpeed);

  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x - particle.radius <= bounds.left) {
      particle.x = bounds.left + particle.radius;
      particle.vx = Math.abs(particle.vx);
    }

    if (particle.x + particle.radius >= bounds.right) {
      particle.x = bounds.right - particle.radius;
      particle.vx = -Math.abs(particle.vx);
    }

    if (particle.y - particle.radius <= bounds.top) {
      particle.y = bounds.top + particle.radius;
      particle.vy = Math.abs(particle.vy);
    }

    if (particle.y + particle.radius >= bounds.bottom) {
      particle.y = bounds.bottom - particle.radius;
      particle.vy = -Math.abs(particle.vy);
    }
  });

  resolveParticleCollisions(particles);

  normalizeAllParticleSpeeds(particles, targetSpeed);
};

