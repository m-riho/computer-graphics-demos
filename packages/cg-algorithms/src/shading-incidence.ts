/** Fixed-width parallel beam intersecting the floor y=0 (2D cross section). */
export function beamFootprint(angleDegrees: number, beamWidth = 1) {
  if (!Number.isFinite(angleDegrees) || angleDegrees < 0 || angleDegrees >= 90)
    throw new RangeError('入射角は0°以上90°未満にしてください。')
  if (!Number.isFinite(beamWidth) || beamWidth <= 0)
    throw new RangeError('光束の幅は正の有限値にしてください。')
  const theta = angleDegrees * Math.PI / 180
  const sin = Math.sin(theta), cos = Math.cos(theta)
  // L points from the floor toward the light; actual light travels along -L.
  const light: [number, number] = [sin, cos]
  const incoming: [number, number] = [-sin, -cos]
  const floorWidth = beamWidth / cos
  // Place a cross-section marker wholly above the floor, perpendicular to L.
  const distance = Math.max(1.6, beamWidth / 2 * Math.tan(theta) + .35)
  const crossSection: [[number, number], [number, number]] = [
    [distance * sin - beamWidth / 2 * cos, distance * cos + beamWidth / 2 * sin],
    [distance * sin + beamWidth / 2 * cos, distance * cos - beamWidth / 2 * sin],
  ]
  return { light, incoming, crossSection, floorWidth, left: -floorWidth / 2,
    right: floorWidth / 2, relativeIlluminance: cos }
}
