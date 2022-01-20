
let r = function(el) {
    return vs.from(el);
}

 $('document').ready(function () {
    if ('vs' in window) {
        vs.page('Gam2');

        var ra = vs.clearBody()
            .section('top')
            .br()
            .addButton('Index', '/index.html')
            .addText(' ').el;

        vs.addSectionsToMain();
        gam2.start(ra, vs, rd);
    }
});

var gam2 = {
    'start': function (ra, vs, rd) {
        this.view.main = ra;
        this.view.vs = vs;

        for(var i of ['init','model','view','action']) {
          this.init.parents.apply(gam2[i]);
        }
        this.model.constr.init();
        this.view.topBar = r(ra).container('topbar','div').el;
            
        this.init.topBar();
        this.view.content = r(ra).container('content','div').el;
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
              this.model.constr.addLoc({pos:1, type:'asteroid-st', lvl:3, name: 'Balder', loc: 'L3:1'})
            )
     ;
            
          this.model.loc.list = loc;
          cr = loc;
          this.model.loc.current = cr;
          window.cr = cr;
         // console.log(cr);
          
          var blist = this.model.constr.addBox({type:'miner', pos:1, level:1, levelCost:10})
            .nextObj(
              this.model.constr.addBox({type:'dwellings', pos:2, level:1, levelCost:100, capacity: 5, usage: 2})
            )
          
          this.model.box.list= {
            'L3:1': blist.first
          };

          //console.log(p);
        },
        'topBar': function () {
            r(this.view.topBar)
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
      'vs': null,
      'main': null,
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

           var containerDiv;

           for(const i in p) {
               if (i % 2 === 0) {
                   containerDiv = r(this.view.content)
                       .container('mr-2 bg-card', 'div', '')
                       .el;
               }
               this.drawCard('loc'+ p[i].loc, p[i], containerDiv);
           }
       }
      // console.log(p);

      },
      'drawBox': function(redrawAll=1) {
        var cr = this.model.loc.current;
        var p = gam2.model.constr.getPropList(gam2.model.box.list[cr.p.loc])
          
        
        //var p = gam2.model.constr.getPropList(cr, 0, 1);
        if (p.length) {
          p = p.reverse();
        
          for (const i in p) {
            this.drawCard('ast' + p[i].pos, p[i]);
          }
        }
        console.log(p);
      },
      'drawCard': function(id, box, container = null,  redrawAll=1) {
          var crd= this.model.cards[box.type];
          var x2 = (box.is==='loc')?'-xs':'', color = crd.bg, dashed = crd.dashed;

          var icon = crd.icon+ " b-clr i-clr3 "+ crd.icon;
          
          var title = (box.is==='loc')? box.name:box.type;

        this.card[id] = r(container ? container: this.view.content)
            .container( 'm-2 p-2  bg-' + color + ' rounded box-shadow text-light bg-card'+x2+' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id':id})

            .container('fas fa-' + icon + ' fa-bgd'+x2+' fa-5x', 'div', '')
            .up()

            .container('tt', 'div', 'position:relative;top:0px;z-index:997')
            .container('border-bot4tom bor4der-gray pb-2 mb-0', 'h6')
            .addText(title)
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
          'asteroid-st': {
            'icon': 'toggle-on',
            'bg':'empty',
            'dashed':1,
          },
          'research-st': {
            'icon': 'ring fa-med',
            'bg':'empty',
            'dashed':1,
          },
          'miner': {
            'icon': 'cog',
            'bg':'dark',
            'dashed':0,
          },
          'dwellings': {
            'icon':'cubes',
            'bg':'power',
            'dashed':0,
          }
        },
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
                    'is':'loc',
                });

                this.addSlot = this.getAddFunc({
                    'item': 0,
                    'amount': 0,
                    'unitValue': 0,
                    'is':'slot',
                });

                this.addBox = this.getAddFunc({
                    'type': 0,
                    'pos':1,
                    'level': 0,
                    'levelCost': 0,
                    'moneyCost': 0,
                    'peopleCost': 0,
                    'powerCost': 0,
                    'is':'box',
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
                var rr = 0;
                do {
                    rr = walkerCb(s, rr);
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
                return rr;
            },
            'logPropList': function (obj) {
                this.walkList(obj, function(obj) { console.log(obj.p); return 1})
            },
            'getPropList': function (obj, detachResult = 0, parentWalkInstead = 0) {
                return this.walkList(obj, (detachResult)?
                    function(obj,rr) { if(!rr) { rr= [];} rr.push({...obj.p}); return rr;}:
                    function(obj,rr) { if(!rr) { rr= [];} rr.push(obj.p); return rr;},
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