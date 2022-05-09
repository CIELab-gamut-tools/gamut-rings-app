export function chords(evt,STRETCH){
  const {clientX, clientY, target:{clientWidth, clientHeight}} = evt;
  const {left,top} = evt.target.getBoundingClientRect();
  const x=(clientX-left)/clientWidth/STRETCH, y=(1-(clientY-top)/clientHeight)/STRETCH;
  return [x,y];
}