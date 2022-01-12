
var gam2 = {
    'start': function (ra, vs, rd) {
        for(var i of ['init','model','view','action']) {
          this.init.parents.apply(gam2[i]);
        }
        this.model.constr.init();
        
        this.view.topBar = ra.container('topbar','div');
            
        this.init.topBar();
        this.init.boot();
        this.view.draw();
    },
    'init': {
        'parents': function () {
          this.view = gam2.view;
          this.model = gam2.model;
          this.action = gam2.action;
        },
        'boot': function() {
          var cr;
          var loc = 
            this.model.constr.addLoc({pos:1, card:'asteroid-belt', lvl:1, name: 'Icarus', loc: 'L1:1'})
          .addChildObj(
            this.model.constr.addLoc({pos:1, card:'asteroid', lvl:2, name: 'C5', loc: 'L2:1'})
          )
          .nextObj(
            this.model.constr.addLoc({pos:2, card:'asteroid', lvl:2, name: 'B2', loc: 'L2:2'})
            )
          .nextObj(
            this.model.constr.addLoc({pos:3, card:'asteroid', lvl:2, name: 'E11', loc: 'L2:3'})
          );
            
          this.model.loc.list = loc.first;
          cr = loc;
          cr = cr.prev;
          this.model.loc.current = cr;
          //console.log(cr);
          
          var blist = this.model.constr.addBox({type:'Miner', level:1, levelCost:10})
            .nextObj(
              this.model.constr.addBox({type:'Dwellings', level:1, levelCost:100, capacity: 5, usage: 2})
            )
          
          this.model.box.list= {
            'L2:2': blist.first
          };

          var p = gam2.model.constr.getPropList(gam2.model.box.list[cr.p.loc])
          console.log(p);
        },
        'topBar': function () {
            
            this.view.topBar
                .clear()
                .addText(' ')

                .container('fa fa-donate','i')
                .up()
                .container('s-money','span')
                .addText('0')
                .up()

                .container('fa fa-plug','i')
                .up()
                .container('s-power','span')
                .addText('0')
                .up()

                .container('fa fa-child','i')
                .up()
                .container('s-people','span')
                .addText('0')
                .up()
                .up()
                .br()
                .container('main', 'div');
        }
    },
    'view': {
      'draw':function() {
        this.drawLoc(1);
        this.drawBox(1);
      },
      'drawLoc': function(redrawAll=1) {
        var cr= this.model.loc.current;
        
       var p = gam2.model.constr.getPropList(cr,0,1);
       console.log(p,cr);
       
      },
      'drawBox': function(redrawAll=1) {
        
      },
      'updateLoc': function() {
        
      },
      'updateBox': function() {
        
      }
    },
    'model': {
        'loc': {
          'list': null,
        },
        'box': {
          'list': null,
        },
        'constr': {
            'getAddFunc': function (defaultProp) {
                var defaults = JSON.parse(JSON.stringify(defaultProp));

                return function (prop) {
                    var pub = {
                        'p':{...defaults, ...prop},
                        'parent': null,
                        'child': null,
                        'next': null,
                        'prev': null,
                        'first': null,
                        'firstParent': null,
                        'addChildObj': function (obj) {
                            obj.parent = this;
                            obj.firstParent = this.firstParent;
                            this.child = obj;
                            return obj;
                        },
                        'nextObj': function (obj) {
                            obj.prev = this;
                            obj.first = this.first;
                            obj.firstParent = this.firstParent;
                            obj.parent = this.parent;
                            this.next = obj;
                            return obj;
                        },
                    };
                    pub.first = pub;
                    pub.firstParent = pub;

                    return pub;
                }
            },
            'init': function () {
                this.addLoc = this.getAddFunc({
                    'name': '',
                    'type': '',
                    'lvl': 0,
                    'pos': 0,
                    'card': 'empty',
                });

                this.addSlot = this.getAddFunc({
                    'item': 0,
                    'amount': 0,
                    'unitValue': 0,
                });

                this.addBox = this.getAddFunc({
                    'type': 0,
                    'level': 0,
                    'levelCost': 0,
                    'moneyCost': 0,
                    'peopleCost': 0,
                    'powerCost': 0,
                });
            },
            'addLoc': function (prop) {},
            'addSlot': function (prop) {},
            'addBox': function (prop) {},
            'walkList': function(obj, walkerCb, parentWalkInstead = 0) {
                if (typeof walkerCb !== 'function') {
                    throw "walker is not a function!";
                }
                let s= obj.first;
                let exit = false;
                let i = 0;
                var r = 0;
                do {
                    r = walkerCb(s, r);
                    if(++i >= 10000) break;
                    if(parentWalkInstead) {
                      s = s.parent;
                    } else {
                      s = s.next;
                    }
                } while (null !== s)
                if (i >= 10000) {
                    throw "Max iterations of walker reached. Check for loops in list!";
                }
                return r;
            },
            'logPropList': function (obj) {
                this.walkList(obj, function(obj) { console.log(obj.p); return 1})
            },
            'getPropList': function (obj, detachResult = 0, parentWalkInstead = 0) {
                return this.walkList(obj, (detachResult)?
                    function(obj,r) { if(!r) { r= [];} r.push({...obj.p}); return r;}:
                    function(obj,r) { if(!r) { r= [];} r.push(obj.p); return r;},
                    parentWalkInstead
            );
            }
        },
        'prop': {
          'asteroid': {
            'type': 'asteroid',
          },
        }
    },
    'action': {},
}



export { gam2 };