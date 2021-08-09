

class Comp {
  constructor(id, type) {
    this.id = id;
    if (type.prototype instanceof CompType) {
      this.type = type;
    } else {
      this.type = compTypeFactory(type);
    }
  }

  toJSON() {
    return this.serialize();
  }

  fromJSON($parsedJson) {
    return this.deserialize($parsedJson);
  }

  toObject () {
    return {
      'class':'Comp'
    };
  }

  fromObject ($obj) {

  }

  serialize() {

  }

  deserialize($parsedJson) {
  }

}

class CompType {
  constructor() {
  }

  getType() {
    return this.constructor.name;
  }

  draw() {
  }

  eval(inStates) {
    return {}
  }

  export(inStates, outStates, type = 'object') {
    return type == 'object'? {} : '';
  }
}

window.NandCompType = class NandCompType extends CompType {
  constructor() {
    super();
  }
  draw() {

  }

  eval(inStates) {

    var outStates = {'out': window.libFn.nand(inStates.in1, inStates.in2)};
    return outStates;
  }

  export(inStates, outStates, type = 'object') {
    if (type == 'object') {
      return {'nand': {'in' : inStates, 'out': outStates}};
    }
    return 'nand('+ inStates + ',' + outStates + ')';
  }
}

window.ChipCompType = class ChipCompType extends CompType{
  constructor() {
    super();
  }
}

const compTypeFactory = (function () {
  const types = {};
  return {
  'set': function (type, typeClass) {
    types[type] =  new self[typeClass];
  },
  'get': function (type, args= []) {
    return types[type];
  }}
})();

compTypeFactory.set('nand', 'NandCompType');
compTypeFactory.set('chip', 'ChipCompType');


class Chip{
  constructor() {
    this.comps = [];
  }

  addComp(comp) {
    this.comps[comp.id] = comp;
  }

  getComps() {

  }

  connectComps() {

  }

  evalComps() {

  }

  exportComps() {

  }

  toJSON() {
    return this.serialize();
  }

  fromJSON($parsedJson) {
    return this.deserialize($parsedJson);
  }

  serialize() {
    var obj = {};
    this.getComps().forEach(function (element) {
      obj.comp.push(element.toObject());
    })

    return
  }

  deserialize($parsedJson) {
    var obj = $parsedJson;
    obj.comp
  }
}

class CompApp {
  constructor() {
    this.chips = [];
  }

  addChip(chip) {
    this.chips.push(chip);
  }
}

export { CompApp, Chip, Comp, CompType, compTypeFactory }