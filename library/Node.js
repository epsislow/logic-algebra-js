class Node{
  constructor(type) {
    if (!['in', 'out', 'both'].includes(type)){
      throw "Type not in,out or both";
    }
    this.type= type;
  }
}
