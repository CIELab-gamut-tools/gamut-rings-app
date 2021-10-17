import {readCgats} from "./cgats";
import {from, min} from 't-matrix';
import {camcat_cc, makeTesselation, mapRows, XYZ2Lab, find} from "./util";

export function fromCgats(file, opts) {
  const g = readCgats(file);
  const RGBp = ['RGB_R', 'RGB_G', 'RGB_B'], XYZp = ['XYZ_X', 'XYZ_Y', 'XYZ_Z'];
  for (let prop of [...RGBp, ...XYZp]) {
    if (!g.format.hasOwnProperty(prop)) {
      throw new Error('GAMUT:: Cgats file must have the following data - ' + PROPS.join(', '));
    }
  }
  g.RGB = g.data.get(':', RGBp.map(p => g.format[p]));
  g.XYZ = g.data.get(':', XYZp.map(p => g.format[p]));
  Object.assign(g, opts);
  return fromXYZ(g);
}

export function fromXYZ(g) {
  g.gsv = [...new Set(g.RGB)].sort((a, b) => a - b);
  const [TRI_ref, RGB_ref] = makeTesselation(g.gsv);
  const map = mapRows(RGB_ref, g.RGB, g.gsv);
  if (map.indexOf(undefined) >= 0) throw new Error('GAMUT:: Missing RGB data');
  g.TRI = TRI_ref.map(i => map[i]);

  return fromTRIXYZ(g);
}

export function fromTRIXYZ(g) {
  g.RGBmax = g.gsv[g.gsv.length - 1];
  g.XYZn = g.XYZ.get([...min(g.RGB, null, 2)].indexOf(g.RGBmax), ':');
  // D50 is the default chromatic adaptation
  if (!g.caXYZn) g.caXYZn = from([[0.9642957, 1, 0.8251046]])
  g.caXYZ = camcat_cc(g.XYZ, g.XYZn, g.caXYZn);
  g.LAB = XYZ2Lab(g.caXYZ, g.caXYZn);

  return fromTRILAB(g)
}

export function fromTRILAB(g) {
  if (!g.Lsteps) g.Lsteps = 100;
  if (!g.hsteps) g.hsteps = 360;

  const {TRI, LAB, Lsteps, hsteps} = g;
  const tri = new Uint32Array(TRI);
  const lab = new Float64Array(LAB);
  const L = tri.length/3;
  const maxL = new Float64Array(L), minL = new Float64Array(L);
  for (let i=0,j=0;j<L; j++){
    const l1 = lab[tri[i++]*3], l2 = lab[tri[i++]*3], l3 = lab[tri[i++]*3];
    if (l1>l2){
      if (l2>l3){
        minL[j]=l3;
        maxL[j]=l1;
      } else {
        minL[j]=l2;
        maxL[j]=l1>l3?l1:l3;
      }
    } else {
      if (l2>l3){
        minL[j]=l1>l3?l3:l1;
        maxL[j]=l2;
      } else {
        minL[j]=l1;
        maxL[j]=l3;
      }
    }
    maxL[j] = Math.max(l1, l2, l3);
    minL[j] = Math.min(l1, l2, l3);
  }

  const deltaHue = 2 * Math.PI / hsteps;

  //quick way of building a 2D array.
  const cylmap = new Array(Lsteps);

  for (let p = 0; p < Lsteps; p++) {
    const Lmid = (p + 0.5) * 100 / Lsteps;
    const IX = [];
    for (let j=0;j<L;j++)
      if (minL[j] <= Lmid && Lmid < maxL[j]) IX.push(j);
    const N = IX.length,
      e2e1 = new Float64Array(N*2),
      e2o = new Float64Array(N*2),
      oe1 = new Float64Array(N*2),
      e2oe1 = new Float64Array(N);
    for (let k=0, i=0;k<N;k++, i+=2){
      const j=IX[k]*3, t0=tri[j]*3, t1=tri[j+1]*3, t2=tri[j+2]*3;
      const v0l=lab[t0], v0a=lab[t0+1], v0b=lab[t0+2];
      const v1l=lab[t1], v1a=lab[t1+1], v1b=lab[t1+2];
      const v2l=lab[t2], v2a=lab[t2+1], v2b=lab[t2+2];
      const e1l=v1l-v0l, e1a=v1a-v0a, e1b=v1b-v0b;
      const e2l=v2l-v0l, e2a=v2a-v0a, e2b=v2b-v0b;
      const ol = Lmid-v0l, oa=-v0a, ob=-v0b;
      e2e1[i]=e2b*e1l-e2l*e1b;
      e2e1[i+1]=e1a*e2l-e2a*e1l;
      e2o[i]=e2b*ol-e2l*ob;
      e2o[i+1]=oa*e2l-e2a*ol;
      oe1[i]=ob*e1l-ol*e1b;
      oe1[i+1]=e1a*ol-oa*e1l;
      e2oe1[k]=e2a*oe1[i]+e2b*oe1[i+1]+e2l*(oa*e1b-e1a*ob);
    }
    cylmap[p]=inner(
      e2e1,
      e2o,
      oe1,
      e2oe1,
      hsteps,
      deltaHue
    );
  }
  g.cylmap = cylmap;
  return g;
}

function inner(e2e1, e2o, oe1, e2oe1, hsteps, deltaHue) {
  const L = e2oe1.length;
  const rtn = new Array(hsteps);
  for (let q = 0; q < hsteps; q++) {
    const dat = [];
    const Hmid = (q + 0.5) * deltaHue,
      ds = Math.sin(Hmid),
      dc = Math.cos(Hmid);
    let idet, u, v, t;
    for (let l = 0, i = 0; l < L; l++, i += 2) {
      idet = 1 / (ds * e2e1[i] + dc * e2e1[i + 1]);
      if ((t = idet * e2oe1[l]) > 0 &&
        (u = idet * (ds * e2o[i] + dc * e2o[i + 1])) >= 0 &&
        (v = idet * (ds * oe1[i] + dc * oe1[i + 1])) >= 0 &&
        u + v <= 1) dat.push(new Float64Array([Math.sign(idet), t]));
    }
    rtn[q] = dat;
  }
  return rtn;
}

export function gamutVolume(g) {
  let
    dH = 2 * Math.PI / g.hsteps,
    dL = 100 / g.Lsteps,
    tot = 0;
  for (let i = 0; i < g.Lsteps; i++)
    for (let j = 0; j < g.hsteps; j++) {
      const m = g.cylmap[i][j];
      for (let k = 0; k < m.length; k++)
        tot += m[k][0] * m[k][1] * m[k][1];
    }
  return tot * dL * dH / 2;
}