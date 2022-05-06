import {from, div, product, vcat, zeros, sum, mult, rows} from 't-matrix';
import {makeTesselation, xy2XYZ} from "./util";
import {fromXYZ} from "./gamut";

const WHITES = {
  'd50': [.3457, .3585],
  'd55': [.3324, .3474],
  'd60': [.32168, .33767],
  'd65': [.3127, .3290],
  'd75': [.2990, .3149],
}
const REFS = {
  "default":{
    driveMapping:v=>v,
    gamma:2.4,
    black:null,
    blackRatio:0,
    steps:10,
    white:'d65',
    RGBxy:[[.64,.33],[.3,.6],[.15,.06]]
  },
  srgb: {
    white: 'd65',
    RGBxy: [[.64, .33], [.3, .6], [.15, .06]],
    gamma: v => v > 0.04045 ? Math.pow((200 * v + 11) / 211, 2.4) : 25 * v / 323
  },
  'bt.2020':{
    white: 'd65',
    RGBxy: [[.708,.292],[.17,.797],[.131,.046]],
    gamma: 2.4
  },
  'dci-p3':{
    white: [.314, .351],
    RGBxy:[[.68,.32],[.265,.69],[.15,.06]],
    gamma: 2.4
  },
  'd65-p3':{
    white: 'd65',
    RGBxy:[[.68,.32],[.265,.69],[.15,.06]],
    gamma: 2.4
  },
  'd50-p3':{
    white: 'd50',
    RGBxy:[[.68,.32],[.265,.69],[.15,.06]],
    gamma: 2.4
  },
}

export function makeSynthetic(name, options){
  if (typeof name === "string"){
    options = Object.assign({},REFS.default,REFS[name.toLowerCase()],options);
  } else {
    options = Object.assign({},REFS.default,name);
  }
  let {white, RGBxy, gamma, black, blackRatio, steps, colorantXYZ, driveMapping} = options;
  let gammaFn = typeof gamma === 'function' ? gamma : v=>Math.pow(v,gamma);

  let dfs = from([driveMapping([1,1,1])])
  if (colorantXYZ){
    colorantXYZ = from(colorantXYZ);
  }else{
    while (typeof white === 'string') white = WHITES[white] || REFS[white].white;
    white = from([white]);
    let whiteXYZ = xy2XYZ(white);
    let RGBnXYZ = xy2XYZ(from(RGBxy));
    let Lrgb = div(whiteXYZ,RGBnXYZ);
    colorantXYZ = product(RGBnXYZ, Lrgb.t);
    if (dfs.length>3){
      colorantXYZ = vcat([colorantXYZ, whiteXYZ])
    }
  }
  let XYZn = mult(dfs,colorantXYZ);
  let blackXYZ=zeros(1,3);
  if (blackRatio){
    if (!black) black = white;
    else while (typeof black === 'string') black = WHITES[black] || REFS[black].white;
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