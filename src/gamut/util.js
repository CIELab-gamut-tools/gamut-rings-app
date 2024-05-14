import {from, mult, diag, mapMany, div, grid, reshape, zeros, mcat, rows} from "t-matrix";

export function* splitLines(iterable){
  if (iterable == null) return;
  if (typeof iterable === 'string' || typeof iterable[Symbol.iterator] !== 'function') iterable = [iterable];
  for (let str of iterable){
    if (typeof str === 'string'){
      for (let s of str.match(/[^\r\n]+/g)){
        yield s.split('#')[0].trim();
      }
    }
  }
}

export function camcat_cc(XYZ1, XYZn, XYZa){
  const M = from([ [0.8951,  0.2664, -0.1614],
    [-0.7502,  1.7135,  0.0367],
    [0.0389, -0.0685,  1.0296]]).t;
  const RGBn = mult(XYZn,M);
  const RGBa = mult(XYZa,M);
  const A=diag(mapMany(RGBa,RGBn,(a,n)=>a/n).t);
  const MAM=div(mult(M,A),M);

  return mult(XYZ1,MAM);
}

export function makeTesselation(gsv, onlyRGB=false){
  //ensure it is a regular array
  gsv = [...gsv];
  const N = gsv.length;
  let [J,K]=grid(gsv,gsv);
  J=reshape(J,N*N,1);
  K=reshape(K,N*N,1);
  const Lower = zeros(N*N,1).set(gsv[0]);
  const Upper = zeros(N*N,1).set(gsv[N-1]);
  //on the bottom surface the order must be rotations of Lower,J,K
  //on the top surface the order must be rotations of Upper,K,J
  const RGB_ref = mcat([
    [Lower, J, K],
    [K, Lower, J],
    [J, K, Lower],
    [Upper, K, J],
    [J, Upper, K],
    [K, J, Upper]
  ]);
  if (onlyRGB) return RGB_ref;
  const TRI_ref=zeros(12*(N-1)*(N-1), 3);
  let idx=0;
  for(let s=0; s<6; s++)
    for(let q=0; q<N-1; q++)
      for(let p=0; p<N-1; p++){
        let m = N*N*s + N*q + p;
        TRI_ref.set([idx,idx+1],':',[
          [m, m+N, m+1],
          [m+N, m+N+1, m+1]
        ]);
        idx+=2;
      }
  return [TRI_ref, RGB_ref];
}

export function mapRows(reference, target, values){
  const gm = new Map(values.map((v,i)=>[v,i])),
    N = values.length,
    row2key = ([a,b,c])=>gm.get(a)+N*(gm.get(b)+N*gm.get(c)),
    lookup = new Map(target.toJSON().map((a,i)=>[row2key(a),i]));
  return reference.toJSON().map(r=>lookup.get(row2key(r)));
}

export function XYZ2Lab(XYZ, XYZn){
  const Rth=216/24389, Rs=24389/3132, Rc=16/116, Rp=1/3,
    ratio = mapMany(XYZ, XYZn, (a,b)=>a/b),
    fX = ratio.map(r=>r<=Rth?r*Rs+Rc:Math.pow(r,Rp));
  return from([...rows(fX)].map(([fx,fy,fz])=>[116*fy-16,500*(fx-fy),200*(fy-fz)]))
}

export function find(m){
  return [...m].map((v,i)=>[v,i]).filter(a=>a[0]).map(a=>a[1]);
}

export function xy2XYZ(xy,Y){
  const XYZn = from([...rows(xy)].map(([x,y])=>[x/y,1,(1-x-y)/y]));
  return Y ? product(XYZn,Y) : XYZn;
}