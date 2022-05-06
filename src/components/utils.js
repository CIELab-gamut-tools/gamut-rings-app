export function chords(evt){
  const {clientX, clientY, target:{clientWidth, clientHeight}} = evt;
  const {left,top} = evt.target.getBoundingClientRect();
  const x=(clientX-left)/clientWidth, y=1-(clientY-top)/clientHeight;
  return [x,y];
}