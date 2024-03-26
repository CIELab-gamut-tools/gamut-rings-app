import {from, div, product, vcat, zeros, sum, mult, rows} from 't-matrix';
import {makeTesselation, xy2XYZ} from "./util";
import {fromXYZ} from "./gamut";
import {WHITES, REFS} from './refs'

const defaults = {
  "default":{
    ...REFS.srgb,
    driveMapping:v=>v,
    gamma:2.4,
    black:null,
    blackRatio:0,
    steps:10,
  },
  ...REFS
}

export function makeSynthetic(name, options){
  if (typeof name === "string"){
    options = Object.assign({},defaults.default,defaults[name.toLowerCase()],options);
  } else {
    options = Object.assign({},defaults.default,name);
  }
  let {white, RGBxy, gamma, black, blackRatio, steps, colorantXYZ, driveMapping} = options;
  let gammaFn = typeof gamma === 'function' ? gamma : v=>Math.pow(v,gamma);

  let dfs = from([driveMapping([1,1,1])])
  console.log('dfs',dfs); window.dfs=dfs;
  if (colorantXYZ){
    colorantXYZ = from(colorantXYZ);
  }else{
    while (typeof white === 'string') white = WHITES[white] || defaults[white].white;
    white = from([white]);
    let whiteXYZ = xy2XYZ(white);
    let RGBnXYZ = xy2XYZ(from(RGBxy));
    let Lrgb = div(whiteXYZ,RGBnXYZ);
    colorantXYZ = product(RGBnXYZ, Lrgb.t);
    if (dfs.size[1]>3){
      colorantXYZ = vcat(colorantXYZ, whiteXYZ)
      console.log('col',colorantXYZ);
    }
  }
  let XYZn = mult(dfs,colorantXYZ);
  let blackXYZ=zeros(1,3);
  if (blackRatio){
    if (!black) black = white;
    else while (typeof black === 'string') black = WHITES[black] || defaults[black].white;
    let Lblack = XYZn.get(0,1)/(1/blackRatio-1);
    blackXYZ=xy2XYZ(black,Lblack);
  }

  let RGB = makeTesselation(from([0,':',steps]),true);
  // there isn't a unique function yet in t-matrix, so here is a DIY
  const s1 = steps+1;
  RGB = from([...new Map([...rows(RGB)].map(([r,g,b])=>[r+s1*(g+s1*b),[r,g,b]])).values()]);
  //now rescale RGB to be 0-1
  RGB = RGB.map(v=>v/steps);
  let RGBsig = RGB.map(gammaFn);
  let RGBdrive = from([...rows(RGBsig)].map(driveMapping));
  let XYZ = sum(mult(RGBdrive,colorantXYZ),blackXYZ);
  return fromXYZ({RGB, XYZ});
}