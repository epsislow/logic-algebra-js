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
  'multi-and': function(xs) {
    var res=1;
    for(k in xs) {
      res = lib.and(xs[k], res);
    }
    return res;
  },
  'multi-or': function(xs) {
    var res=0;
    for(k in xs) {
      res = lib.or(xs[k], res);
    }
    return res;
  },
  'multi-nand': function(xs) {
    var res = 1;
    for(k in xs) {
      res = lib.nand(res, xs[k]);
    }
    return res;
  },
  'enable': function(en,xs) {
    var res;
    for(k in xs) {
      res = lib.and(en, xs[k]);
    }
    return res;
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
  'encoder': function(d,s0) {
    return [
      lib.and(d,lib.and(s0)),
      lib.and(d,lib.and(lib.not(s0)))
    ];
  },
  'encoder2': function (d, s1, s2) {
    return [
      lib.and(d,lib.and(s1,s2)),
      lib.and(d,lib.and(s1,lib.not(s2))),
      lib.and(d,lib.and(lib.not(s1), s2)),
      lib.and(d,lib.and(lib.not(s1), lib.not(s2)))
    ];
  },
  'multi-encoder': function(d, sel) {
    var selc = [];
    var i = 0;
    for (key in sel) {
      selc[key] = lib.not(sel[key]);
    }
    
    var res = new Array(2**sel.length).fill(0);
    for (key in sel) {
      if (!selc[key]) {
        i += 2**key;
        selc[key] = sel[key];
      }
      if (lib['multi-and'](selc)) {
        res[i]=d;
        return res;
      }
    }
    return res;
  },
  'constructFromMatrix': function (objects,connections) {
      for(connection in connections) {

      }
  },
  'getMatrixFromOp': function(op) {
  },
  parse: function(strTokens =[], untilComma=false) {
    var count = 0;
    var params = [];
    var L = '';
    var lastVar = assignTo = '';
    
    while(L=strTokens[count]){
      switch(L) {
        case 'A': {
          op = 'and';
          break;
        }
        case 'N': {
          op = 'not';
          break;
        }
        case '0': {
          params[params.length] = 0;
          break;
        }
        case '1': {
          params[params.length] = 1;
          break;
        }
        case ' ': 
          break;
        case ',':
          break;
        case '(': {
          console.log(strTokens.slice(count+1));
          var ob= this.parse(
            strTokens.slice(count+1),true
          );
          count = ob.count;
          params[params.length] = ob.result;
          break;
        }
        case ')': {
          console.log(op);
          console.log(params);
          result = this[op].apply(this, params);
          if (assignTo) {
            this.memory.set(assignTo, result);
          }
          return {result: result, count:count};
          
          break;
        }
        case ':': {
          result = this[op].get(lastVar);
          if (assignTo) {
            this.memory.set(assignTo, result);
          }
          return {result: result, count:count};
          
          break;
        }
        case L >= 'a'|| L <= 'z': {
          lastVar = L;
          break;
        }
        case '=': {
          assignTo= lastVar;
          break;
        }
      }
      console.log(L);
      count++;
    }
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

class Demuxer extends LogicOperation {
  constructor () {
    super(2,1);
  }
  
  perform (inputs) {
    var outputs= lib['multi-encoder'](inputs.d, inputs.sel);
    
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

/*
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
  
var Demux = new Demuxer();

console.table(
    Demux.perform({
      d:1,
      sel:[0,0,0]
    })
  );
*/



/*
var str= "a=A(1,0)";
console.table(
  lib.parse(str.split(''))
);
*/

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

class Optimizer {
  constructor() {
    this.data =[];
    this.outputkeys =[];
    this.inputkeys =[];
  }
  
  addRow(values) {
    var allValues =[];
    var data={};
    for(var k in values) {
      if ([0,1].includes(values[k])) {
        data[k] = values[k];
      } else if (values[k]=='*') {
        allValues[allValues.length] = k;
      }
      if(!this.inputkeys.includes(k)) {
        this.inputkeys[this.inputkeys.length]= k;
      }
    }
    //console.log(data);
    var datas;
    if(allValues.length) {
      datas = this.getValuesForAllKeys([data], allValues);
    } else {
      datas = [data];
    }
    
    this.data= this.data.concat(datas);
    return this;
  }
  
  getValuesForAllKeys(datas, keys) {
    var key = keys.shift();
    if(key == undefined) {
      return datas;
    }
    
    var ds=[];
    var qq;
    for(var d in datas) {
      //console.log('a', datas[d]);
      //qq = this.getValuesForKey(datas[d], key);
      //console.log('b', qq);
      ds = ds.concat(this.getValuesForKey(datas[d], key));
    }
    //console.log('t');
    ds = this.getValuesForAllKeys(ds, keys);
    return ds;
  }
  
  getValuesForKey(data, key) {
    var newdatas=[];
    var newdata= data;
    newdata[key]  = 0;
    newdatas[newdatas.length] = Object.assign({}, newdata);
    newdata[key] =1;
    newdatas[newdatas.length] = Object.assign({}, newdata);
    return newdatas;
  }
  
  preferredOrder(obj, order) {
    var newObject = {};
    for (var i = 0; i < order.length; i++) {
      if (obj.hasOwnProperty(order[i])) {
        newObject[order[i]] = obj[order[i]];
      }
    }
    return newObject;
  }
  
  changeOrder(order) {
    var qdata = [];
    for(var r in this.data) {
      qdata[r] = this.preferredOrder(this.data[r], order);
      //console.table(q);
      //console.table(this.data[r]);
    }
    this.data = qdata;
    return this;
  }
  
  showData() {
    console.table(this.data);
    return this;
  }
  
  setOutputs(keys, incOutputs =[], excInputs =[]) {
    this.outputkeys = keys;
    this.incOutputs = incOutputs;
    this.excInputs = excInputs;
    for(var k in keys) {
      var kid =this.inputkeys.findIndex((e) => e == keys[k]);
      if (kid!== false) {
        this.inputkeys.splice(kid, 1);
      }
    }
    return this;
  }
  
  sortAll(order) {
     this.data.sort(function(a,b) {
       var k;
      for(var ko in order) {
        k = order[ko];
        //console.log(k, a[k], b[k]);
        if(a[k] != b[k]) {
          return a[k] < b[k] ? -1 : 1;
        }
      }
      return 0;
    });
    
    return this;
  }
  
  createKmap(output) {
    if(!this.outputkeys.includes(output)) {
      throw "Not an output!";
    }
    
    var kmap = {};
    var inputs = [];
    //console.log(this.inputkeys);
    var rownr =Math.ceil(Math.sqrt(this.inputkeys.length));
    var colnr = this.inputkeys.length - rownr;
    //console.log(rownr, colnr);
    
    var rowkeys = this.inputkeys.slice(0, rownr);
    //console.log(rowkeys);
    var colkeys = this.inputkeys.slice(rownr);
    //console.log(colkeys);
    
    var rowvals = this.getValuesForAllKeys([{}], rowkeys);
    
    //console.table(rowvals);
    
    var colvals = this.getValuesForAllKeys([{}], colkeys);
    
    var row,col,values,vals,val,result = output + '= ';
    for(var r in rowvals) {
      values = {};
      row = '';
      for(var k in rowvals[r]) {
        row += k + '=' + rowvals[r][k] + ' ';
        values[k] = rowvals[r][k];
      }
      kmap[row] = {};
      for(var c in colvals) {
        col = '';
        for(var k in colvals[c]) {
          col+= k+'='+colvals[c][k];
          values[k] = colvals[c][k];
        }
        vals = this.findValueFor(values);
        if(vals === false) {
          val = 0;
        } else {
          val = vals[output];
        }
        kmap[row][col] = val;
        if(val) {
          result += '('+ row +' '+ col + ') + ';
        }
      }
    }

    console.table(kmap);
    console.log(result);
  }
  
  findValueFor(values) {
    //console.table(values);
    for(var d in this.data) {
      if(!this.findSame(this.data[d], values)) {
        continue;
      }
      return this.data[d];
    }
    return false;
  }
  
  findSame(row, values) {
   // console.table([row,values]);
    for(var k in values) {
      if(row[k]!=values[k]){
        //console.table([k,row[k],values[k]]);
        return false;
      }
    }
   // console.log('tre');
    return true;
  }
}

var o = new Optimizer();

o.addRow({a:'*',en:0,qold:0,qnew:0})
 .addRow({a:'*',en:0,qold:1,qnew:1})
 .addRow({a:0,en:1,qold:'*',qnew:0})
 .addRow({a:1,en:1,qold:'*',qnew:1})
 .setOutputs(['qnew'])
 //.changeOrder(['a','en','qold','qnew'])
 .sortAll(['a','en','qold','qnew'])
 .showData()
 .createKmap('qnew')
;