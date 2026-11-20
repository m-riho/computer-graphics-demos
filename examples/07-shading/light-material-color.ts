import { diffuseRGB, displayRGB } from '../../packages/cg-algorithms/src/shading-light-color.ts'
/** p.26と同じ赤い材質。線形RGBで光源と材質の各成分を掛ける。 */
export function runExample() {
  const material:[number,number,number]=[.8,.04,.02]
  return [
    {name:'白色光',light:[1,1,1] as [number,number,number]},
    {name:'青色光',light:[0,0,1] as [number,number,number]},
  ].map(({name,light})=>{
    const linear=diffuseRGB(material,light)
    return {name,material,light,linear,displaySRGB:displayRGB(linear)}
  })
}
