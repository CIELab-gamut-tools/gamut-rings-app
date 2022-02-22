import {from, gridInterp1, cumsum, sum, vcat, zeros, product, min, max, reshape} from "t-matrix";

let t=0;
function timer(name){
  const n = performance.now();
  //if(name)console.log(name, n-t);
  t=n;
}

export function rings(g,Ls){
  timer();
  const dH = 2*Math.PI/g.hsteps;
  const dL = 100/g.Lsteps;
  const c = dL*dH/2;
  const volMap = zeros(100,360);
  const DATA = Object.getOwnPropertySymbols(volMap)[0];
  const volMapData = volMap[DATA];
  for(let i=0,l=0;l<100;l++)
    for(let a=0;a<360;a++,i++){
      const d=g.cylmap[l][a], N=d.length;
      let v=0;
      for(let n=0;n<N;n++) {
        const dn=d[n],dn1=dn[1];
        v+=dn[0]*dn1*dn1*c;
      }
      volMapData[i]=v;
    }
  timer('volmap');
  const cssChromAll = vcat(zeros(1,g.hsteps),cumsum(volMap).map(v=>Math.sqrt(2*v/dH)));
  timer('vcat');
  const cssC = gridInterp1(cssChromAll, Ls);
  const ang = from([[dH/2,'::',dH,2*Math.PI]]);
  const cssA = product(ang.map(Math.sin),cssC);
  const cssB = product(ang.map(Math.cos),cssC);
  return [cssA[DATA], cssB[DATA], cssC[DATA], sum(volMap)];
}

 function ringsSVG(g,{
  Ls=[10,'::',10,100],
  xLims,
  xStep,
  yLims,
  yStep,
  precis=1,
}={}){
  const [a,b] = rings(g,Ls);
  if (!xLims) xLims=getLims(a);
  if (!xStep) xStep=getStep(xLims);
  if (!yLims) yLims=getLims(b);
  if (!yStep) yStep=getStep(yLims);
  const svg=[];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${xLims[1]-xLims[0]} ${yLims[1]-yLims[0]}">`);
  // The axes

  // The rings
  for(let r=9;r>=0;r--){
    const x=[...a.get(r,':')].map(x=>(x-xLims[0]).toFixed(precis));
    const y=[...b.get(r,':')].map(y=>(yLims[1]-y).toFixed(precis));
    const col = (20*r+75).toString(16)
    let s=`<path style="fill:#${col+col+col};stroke:#000000;stroke-opacity:1;stroke-width:2;stroke-miterlimit:4;stroke-dasharray:none" d="M${x[0]},${y[0]}`;
    for(let n=1;n<360;n++){
      s+=`L${x[n]},${y[n]}`;
    }
    s+='Z"/>'
    svg.push(s);
  }
  // Close the svg
  svg.push('</svg>')
  return svg.join('\n');
}

function getLims(m, sym=true){
  let mn = min(m), mx = max(m);
  return !sym ? [1.05*mn-0.05*mx,1.05*mx-0.05*mn]:
    mx>-mn ? [-1.1*mx, 1.1*mx]:
    [1.1*mn, -1.1*mn];
}

function getStep(lims){
  const rng = lims[1]-lims[0],
    l = Math.log(rng)/Math.log(10)-1,
    r = l%1,
    a = r < 0.15 ? 1 :
      r < 0.5 ? 2 :
        r < 0.85 ? 5 : 10;
  console.log(rng,l,r,a);
  return Math.pow(10,l-r)*a;
}