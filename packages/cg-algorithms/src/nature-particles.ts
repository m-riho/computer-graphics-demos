import { seededRandom } from './natural-modeling.ts'
import { Perlin2D } from './nature-noise.ts'
export type Particle = { id: number; x: number; y: number; vx: number; vy: number; age: number; lifetime: number; size: number; color: string }
export type ParticleParameters = { emissionRate: number; initialVelocity: number; spread: number; gravity: number; wind: number; windMode: 'constant' | 'noise'; lifetime: number; size: number; preset: 'Fire' | 'Sparks' | 'Fountain' | 'Snow' }
export type ParticleState = { particles: Particle[]; time: number; carry: number; rng: number; nextId: number; generated: number; removed: number }
export const particlePresets: Record<ParticleParameters['preset'], ParticleParameters> = {
  Fire: { preset: 'Fire', emissionRate: 100, initialVelocity: 75, spread: 24, gravity: -15, wind: 0, windMode: 'noise', lifetime: 2, size: 5 },
  Sparks: { preset: 'Sparks', emissionRate: 60, initialVelocity: 150, spread: 65, gravity: 90, wind: 0, windMode: 'constant', lifetime: 2.3, size: 2 },
  Fountain: { preset: 'Fountain', emissionRate: 80, initialVelocity: 160, spread: 18, gravity: 110, wind: 0, windMode: 'constant', lifetime: 3, size: 3 },
  Snow: { preset: 'Snow', emissionRate: 45, initialVelocity: 25, spread: 30, gravity: 5, wind: 12, windMode: 'noise', lifetime: 6, size: 4 },
}
const bound = (x: number, lo: number, hi: number, fallback: number) => Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : fallback
const windNoise = new Perlin2D(0)
export function createParticleState(seed = 0): ParticleState { return { particles: [], time: 0, carry: 0, rng: seed >>> 0, nextId: 0, generated: 0, removed: 0 } }
/** Euler更新。描画処理を含まない。画面はx右向き、y下向き、領域600×280。 */
export function advanceParticles(state: ParticleState, p: ParticleParameters, deltaTime: number): ParticleState {
  const dt = bound(deltaTime, 0, .1, 0), random = seededRandom(state.rng)
  let rng = state.rng, nextId = state.nextId
  const draw = () => { const value = random(); rng = Math.floor(value * 4294967296); return value }
  const gravity = bound(p.gravity, -100, 200, 90), wind = bound(p.wind, -100, 100, 0), lifetime = bound(p.lifetime, .2, 8, 2)
  const carry = state.carry + bound(p.emissionRate, 0, 200, 100) * dt
  const particles = state.particles.map(particle => {
    const acceleration = p.windMode === 'noise' ? wind * windNoise.sample(particle.y * .025, state.time * .7) * 2 : wind
    const vx = particle.vx + acceleration * dt, vy = particle.vy + gravity * dt
    return { ...particle, vx, vy, x: particle.x + vx * dt, y: particle.y + vy * dt, age: particle.age + dt }
  }).filter(particle => particle.age < particle.lifetime)
  const generated = Math.min(Math.floor(carry), Math.max(0, 1200 - particles.length))
  for (let i = 0; i < generated; i++) {
    const angle = (draw() * 2 - 1) * bound(p.spread, 0, 90, 25) * Math.PI / 180
    const speed = bound(p.initialVelocity, 0, 220, 100) * (.8 + .4 * draw()), snow = p.preset === 'Snow'
    particles.push({ id: nextId++, x: snow ? draw() * 600 : 300 + (draw() - .5) * 12, y: snow ? 5 : 265,
      vx: Math.sin(angle) * speed, vy: (snow ? 1 : -1) * Math.cos(angle) * speed,
      age: 0, lifetime, size: bound(p.size, 1, 12, 4), color: p.preset === 'Fire' ? '#fb923c' : p.preset === 'Sparks' ? '#fde047' : p.preset === 'Snow' ? '#f1f5f9' : '#38bdf8' })
  }
  return { particles, time: state.time + dt, carry: carry - Math.floor(carry), rng, nextId, generated, removed: state.particles.length + generated - particles.length }
}
