import {rings,makeSynthetic} from '../gamut';
const gamuts={};
onmessage = function({data:{action, args, id}}){
  let gamut, definition;
  switch({action}){
    case "makeSynthetic":
      gamuts[args[0]] = makeSynthetic(args[1]);
      this.postMessage({id, rtn:true});
      break;
    case "rings":
      const [a,b,c,vol] = rings(gamuts[args[0]], args[1]);
      this.postMessage({id, })
      break;
    case "deleteGamut":
      break;
  }
}