
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
    'start': function (ra, vs, rand) {
        this.view.main = ra;
        this.view.vs = vs;

        const seed = 'gam2b5xBxhe$X54B8sd';
        this.model.rand.seed.main = rand.hashCode(seed + seed, 23131);
        let rd = rand.sessionWithSeed(rand.hashCode(seed + seed));

        this.model.rand.rd = rd;

        this.model.rand.seed.loc0 = rd.hashCode(seed + 'loc0', rd.rand(127, 65536));
        this.model.rand.seed.loc1 = rd.hashCode(seed + 'loc1', rd.rand(127, 65536));
        this.model.rand.seed.loc2 = rd.hashCode(seed + 'loc2', rd.rand(127, 65536));
        this.model.rand.seed.loc3 = rd.hashCode(seed + 'loc3', rd.rand(127, 65536));
        this.model.rand.seed.res = rd.hashCode(seed + 'res', rd.rand(127, 65536));
        this.model.rand.seed.box = rd.hashCode(seed + 'box', rd.rand(127, 65536));

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
          let cr;
          let rd = this.model.rand.rd;
          let rdChr =  this.model.rand.rdChr;

          let seedLoc = this.model.rand.seed.loc0;
          let seedRes = this.model.rand.seed.res;
          let seedBox = this.model.rand.seed.box;

          let locProps = gam2.model.constr.locProps;
          
          let p0 = rd.rand(1,10,seedLoc);
          let p1 = rd.rand(1,10,seedLoc);
          let p2 = rd.rand(1,10,seedLoc);
          let p3 = rd.rand(1,2,seedLoc);
          console.log(p0+','+p1+','+p2+','+p3);
          
          gam2.model.loc.pmap = {
            0: {[p0]:locProps(p0, 'sun', 0, 'Icarus')},
            [[p0].join('.')]: {[p1]:locProps(p1, 'asteroid-belt', 1, 'Cloud A2')},
            [[p0,p1].join('.')]: {[p2]: locProps(p2, 'asteroid', 2, 'Jadvis')},
            [[p0,p1,p2].join('.')]: {[p3]: locProps(p3, 'asteroid-st', 3, 'Balder')},
          }
          
          console.log(gam2.model.loc.pmap);

          var xr = gam2.view.genLocs(0, 0, 0, 0, 0, 0, {[p0]: locProps(p0, 'sun', 0, 'Icarus')});
          var loc = xr.first.get(p0)
          
          .addChildObj(
            gam2.view.genLocs(1, p0, 0, 0, 0, p1, {[p1]: locProps(p1, 'asteroid-belt', 1, 'Cloud A2' )}).get(p1)
          )
          .addChildObj(
            gam2.view.genLocs(2, p0, p1, 0, 0, p2, {[p2]: locProps(p2, 'asteroid', 1, 'Jadvis')}).get(p2)
          )
          .addChildObj(
            gam2.view.genLocs(3, p0, p1, p2, 0, p3, {[p3]: locProps(p3, 'asteroid-st', 1, 'Balder')}).get(p3)
          )
          
          //loc.p = locProps(loc.p.pos, 'asteroid-st', 3, 'Balder');
          
          
          var p = gam2.model.constr.getPropList(xr.first, 1, 0);
          console.table(p);
          
          var logc = 
            this.model.constr.addLoc(
                locProps(p0, 'sun', 0, 'Icarus')
            )
            .addChildObj(
              this.model.constr.addLoc(
                locProps(p1, 'asteroid-belt', 1, 'Cloud '+ rdChr(seedLoc,1, 0).toUpperCase() +  rdChr(seedLoc,0, 1))
              )
            )
            .addChildObj(
              this.model.constr.addLoc(
                locProps(p2-1, 'asteroid', 2, rdChr(seedLoc,1, 0).toUpperCase() +  rdChr(seedLoc,0, 1))
              )
            )
            .nextObj(
              this.model.constr.addLoc(
                locProps(p2, 'asteroid', 2, rdChr(seedLoc,1, 0).toUpperCase() +  rdChr(seedLoc,0, 1))
              )
            )
            /*.nextObj(
              this.model.constr.addLoc(
                locProps(rd.rand(1,10, seedLoc), 'asteroid', 2, rdChr(seedLoc,1, 0).toUpperCase() +  rdChr(seedLoc,0, 1))
              )
            )*/
            .addChildObj(
              this.model.constr.addLoc(
                  locProps(p3, 'asteroid-st', 3, 'Balder')
            //{pos:1, type:'asteroid-st', lvl:3, name: 'Balder', loc: 'L3:1'}
                  )
            )
     ;
            
          this.model.loc.list = loc;
          cr = loc;
          this.model.loc.current = cr;
          window.cr = cr;
          console.log('cr', cr);
          
          var blist = this.model.constr.addBox({type:'miner', pos:1, level:1, levelCost:10})
            .nextObj(
              this.model.constr.addBox({type:'dwellings', pos:2, level:1, levelCost:100, capacity: 5, usage: 2})
            )
          
          this.model.box.list= {};

          this.model.box.list[cr.p.loc] = blist.first;
          p = gam2.model.constr.getPropList(cr, 1, 1);
          
          console.log(p);
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
      'locEnd': null,
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
           var el;

           for(const i in p) {
               if(!p.hasOwnProperty(i)) {
                   continue;
               }
               if (i % 2 === 0) {
                   containerDiv = r(this.view.content)
                       .container('m-2 bg-card', 'div', '')
                       .el;
               }
               el = this.drawCard('loc'+ p[i].loc, p[i], containerDiv);

               el.click((function (el, box, plist) {return function () { gam2.action.loc.unlockLoc(el, box, plist); }})(el, p[i], p));
           }
           this.view.locEnd = r(el).up().el;
       }
      // console.log(p);

      },
      'drawBox': function(redrawAll=1) {
        var cr = this.model.loc.current;
        var p = gam2.model.constr.getPropList(gam2.model.box.list[cr.p.loc])
          
        
        //var p = gam2.model.constr.getPropList(cr, 0, 1);
        if (p.length) {
          p = p.reverse();

          var el;
        
          for (const i in p) {
            el = this.drawCard('ast' + p[i].pos, p[i]);
          }
        }
        console.log(p);
      },
      'drawCard': function(id, box, container = null,  redrawAll=1) {
          if(!(box.type in this.model.cards)) {
            throw Error(box.type+ ' not found')
          }
          var crd= this.model.cards[box.type];
          
          var x2 = (box.is==='loc')?'-xs':'', color = crd.bg, dashed = crd.dashed;

          var icon = crd.icon+ " b-clr i-clr3 "+ crd.icon;
          
          var title = (box.is==='loc')? box.name:box.type;
          var topRight = (box.is==='loc') ? box.loc: box.level;

        this.card[id] = r(container ? container: this.view.content)
            .container( (box.is==='loc'? 'mb-3':'m-2') + ' p-2 unlock bg-' + color + ' rounded box-shadow text-light bg-card'+x2+' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id':id})

            .container('fas fa-' + icon + ' fa-bgd'+x2+' fa-5x', 'div', '')
            .up()

            .container('tt', 'div', 'position:relative;top:0px;z-index:997')
            .container('pb-2 mb-0 h6-left', 'h6', 'float:left')
            .addText(title)
            .up()
            .container('pb-2 mb-0 h6-right', 'h6', 'float:right')
            .addText(topRight)
            .up()
            .up().el
        ;
        return this.card[id];
      },
      'updateLoc': function() {
        
      },
      'updateBox': function() {
        
      },
      'getLocPs': function(box) {
        return [box.pos,0,0,0];
      },
      'genLocs': function(lvl, p0= 0, p1= 0, p2= 0, p3= 0, forceAtPos=0, mergeLocsP = 0) {
        let rd = this.model.rand.rd;
        let pmap = gam2.model.loc.pmap;
        let seedLoc = this.model.rand.seed['loc'+lvl];
        let seedLocId = rd.hashCode(seedLoc+p0+'.'+p1+'.'+p2+'.'+p3, lvl);
        console.log(seedLocId);
        let rdChr =  this.model.rand.rdChr.bind(this.model.rand);
        let rdNam = this.model.rand.rdNam.bind(this.model.rand);
        let cstr = this.model.constr;
        rd.restartSeed(seedLocId);
        
        var pkeys;
        console.log('bf pk',p0,p1,p2,p3);
        if(p0 === 0) {
          pkeys = [0];
        } else if (p0> 0 && p1 ===0) {
          pkeys = [p0];
        } else if(p1 >0 && p2 ===0) {
          pkeys = [p0,p1];
        } else if (p2 >0 && p3 ===0) {
          pkeys = [p0,p1,p2];
        } else {
          pkeys = [p0,p1,p2,p3];
        }
        
        var pkey=pkeys.join('.');
        console.log('pkey '+pkey);
        if(pkey in pmap) {
          console.log('pmp ',pmap[pkey]);
          mergeLocsP= pmap[pkey];
        }

        const maxPos = lvl === 3? 3: 10;
        let cob, ccr;
        let types = [
          ['sun'],
          ['planet','asteroid-belt','gas-planet','ice-planet'],
          ['asteroid','moon'],
          ['asteroid-st','research-st','trade-st','storage-st']
        ];
        let type, posch=[],pops= [80,90,40, 40];
        if(forceAtPos) {
          posch.push(forceAtPos);
        }
        let pop = Math.round(maxPos*pops[lvl]/100)
        if(1) {
          var q=1,p=0;
          for(let i=0; i<pop; i++) {
            p= ((q+
              rd.rand(1, maxPos-i-1, seedLocId))
              %maxPos)+1;

            posch.push(p );
            q=p % maxPos;
          }
        }
        for(let pos = 1; pos <= maxPos; pos++ ) {
          type = 'empty';
          if(posch.includes(pos)) {
            type = types[lvl][rd.rand(0, types[lvl].length-1, seedLocId)];
          }
          cob = this.model.constr.addLoc(
            cstr.locProps(
              pos, type, lvl,
              type ==='empty'?'':(
              (lvl === 3) ?
              rdChr(seedLocId, 1, 0).toUpperCase() + rdChr(seedLocId, 0, 1)
              : rdNam(seedLocId)
              ))
          );
          if(mergeLocsP && (pos in mergeLocsP)) {
            cob.p= mergeLocsP[pos];
          }
          if(!ccr) {
            ccr= cob;
            continue;
          }
          ccr = ccr.nextObj(cob);
        }
        return ccr.first;
      },
      'showLocOptions': function(removedBox) {
        console.log(removedBox);
      },
      'testLocOptions': function (removedBox) {
        console.log(removedBox);
        var cr = this.model.loc.current;
        let rdChr =  this.model.rand.rdChr.bind(this.model.rand);
        let seedLoc = this.model.rand.seed.loc0;
        var ccr = cr;
        var cob;
        for(let pos = cr.p.pos; pos < 21; pos++ ) {
            if (cr.p.pos === pos) {
                continue;
            }
            cob = this.model.constr.addLoc(
                this.model.constr.locProps(pos, 'asteroid', cr.p.lvl, rdChr(seedLoc,1, 0).toUpperCase() +  rdChr(seedLoc,0, 1))
            );
            if (cob) {
                ccr = ccr.nextObj(cob);
            }
        }
        ccr = cr;
          for(let pos = cr.p.pos; pos > 0; pos-- ) {
              if (cr.p.pos === pos) {
                  continue;
              }
              cob = this.model.constr.addLoc(
                  this.model.constr.locProps(pos, 'asteroid', cr.p.lvl, rdChr(seedLoc,1, 0).toUpperCase() +  rdChr(seedLoc,0, 1))
              );
              if (cob) {
                  ccr = ccr.prevObj(cob);
              }
          }
        var p = gam2.model.constr.getPropList(cr.first,1,0);
        console.log(p);
        //r(this.view.locEnd).after();
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
          'storage-st': {
            'icon': 'ring fa-med',
            'bg': 'empty',
            'dashed': 1,
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
        'rand': {
            'rd': null,
            'rdChr': function (seed, letter = 1, number = 1) {
                return gam2.model.rand.rd.randomBytes(1, letter ? 3:0, number, 0, '', seed);
            },
            'rdNam': function(seed) {
                var rd = gam2.model.rand.rd;
                var suf = rd.pickOneFrom(['um', 'um', 'is', 'ix', 'us', 'ad', 'am'], 0, seed);
              // console.log(seed+' '+suf);
                return rd.randomName(rd.rand(3, 4, seed), 0, suf, 0, seed);
            },
            'seed': {
                'main': null
            },
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
                        'prevObj': function (obj) {
                            obj.next = this;
                            this.first = obj.first;
                            obj.firstParent = this.firstParent;
                            obj.parent = this.parent;
                            this.prev = obj;
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
                        'get': function(num) {
                          var c= this.first;
                          var i=1;
                          while (i < num) {
                            c = c.next;
                            i++;
                          }
                          return c;
                        }
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
            'locProps': function ( pos,type, lvl, name) {
                return {
                    card:'empty',
                  is:'loc',
                    pos: pos,
                    type: type,
                    lvl: lvl,
                    name: name,
                    loc: 'L' + lvl + ':' + ((pos< 10)? '0': '') + pos
                };
            },
            'addLoc': function (prop) {},
            'addSlot': function (prop) {},
            'addBox': function (prop) {},
            'walkList': function(obj, walkerCb, parentWalkInstead = 0) {
                if (typeof walkerCb !== 'function') {
                    throw "walker is not a function!";
                }
                let s;
                if(parentWalkInstead) {
                  s=obj;
                } else {
                  s=obj.first;
                }
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
    'action': {
        'loc': {
            'unlockLoc': function (el, box, plist) {
               // el.unbind('click');
               // var card = r(el).remove().el;
               
               var p0,p1,p2,p3;
               p0= box.lvl<=0?0:plist[0].pos;
               p1= box.lvl<=1?0:plist[1].pos;
               p2= box.lvl<=2?0:plist[2].pos;
               p3= box.lvl<=3?0:plist[3].pos;
               
              // [p0, p1, p2, p3] = gam2.view.getLocPs(box);
               console.log(p0,p1,p2,p3);
                
                var xr = gam2.view.genLocs(box.lvl,p0,p1,p2,p3);
                var p = gam2.model.constr.getPropList(xr.first,1,0);
                console.table(p);
        
                //gam2.view.showLocOptions(box);
            }
        }
    },
}



export { gam2 };