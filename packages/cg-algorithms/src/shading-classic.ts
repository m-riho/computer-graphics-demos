/** 第7回：古典的な局所照明。戻り値は表示変換前の線形光量。 */
export type LightingDirection = [number, number, number]
const radians = (degrees: number): number => degrees * Math.PI / 180
const positiveCosine = (degrees: number): number => degrees >= 90 ? 0 : Math.max(0, Math.cos(radians(degrees)))

/** +Yを法線とする単位方向。方位角0°は+Z、90°は+X。 */
export function directionFromAngles(zenith: number, azimuth = 0): LightingDirection {
  const theta = radians(zenith), phi = radians(azimuth)
  return [Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi)]
}

/** Lambertの余弦則。裏面から来る光は0にする。 */
export function lambert(incidence: number, kd = 1, intensity = 1): number {
  return kd * intensity * positiveCosine(incidence)
}

/** 点光源の照度。intensityは放射強度、distanceは光源から表面点までの距離。 */
export function pointIlluminance(distance: number, incidence: number, intensity = 1): number {
  if (!Number.isFinite(distance) || distance <= 0) throw new RangeError('距離は正の有限値にします')
  return intensity * positiveCosine(incidence) / (distance * distance)
}

/** Oren–Nayar簡略モデル。正面入射時のLambert放射輝度で規格化した相対値。
 * sigmaは傾斜角の標準偏差。UIの度からラジアンへ変換して二乗する。
 * 微小面間の相互反射は含まない（講義付録と同じ近似）。
 */
export function orenNayar(incidence: number, viewing: number, azimuthDifference: number, sigma: number, kd = 1, intensity = 1): number {
  if (incidence >= 90 || viewing >= 90) return 0
  const sigmaSquared = radians(sigma) ** 2
  const A = 1 - .5 * sigmaSquared / (sigmaSquared + .33)
  const B = .45 * sigmaSquared / (sigmaSquared + .09)
  const a = radians(Math.max(incidence, viewing))
  const b = radians(Math.min(incidence, viewing))
  const azimuth = Math.max(0, Math.cos(radians(azimuthDifference)))
  return lambert(incidence, kd, intensity) * (A + B * azimuth * Math.sin(a) * Math.tan(b))
}

/** PhongとBlinn–Phongの経験的鏡面項。物理的に正規化したBRDFではない。
 * N=(0,1,0)、R=2(N·L)N−L、H=normalize(L+V)。
 * L+V=0や裏面を明示的に除外して、NaNや裏面のハイライトを防ぐ。
 */
export function specularTerms(lightAngle: number, viewAngle: number, viewAzimuth = 180, phongExponent = 20, blinnExponent = 80, ks = 1, intensity = 1): {
  phong: number; blinn: number; reflection: LightingDirection; halfway: LightingDirection; rDotV: number; nDotH: number
} {
  const L = directionFromAngles(lightAngle)
  const V = directionFromAngles(viewAngle, viewAzimuth)
  const reflection: LightingDirection = [-L[0], L[1], -L[2]]
  const sum: LightingDirection = [L[0] + V[0], L[1] + V[1], L[2] + V[2]]
  const length = Math.hypot(...sum)
  const halfway: LightingDirection = length < 1e-10 ? [0,0,0] : [sum[0]/length, sum[1]/length, sum[2]/length]
  const rDotV = Math.max(0, Math.min(1, reflection[0]*V[0] + reflection[1]*V[1] + reflection[2]*V[2]))
  const nDotH = Math.max(0, Math.min(1, halfway[1]))
  const lit = lightAngle < 90 && viewAngle < 90
  return {
    phong: lit ? ks * intensity * rDotV ** phongExponent : 0,
    blinn: lit && length > 1e-10 ? ks * intensity * nDotH ** blinnExponent : 0,
    reflection, halfway, rDotV, nDotH,
  }
}

export interface LightingComponents {
  ambient: number; diffuse: number; specular: number
  ambientOn: boolean; diffuseOn: boolean; specularOn: boolean
  /** 遮蔽率A。0=遮蔽なし、1=完全遮蔽。 */
  occlusion: number
}
/** AOは環境光だけを減らす。直接光のDiffuse/Specularには掛けない。 */
export function combineLighting(input: LightingComponents): { ambient: number; diffuse: number; specular: number; total: number } {
  const ambient = input.ambientOn ? input.ambient * (1 - Math.max(0,Math.min(1,input.occlusion))) : 0
  const diffuse = input.diffuseOn ? input.diffuse : 0
  const specular = input.specularOn ? input.specular : 0
  return { ambient, diffuse, specular, total: ambient + diffuse + specular }
}

/** コードページの短い実験。描画用コンポーネントと同じ計算を呼び出す。 */
export function runClassicExample(topic: string): unknown {
  switch (topic) {
    case 'visibility-shading': return [0,60,120].map(angle => ({ lightAngle:angle, visibleSurface:'同じ視点・同じ形状', diffuse:lambert(angle) }))
    case 'lambert': return [0,60,90,120].map(angle => ({ angle, diffuse:lambert(angle) }))
    case 'point-light': return [1,2,3].map(distance => ({ distance, illuminance:pointIlluminance(distance,0) }))
    case 'oren-nayar': return [0,90,180].map(azimuth => ({ azimuth, lambert:lambert(60), orenNayar:orenNayar(60,60,azimuth,45) }))
    case 'phong-blinn': return { sameExponent:specularTerms(35,55,180,20,20), matchedWidth:specularTerms(35,55,180,20,80) }
    case 'shading-comparison': return { triangleCounts:[20,80,320,1280], flat:'面で照明計算', gouraud:'頂点で計算した色を補間', phong:'補間・正規化した法線で画素ごとに計算' }
    case 'ambient-components': return [0,.5,1].map(occlusion => combineLighting({ ambient:.2,diffuse:.5,specular:.8,ambientOn:true,diffuseOn:true,specularOn:true,occlusion }))
    default: throw new RangeError(`未知の古典照明デモ: ${topic}`)
  }
}
