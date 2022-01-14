
var gam2 = {
    'start': function (ra, vs, rd) {
        for(var i of ['init','model','view','action']) {
          this.init.parents.apply(gam2[i]);
        }
        this.model.constr.init();
        this.view.topBar = ra.container('topbar','div');
            
        this.init.topBar();
        this.view.content = ra.container('content','div');
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
            this.model.constr.addLoc({pos:1, type:'sun', lvl:0, name: 'Icarus', loc: 'L0:1'})
            .addChildObj(
              this.model.constr.addLoc({pos:1, type:'asteroid-belt', lvl:1, name: 'Cloud A1', loc: 'L1:1'})
            )
            .addChildObj(
              this.model.constr.addLoc({pos:1, type:'asteroid', lvl:2, name: 'C5', loc: 'L2:1'})
            )
            .nextObj(
              this.model.constr.addLoc({pos:2, type:'asteroid', lvl:2, name: 'B2', loc: 'L2:2'})
            )
            .nextObj(
              this.model.constr.addLoc({pos:3, type:'asteroid', lvl:2, name: 'E11', loc: 'L2:3'})
            )
            .prev
            .addChildObj(
              this.model.constr.addLoc({pos:1, type:'mine-st', lvl:3, name: 'Balder', loc: 'L3:1'})
            )
     ;
            
          this.model.loc.list = loc;
          cr = loc;
          this.model.loc.current = cr;
          window.cr = cr;
         // console.log(cr);
          
          var blist = this.model.constr.addBox({type:'Miner', level:1, levelCost:10})
            .nextObj(
              this.model.constr.addBox({type:'Dwellings', level:1, levelCost:100, capacity: 5, usage: 2})
            )
          
          this.model.box.list= {
            'L3:1': blist.first
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
                .br();
        }
    },
    'view':{
      'topBar': null,
      'content': null,
      'card': [],
      'draw':function() {
        this.drawLoc(1);
        this.drawBox(1);
      },
      'drawLoc': function(redrawAll=1) {
        var cr= this.model.loc.current;
        
       var p = gam2.model.constr.getPropList(cr,0,1);
       if (p.length) {
           p = p.reverse();

           for(const i in p) {
               this.drawCard('loc'+ p[i].loc, p[i]);
           }
       }
       console.log(p);

      },
      'drawBox': function(redrawAll=1) {
      },
      'drawCard': function(id, box, redrawAll=1) {
          var crd= this.model.cards[box.type];
          var x2 = '-xs', color = crd.bg, dashed = crd.dashed;

          var icon = crd.icon+ " b-clr i-"+ crd.icon;

        this.card[id] = this.view.content
            .container('m-2 p-2 bg-' + color + ' rounded box-shadow text-light bg-card'+x2+' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id':id})

            .container('fas fa-' + icon + ' fa-bgd'+x2+' fa-5x', 'div', '')
            .up()

            .container('tt', 'div', 'position:relative;top:0px;z-index:997')
            .container('border-bot4tom bor4der-gray pb-2 mb-0', 'h6')
            .addText(box.name)
        ;
      },
      'updateLoc': function() {
        
      },
      'updateBox': function() {
        
      }
    },
    'model': {
        'cards': {
          'sun': {
            'icon': 'sun',
            'bg':'empty',
            'dashed':1,
          },
          'asteroid-belt': {
            'icon':'braille',
            'bg':'empty',
            'dashed':1,
          },
          'asteroid': {
            'icon':'circle fa-sml',
            'bg':'empty',
            'dashed':1
          },
          'moon': {
            'icon':'moon fa-med',
            'bg':'empty',
            'dashed':1,
          },
          'planet': {
            'icon':'adjust',
            'bg':'empty',
            'dashed':1,
          },
          'mine-st': {
            'icon': 'toggle-on fa-med',
            'bg':'empty',
            'dashed':1,
          },
          'research-st': {
            'icon': 'ring fa-med',
            'bg':'empty',
            'dashed':1,
          }
        },
        'loc': {
          'list': null,
          'nn': {
            /*
            var types = ['planet','moon','asteroid','asteroid-belt'];
                var seenAs = ['empty'];
                var icon = ['adjust', 'moon fa-med', 'circle fa-sml', 'braille'];
                
            */
            'sun': {
              'icon': 'sun',
              
            }
          },
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