class Node{
  constructor(type, owner) {
    if (!['in', 'out', 'both'].includes(type)){
      throw "Type not in,out or both";
    }
    this.type= type;
    if (owner instanceof LogicOperation) {
      this.owner=owner;
    }
  }
  
  connect(node) {
    if (node instanceof LogicOperation) {
      if(this.type =='in' && node.type !='in'){
        this.connectedTo= node.owner;
        if(this.from!=node){
          this.from=node;
          node.connect(this);
        }
      } else if(this.type =='out' && node.type !='out') {
        this.connectedTo= node.owner;
        if(this.to!=node) {
          this.to=node;
          node.connect(this);
        }
      }
    }
  }
}

class Nodes{
  constructor() {
    
  }
  
  addConnection(node1,node2) {
    this.node1.connect(node2);
    this.node2.connect(node1);
  }
  
  addLogic(logic) {
    this.logics[this.logics.length] = logic;
    
    logic.addEventListener('tick', this.tickListener);
    
    this.nodes.concat(this.logic.getNodes());
  }
  
  tick() {
    this.clockNode.value =!this.clockNode.value;
    var tick = new Event('tick');
    
    this.clockNode.dispatchEvent(tick);
    
    var info = {};
    for (outputNode in this.outputNodes) {
      info[outputNode.name]=outputNode.value;
    }
  }
    
  initEvents() {
    
  }
}