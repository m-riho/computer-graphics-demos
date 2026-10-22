import { bevelCube } from '../../packages/cg-algorithms/src/bevel'

export function runExample() {
  // 幅0は鋭い立方体。外側の大きさは各軸[-1, 1]。
  const sharp = bevelCube(0, 1)

  // 内側の立方体に半径widthの丸みを付けた境界を標本化。
  // 1分割は平面の面取り、高分割は円柱・球面を細かく近似する。
  const width = 0.3
  const chamfer = bevelCube(width, 1)
  const rounded = bevelCube(width, 4)

  // 法線の向きが少しずつ変わり、照明で明るい帯が見える。
  // CAD/DCCのBevel / Chamfer / Filletという名称には差がある。
  return {
    sharpFaces: sharp.faces.length,
    chamferFaces: chamfer.faces.length,
    roundedFaces: rounded.faces.length,
  }
}
