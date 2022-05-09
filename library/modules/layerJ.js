/*
 Module: NBQueue
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var layerJ = (function () {
  let pub = {};

  pub.node = {
    'add': function (value = 0, spikeRequiredValue = 10, spikeTopValue = 20)
    {
      return {
        value: value ? value: Math.round(Math.random()*10) + 1,
        spikeRequiredValue: spikeRequiredValue,
        spikeTopValue: spikeTopValue,
      };
    }
  };

  pub.layer = {
      'add': function (layers = [], nodes = 20, nodeConfig = [])
      {
        let layer = new Array(nodes).fill( pub.node.add.apply(null, nodeConfig));
        layers.push(layer);
        return layers;
      }
  };



  return pub;
})();

export { layerJ }