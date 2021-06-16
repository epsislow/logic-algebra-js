class Trace {
  constructor() {
    this.samples = [];
  }

  reset() {
    this.samples = [];
  }

  sample(graph) {
    const currentSample = {};
    this.samples.push(currentSample);
    graph.forEach(s => {
      currentSample[s.id] = s.state;
    });
  }
  
  getSimpleTraces(names) {
    let data = [], head= [],headdiv=[];
    let lens = [];
    for(let name of names) {
      head.push(name);
      lens.push(name.length+(name.length%2==1?1:0))
      headdiv.push(`${'_'.repeat(name.length)}`)
    }
    
    data.push('|'+head.join(' | ')+'|');
    data.push('|'+headdiv.join('_|_')+'|')
    var row=[];
    for (let i = 0; i < this.samples.length; i++) {
      const trace = this.samples[i];
row= [];
      Object.entries(trace).forEach(([signal, value]) => {
        if (!names.includes(signal)) {
          return;
        }
        const prevStr = `${' '.repeat((signal.length + (signal.length%2==1?1:0))/2-1)}`;
        const strVal= prevStr+ (value=='x'?'*':(value==1?'@':' '))+prevStr;
        row.push(strVal);
      });
      data.push('|'+row.join(' | ')+'|');
    }
   // return data.join('\n');
   return data;
  }

  getTraces(names) {
    let longestName = '';
    let waves = {};

    for (let name of names) {
      waves[name] = ['', ''];
      if (name.length > longestName.length) {
        longestName = name;
      }
    }

    for (let i = 0; i < this.samples.length; i++) {
      const trace = this.samples[i];
      const prevTrace = this.samples[i - 1];

      Object.entries(trace).forEach(([signal, value]) => {
        if (!names.includes(signal)) {
          return;
        }

        if (prevTrace) {
          if (prevTrace[signal] !== value) {
            if (prevTrace[signal] === 'x') {
              // From X to valid
              waves[signal][0] += ']';
            } else if (value === 'x') {
              // From valid to X
              waves[signal][0] += '[';
            } else {
              // From one logic level to another
              waves[signal][0] += '|';
            }
            waves[signal][1] += ' ';
          } else {
            if (value === 0) {
              waves[signal][0] += '_';
              waves[signal][1] += ' ';
            } else if (value === 1) {
              waves[signal][0] += ' ';
              waves[signal][1] += '_';
            } else if (value === 'x') {
              waves[signal][0] += 'X';
              waves[signal][1] += ' ';
            }
          }
        }

        if (value === 0) {
          waves[signal][0] += '__';
          waves[signal][1] += '  ';
        } else if (value === 1) {
          waves[signal][0] += '  ';
          waves[signal][1] += '__';
        } else if (value === 'x') {
          waves[signal][0] += 'XX';
          waves[signal][1] += '  ';
        }
      });
    }

    return Object.entries(waves).map(([signal, wave]) => {
      const waveOutput = [
        `${' '.repeat(longestName.length + 2)}${wave[1]}`,
        `${signal}${' '.repeat(longestName.length - signal.length + 2)}${wave[0]}`,
        ''
      ].join('\n');
      return waveOutput;
    });
  }

  getAllTraces() {
    return this.getTraces(Object.keys(this.samples[0]));
  }

  getSample(n, names) {
    return names.reduce((acc, signal) => {
      acc[signal] = this.samples[n][signal];
      return acc;
    }, {});
  }
}

//module.exports = Trace;