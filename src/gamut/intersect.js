export function intersect(g1, g2){
    const {Lsteps, hsteps} = g1;
    if (Lsteps !== g2.Lsteps || hsteps !== g2.hsteps){
        throw new Error('imtersection: h and L* steps must match');
    }

    const g= {Lsteps, hsteps, title:'Intersection'};
    // cylmap is an array[Lsteps][hSteps][inters]=[d,t]

    g.cylmap = new Array(Lsteps);
    for (let l=0; l<Lsteps; l++){
        const a = new Array(hsteps);
        for (let h=0; h<hsteps; h++){
            const c=[];
            const i1 = fix(g1.cylmap[l][h]);
            const i2 = fix(g2.cylmap[l][h]);
            let s1 = i1.length;
            let s2 = i2.length;
            // if one of the sets is empty then the solution is trivial
            if (s1>0 && s2>0){
                let in1=0, in2=0;
                s1--; s2--;
                while (s1>=0 || s2>=0){
                    if (s2<0 || s1>=0 && i1[s1][1]>i2[s2][1]){
                        let [d,t]=i1[s1--];
                        if ((!in1 && d>0) || (in1 && d<0)){
                            if (in2) c.unshift([d,t]);
                            in1+=d;
                        }
                    } else {
                        let [d,t]=i2[s2--];
                        if ((!in2 && d>0) || (in2 && d<0)){
                            if (in1) c.unshift([d,t]);
                            in2+=d;
                        }
                    }
                }
            }
            a[h]=c;
        }
        g.cylmap[l] = a;
    }
    return g;
}

function fix(a){
    let ed=1;
    let i=a.length;
    while(i--){
        if (a[i][0]!==ed){
            a.splice(i,1)
        } else {
            ed=-ed;
        }
    }
    return a;
}