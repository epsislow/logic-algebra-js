var t = {
  'isTrue': function () {},
  'isFalse': function () {},
  'isObject': function () {},
  'hasLength':function () {},
  'isArray': function () {},
  'isEqual': function () {},
  'getMock': function (name, obj) {
    if(this.mocks.hasOwnProperty(name)) {
      return this.mocks[name];
    }
    var mock = {};
    this.mocks[name] = mock;
    
    return this.mocks[name];
  },
  'setContext': function () {},
  'getContext': function () {},
  'mocks': {},
}

