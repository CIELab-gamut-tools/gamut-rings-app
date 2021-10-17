import {splitLines} from "./util";
import {zeros} from 't-matrix';

export function readCgats(iterable){
  const rtn={};
  const iter = splitLines(iterable)[Symbol.iterator]();
  let line, count, format, data, row;
  const getNext = () => (line=iter.next()).done;
  while(!getNext()){
    const [type, ...args] = line.value.split(/\s+/);
    if (/^CGATS/.test(type)){
      rtn.version = type;
      continue;
    }
    switch(type){
      case 'BEGIN_DATA_FORMAT':
        format=[];
        while(!getNext()) {
          if (line.value === 'END_DATA_FORMAT') break;
          format.push(...line.value.toUpperCase().split(/\s+/));
        }
        break;
      case 'NUMBER_OF_SETS':
        count = Number.parseInt(args[0]);
        break;
      case 'BEGIN_DATA':
        if (!count || !format) throw new Error('readCGATS: NUMBER_OF_SETS and *_DATA_FORMAT required before BEGIN_DATA');
        data = zeros(count, format.length);
        row = 0;
        let idIdx = format.indexOf('SAMPLEID');
        if (idIdx===-1) idIdx = format.indexOf('SAMPLE_ID');
        if (idIdx===-1) idIdx = format.indexOf('SAMPLE_NO');
        while(!getNext()) {
          if (line.value === 'END_DATA') break;
          const values = line.value.split(/\s+/).map(Number.parseFloat);
          if (idIdx>=0){
            row = values[idIdx];
            if (row<1 || row>count) throw new Error('readCGATS: SampleID outside the range 1..NUMBER_OF_SETS');
            data.set(row-1, ':', [values]);
          } else {
            data.set(row++-1, ':', [values]);
          }
        }
        if (row !== count) throw new Error('readCGATS: data rows does not match NUMBER_OF_SETS');
        rtn.format = {};
        for(let i=0;i<format.length; i++) rtn.format[format[i]]=i;
        rtn.data = data;
        break;
      default:
        rtn[type]=args.join(' ');
    }
  }
  return rtn;
}
