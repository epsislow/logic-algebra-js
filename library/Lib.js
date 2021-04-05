var lib = {
  'and': function (x1, x2) {
    return x1 && x2;
  },
  'or': function (x1,x2)   {
    return x1 || x2;
  },
  'not': function (x) {
    return !(x);
  },
  'xor': function(x1,x2) {
    return x1 ^ x2;
  },
  'nor': function(x1, x2) {
    return !(x1 || x2);
  },
  'nand': function(x1,x2) {
    return !(x1 && x2);
  },
  'gen': function(bits, value) {
    return new Array(bits).fill(value);
  },
  'zero': function(bits) {
    return this.gen(bits,0);
  },
  'one': function(bits) {
    return this.gen(bits,1);
  },
  'rand': function(bits) {
    return new Array(bits).map(x=>Math.round(Math.random()))
  },
  'memory': {
    data: {},
    set: function(name, value) {
      this.data[name] = value;
    },
    get: function(name) {
      return this.data[name];
    },
  },
  'truth': function(op) {
    var info = {'operation': op};
    for (var x1 = 0; x1 <= 1; x1++) {
      if (op == 'not') {
        var title = 'x1='+ x1;
        info[title] = lib[op](x1)?1:0;
      } else if (['and','or','not','nor','nand','xor'].includes(op)) {
        for (var x2 = 0; x2 <= 1; x2++) {
          var title = 'x1='+ x1 + ' x2=' + x2;
          info[title] = lib[op](x1, x2)?1:0;
        }
      } else {
        for (var x2 = 0; x2 <= 1; x2++) {
          for (var qold = 0; qold <= 1; qold++) {
            var title = 'x1=' + x1 + ' x2=' + x2 + ' qold=' + qold;
            var values = lib[op](x1, x2, qold);
            info[title] = 'q='+ values.q + ' nq='+ values.nq;
          }
        }
      }
    }
    console.table(info);
  },
  's-r-latch-nand': function(s,r, qold = 0) {
    q = lib.nand(s,nq = lib.nand(qold,r));
    return {'q': q?1:0, 'nq': nq?1:0};
  },
  'd-latch-nand': function(d, en, qold = 0) {
    nq = lib.nand(qold, lib.nand(en,lib.not(d)));
    q = lib.nand(lib.nand(d,en), nq);
    return {'q': q?1:0, 'nq': nq?1:0};
  },
  's-r-latch-nor':  function(s,r, qold = 0) {
    nq = lib.nor(qold,s);
    q = lib.nor(r,nq);
    return {'q': q?1:0, 'nq': nq?1:0};
  },
  'd-latch-nor': function(d, en, qold = 0) {
    nq = lib.nor(qold, lib.and(en,d));
    q = lib.nor(lib.and(lib.not(d),en), nq);
    return {'q': q?1:0, 'nq': nq?1:0};
  },
  'constructFromMatrix': function (objects,connections) {
      for(connection in connections) {

      }
  },
  'getMatrixFromOp': function(op) {
  }
}

class LogicOperation {
  constructor(inputs, outputs) {
    this.inputs = inputs;
    this.outputs = outputs;
  }

  perform(inputs) {
    return 0;
  }
  
  addLogicOpInput(LogicOpInput) {
    this.inputObj[LogicOpInput.number]= LogicOpInput;
    
    return this;
  }
  
  addLogicOpOutput(LogicOpOutput) {
    this.outputObj[LogicOpOutput.number]= LogicOpOutput;
    
    return this;
  }
  
  calc() {
    if(!this.inputObj.length || !this.outputObj.length) {
      throw "LogicOpInput/Output not added";
    }
    
    for (var input in this.inputObj) {
        inputs[input.number]=input.value;
    }
    
    var outputs = this.perform(inputs);
    var i = 1;
    for (var output in outputs) {
      i++;
      this.outputObj[i].setValue(output);
    }
  }
}

class And extends LogicOperation {
  constructor() {
    super(2,1);
  }

  perform(inputs) {
    return lib.and.apply(this, inputs);
  }
}

class Nand extends LogicOperation {
  constructor() {
    super(2,1);
  }

  perform(inputs) {
    return lib.nand.apply(this, inputs);
  }
}

class DLatchNor extends LogicOperation {
  constructor() {
    super(3,2);
  }

  perform(inputs) {
    return lib['d-latch-nor'].apply(this, inputs);
  }
}

class BitsDlatch extends LogicOperation {
  constructor() {
    super(3,2);
  }
  
  perform(inputs) {
    var outputs={};
    
    for(var i=0;i<inputs.x.length;i++) {
      var latch=[
        inputs.x[i],
        inputs.en,
        inputs.qold[i]
      ];
      var outputdl=lib['d-latch-nor'].apply(this,latch);
      outputs[i]={
        en:inputs.en,
        x:inputs.x[i],
        y:outputdl.q,
      };
    }
    
    return outputs;
  }
}


class LogicOperationInput {
  constructor(LogicOp, number) {
    if (!LogicOp instanceof LogicOperation) {
      throw "LogicOperation object expected";
    }

    this.logicOp = LogicOp;
    this.number = number;
    this.value = 0;
  }

  connectToOutput(LogicOpOutput) {
    if (!LogicOpOutput instanceof LogicOperationOutput) {
      throw "LogicOperationOutput object expected";
    }
    if (this.connectedToOutput == LogicOpOutput) {
      console.log('done');
      return;
    }
    this.connectedToOutput = LogicOpOutput;
    LogicOpOutput.connectToInput(this);
  }
}

class LogicOperationOutput {
  constructor(LogicOp, number) {
    if (!LogicOp instanceof LogicOperation) {
      throw "LogicOperation object expected";
    }

    this.logicOp = LogicOp;
    this.number = number;
    this.value = 0;
  }

  setValue(value) {
    this.value = value;
    return this;
  }
  
  connectToInput(LogicOpInput) {
    if (!LogicOpInput instanceof LogicOperationInput) {
      throw "LogicOperationInput object expected";
    }
    if (this.connectedToInput == LogicOpInput) {
      console.log('done');
      return;
    }
    this.connectedToInput = LogicOpInput;
    LogicOpInput.connectToOutput(this);
  }
}

class ConnectorMatrix {
  constructor() {
    this.objects = [];
    this.inputs = [];
    this.outputs = [];
  }

  addLogicOp(LogicOp, name = '') {
    if (!LogicOp instanceof LogicOperation) {
      throw "LogicOperation object expected";
    }

    if (name) {
      this.objects[name] = LogicOp;
    } else {
      this.objects[this.objects.length] = LogicOp;
    }

    for(var i = 0; i < LogicOp.inputs; i++) {
      this.inputs[this.inputs.length] = new LogicOperationInput(LogicOp, i);
    }

    for(var i = 0; i < LogicOp.outputs; i++) {
      this.outputs[this.outputs.length] = new LogicOperationOutput(LogicOp, i);
    }
    return this;
  }
}

var Connector = new ConnectorMatrix();

Connector
    .addLogicOp(new And(), 'and1')
    .addLogicOp(new And(), 'and2');


var dlatch = new DLatchNor();


console.log(
  dlatch.perform([x1=1, x2=1, qold=1])
);

var Bits = new BitsDlatch();

console.table(
  Bits.perform(
    {
      en:1,
      x:[1,0,1,0,1,0,1,0],
      qold:[0,1,1,1,0,0,0,0]
    })
  );



// -----------------

/*
lib.truth('and');
lib.truth('or');
lib.truth('not');
lib.truth('nand');
lib.truth('nor');
lib.truth('xor');


lib.truth('s-r-latch-nand');
lib.truth('d-latch-nand');
lib.truth('s-r-latch-nor');
lib.truth('d-latch-nor');

*/

