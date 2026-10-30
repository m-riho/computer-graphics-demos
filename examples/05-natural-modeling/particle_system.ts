/** Generate → Update → Render → Remove。ここでは描画用データまでを計算。 */
import { advanceParticles, createParticleState, particleAppearance, particlePresets } from '../../packages/cg-algorithms/src/nature-particles.ts'

export function runExample() {
  let state = createParticleState(0)
  const parameters = { ...particlePresets.Fountain, emissionRate: 30 }
  const deltaTime = 1 / 30
  // 純粋関数なので同じseedと更新回数から同じ粒子状態を再現できる。
  for (let frame = 0; frame < 60; frame++) {
    state = advanceParticles(state, parameters, deltaTime)
  }
  const activeAtTwoSeconds = state.particles.length
  const firstParticle = state.particles[0]
  // 新しい生成を止めると、既存の粒子は寿命で順次消える。
  for (let frame = 0; frame < 120; frame++) {
    state = advanceParticles(state, { ...parameters, emissionRate: 0 }, deltaTime)
  }
  return { activeAtTwoSeconds, firstParticle, activeAfterExpiry: state.particles.length }
}

/** Smoke：浮力・風で上昇させ、年齢に応じて拡大・フェードする。 */
export function runSmokeExample() {
  let state = createParticleState(0)
  for (let frame = 0; frame < 120; frame++) {
    state = advanceParticles(state, particlePresets.Smoke, 1 / 30)
  }
  return state.particles.map(particle => ({
    ...particle,
    ...particleAppearance(particle, 'Smoke'),
  }))
}
