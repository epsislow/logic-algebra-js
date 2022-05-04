var arrangeObj = {
  'fit': function (item, inVolume, rotate=1) {
    if(rotate) {
      item = this.rotate(item);
    }
    let arrangement = this.fitInVolume(item, inVolume, rotate);
    for(let holeVolume in arrangement.holes) {
      if(holeVolume.visited) {
        continue
      }
      arrangement.addArrangement(this.fitInVolume(item, holeVolume, rotate)); 
      holeVolume.visited=1;
    }
    return arrangement.cnt;
  },
  'fitInVolume': function(item, inVolume) {
    let arrangement = {
      'holes': [],
      'cnt':0,
    }
    let rows = Math.ceil(inVolume.height/item.height);
    let lenghtColumns = Math.ceil(inVolume.length/ item.length);
    return arrangement;
  }
}


export { arrangeObj }