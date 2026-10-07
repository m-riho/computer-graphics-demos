/** デジタル画像の再標本化。縮小先の画素中心に近い元画素を取る。 */
export function sampleNearest(source: Uint8ClampedArray, width: number, height: number,
  targetWidth: number, targetHeight: number): Uint8ClampedArray {
  const sizes = [width, height, targetWidth, targetHeight]
  if (sizes.some(size => !Number.isInteger(size) || size < 1 || size > 2048)
    || source.length !== width * height * 4) {
    throw new RangeError('画像寸法は1〜2048の整数、RGBA配列長は幅×高さ×4です')
  }
  const result = new Uint8ClampedArray(targetWidth * targetHeight * 4)
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = Math.floor((x + 0.5) * width / targetWidth)
      const sourceY = Math.floor((y + 0.5) * height / targetHeight)
      const from = (sourceY * width + sourceX) * 4
      const to = (y * targetWidth + x) * 4
      result.set(source.subarray(from, from + 4), to)
    }
  }
  return result // 前置フィルターは行わないため、縮小時にエイリアシングが起き得る。
}
