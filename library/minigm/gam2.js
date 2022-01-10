var ra;


$('document').ready(function () {

        if ('vs' in window) {

            vs.page('Gam2');

            ra = vs.clearBody()
                .section('top')
                .br()
                .addButton('Index', '/index.html')
                .container('topbar','div')
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

            vs.addSectionsToMain();
            gam2.init();
        }
    });
    
  var gam2 = {
        'money': 700000,
        'power': 500,
        'powerUsage': 30,
        'people':2,
        'peopleUsage':2,
        'res': [],
        'building': [],
        'util': [],
        'menu': [],
        'menuType': 0,
        'itemStates': {
            'pure': [{'bar': 2}, {'gas': 4}],
            'bar': [{'liquid': 2}, {'cube': 5}, {'plate': 2}, {'wire': 10}, {'rail': 100}],
            'plate': [{'gear': 1}, {'case': 10}, {'pipe': 2}, {'tube': 20}, {'lgear': 10}, {'bolt': 1}],
            'wire': [{'bobbin': 100}, {'spring': 5}, {'lbobbin': 1000}, {'ring': 2}, {'lring': 20}],
            'bobbin': [{'lbobbin': 10}],
            'liquid': {'barrel': 50},
            'gas': {'tank': 1000},
            'cube': {'dense': 500},
            'dense': {'max': 20},
            'barrel': [{'ltank': 100}, {'fuel': 10}],
        },
        'itemCrafts': {
            'lcase': {'plate': 20, 'liquid': 5, 'wire': 10},
            'dym': {'dense': 5, 'tank': 5},
            'vry': {'bar': 100, 'barrel': 50},
            'ccr': {'dym': 5},
            'dff': {'vry': 10, 'ccr': 20},
            'sup': {'dff': 2, 'dym': 10, 'tank': 100},
            'spr': {'tank': 2000, 'dym': 50, 'dense': 2000},
        },
        'itemRecepies': {
            'bell': [{'bar': 2}, {'cube': 2}],
            'trix': [{'barrel': 2}, {'gas': 10}, {'liquid': 5}],

        },
        'hum': {
            'val': function (val) {
                if (val <= 9000) {
                    return val;
                }
                var t = ['', 'k', 'm', 'b', 't', 'G', 'T'];//,'P','V','R','X','Z'];
                var i = 0;
                var v = val;
                while (v > 9000) {
                    v = Math.round(v / 1000);
                    i++;
                }
                ;
                return v + t[i];
            }
        },
        'slot': {
            'add': function () {
                var pub = {};
                pub = {
                    'item': null,
                    'form': null,
                    'amount': 0,
                    'unitValue': 0,
                    'addItem': function (item, form, amount = 0, unitValue = 0) {
                        pub.item = item;
                        pub.form = form;
                        pub.amount = amount;
                        pub.unitValue = unitValue;
                        return pub;
                    },
                    'add': function (amountAdd) {
                        this.amount += amountAdd;
                        return pub;
                    },
                    'drop': function () {
                        this.item = null;
                        this.form = null;
                        this.amount = 0;
                        this.unitValue = 0;
                        return pub;
                    },
                    'moveTo': function (slot, amount) {
                        pub.add(-amount);
                        slot.addItem(pub.item, pub.form, amount, pub.unitValue);
                    },
                    'next': null,
                    'prev': null,
                    'first': this,
                    'last': this,
                    'chain': function (slot) {
                        pub.findLastSlot().next = slot;
                        pub.last = slot;
                        slot.last = slot;
                        slot.first = pub.first;
                        return pub;
                    },
                    'findLastSlot': function () {
                        if (pub.next) {
                            pub.last = pub.next.findLastSlot();
                            return pub.last;
                        }
                        pub.last = pub;
                        return pub;
                    },
                    'findItemSlot': function (item, form) {
                        if (pub.item === item && pub.form === form) {
                            return pub;
                        }
                        if (!pub.next) {
                            return null;
                        }
                        return this.next.findItemSlot(item, form);
                    },
                    'findSlot4Item': function (item, form) {
                        var r = pub.first.findItemSlot(item, form);
                        if (r) {
                            return r;
                        }
                        return pub.first.findEmpty();
                    },
                    'findEmpty': function () {
                        return pub.findItemSlot(null, null);
                    }
                };
                return pub;
            },
        },
        'rd': {
            'seed': 'gam2.random~`!1@#7$4)2&50%*8(93^6',
            'r': {},
            'restart': function (seedId, d = 0) {
                var seedUsed = gam2.rd.seed + seedId;
                this.r.restartSeed(seedUsed);
                //console.log('restarted seed:' + seedUsed);
            },
            'getName': function (seedId) {
                var seedUsed = gam2.rd.seed + seedId;
                this.r.setSeed(seedUsed);
                var suf = this.r.randomBytes(0, 1) + this.r.pickOneFrom(['um', 'um', 'is', 'ix', 'us', 'ad', 'am'], 0);
                return this.r.randomName(this.r.rand(3, 4), 0, suf);
            },
        },
        'loc': {
            'add': function (name, type) {
                var pub;

                pub = {
                    'prop': {
                        'name': name,
                        'type': type,
                        'lvl': 0,
                        'pos': 0,
                        'cardType': 'empty',
                    },
                    'parent': null,
                    'child': null,
                    'next': null,
                    'prev': null,
                    'first': null,
                    'addChild': function (child) {
                        child.parent = this;
                        this.child = child;
                        return this;
                    },
                    'nextChild': function (child) {
                        child.prev = this;
                        child.first = this.first;
                        this.next = child;
                        return child;
                    },
                };
                pub.first = pub;
                return pub;
            },
            'orderListByProp': function(l, propName, isAsc = 1) {
             l = l.first;
              var propList = [];
              do {
                propList.push({
                  'p': propName,
                  'v': l.prop[propName],
                  'l': l,
                })
               if (!l.next) {
                 break;
                }
                l = l.next;
              } while (null !== l);
            
             propList.sort(function(a, b) {
                
                if (a.v === b.v) {
                  return 0;
                }

                var c = !isAsc ? a.v < b.v :
                  a.v > b.v;
                return c ? 1 : -1;
              });
             // console.table(propList);
              l = l.first;
              var p=null, op =null, f=null;
              for (var k in propList) {
                op = p;
                if(p===null) {
                  f = propList[k].l;
                }
                p = propList[k].l;
                p.prev = op;
                if(op) {
                op.next = p;
                }
                p.next = null;
                p.first = f;
                if(op) {
                op.first = f;
                }
              }
              return f;
            },
            'dbgLoc': function(l) {
              var s =l.first;
              if(!s) {
                console.log('No child here0');
                return 0;
              }
              do {
                console.log('> ', s.prop.name + '%'+ s.prop.pos);
                s = s.next;
              } while (s !== null);
              return 1;
            },
            'showLoc': function (child) {
                var start = child.first;
                if(!start) {
                    console.log('No child here');
                    return;
                }
                do {
                    //console.log('Now:', start.prop.name, start.prop.type, start.prop.pos);
                    this.showChild(start);
                    start = start.next;
                } while (start !== null);
            },
            'showChild': function (child) {
                if(!child) {
                    console.log('No child here');
                    return;
                }
              
                gam2.showCard('loc-' + child.prop.type + '-' + child.prop.name, child.prop.cardType,
                child.prop.icon, 1, child.prop.type, '',
                [], [], '-xs');
            },
            'addRandomChild': function (L, r, bg=0,t, lvl, loc, types = ['empty'], icon  = ['empty'], seenAs = ['empty']) {
                var type= types[t];
                var child = gam2.loc.add(loc, type);

                if(L === null ) {
                    L = child;
                } else {
                    L = L.nextChild(child);
                }

                if (type !== 'sun') {
                  if(bg) {
                    L.prop.icon = icon[t] + ' b-clr' + (r % 4) + ' i-'+type;
                  } else {
                    L.prop.icon = icon[t] + ' i-clr' + (r % 4);
                    
                  }
                } else {
                    L.prop.icon = icon[t] + ' i-'+ type;
                }
                L.prop.cardType = seenAs[t % seenAs.length];
                L.prop.pos = r+t + lvl * 1000;
                L.prop.lvl = lvl;
                
                return L;
            },
            'addChildsFor': function(Loc, rand) {
              
            },
            'init': function () {
                //L = gam2.loc.init(); gam2.loc.showLoc(L)
                var imax = gam2.rd.r.rand(10,40);

                var types = ['planet','moon','asteroid','asteroid-belt'];
                var seenAs = ['empty'];
                var icon = ['adjust', 'moon fa-med', 'circle fa-sml', 'braille'];
                var t = 0, r = 0;
                
                var L = gam2.loc.add('L0:0', 'sun');
                L.prop.icon = 'sun i-sun';
                L.prop.cardType = 'empty';

                for(var i = 1; i< imax; i++) {
                    r = gam2.rd.r.rand(0,100);
                    t = gam2.rd.r.rand(0,100) % types.length;

                    L = gam2.loc.addRandomChild(L, r, 0, t, 1, 'L1:'+i, types, icon, seenAs);
                }

                var jmax = gam2.rd.r.rand(10,40);

                var types2 = ['research st.', 'storage st.', 'trade st.', 'asteroid st.', 'jump gate'];
                var seenAs2 = ['empty'];
                var icon2 = ['hockey-puck fa-med', 'memory  fa-med', 'toggle-on fa-med', 'cubes fa-med', 'circle-notch fa-med'];

                for(var j = 1; j< jmax; j++) {
                    r = gam2.rd.r.rand(0,100);
                    t = gam2.rd.r.rand(0,100) % types2.length;

                    L = gam2.loc.addRandomChild(L, r,0, t, 2, 'L2:'+j, types2, icon2, seenAs2);
                }

                var kmax = 10;
                var types3 = ['mountain', 'water', 'fields', 'ice', 'iceberg', 'crater', 'vulcano'];
                var seenAs3 = ['asmb', 'storage','power','smelter', 'power'];
                var icon3 = ['mountain fa-med', 'water', 'square', 'grip-lines', 'mountain fa-med', 'circle-notch', 'mountain fa-med'];

                for(var k = 0; k< kmax; k++) {
                    r = gam2.rd.r.rand(0,100);
                    t = gam2.rd.r.rand(0,100) % types3.length;

                    L = gam2.loc.addRandomChild(L, r, 1, t, 3, 'L3:'+k, types3, icon3, seenAs3);
                }
                
                L = gam2.loc.orderListByProp(L.first,'pos',1);
                //gam2.loc.dbgLoc(L);
                gam2.loc.showLoc(L);
                return L;
            }
        },
        'card': {},
        'resTick': function() {
          for (let r in gam2.res) {
            var box = gam2.res[r];
            gam2.actions.mine(box);
            gam2.clearCard('res'+r);
            gam2.showResCard(r);
          }
        },
        'utilTick': function() {
          for (let u in gam2.util) {
            var box = gam2.util[r];
            
            gam2.clearCard('util' + r);
       //     gam2.showUtilCard(r);
          }
        },
        'vs': {
            'opt': {},
            'iddfn': {},
            'dropDown': function (btn, box) {
                //var btn= $(btn);
                //console.log(btn);
                $(btn).after($('<div>').html('test'));

                /*
                vs.from('dropdn', btn)
                  .br()
                  .addText('sdff');*/
            },
            'addOptionsFor': function (idd, opts, fn) {
                this.opt[idd] = opts;
                this.iddfn[idd] = fn;
            },
            'showOptionsFor': function (idd, box, ra) {
                if (!(idd in this.opt)) {
                    return;
                }
                for (var i in this.opt[idd]) {
                    this.boxOpt(ra, this.opt[idd][i], i, idd, box);
                }
            },
            'clearOptionsFor': function (idd) {
                delete this.opt[idd];
                delete this.iddfn[idd];
            },
            'selectOption': function (idd, opt, box) {
                this.iddfn[idd].apply(gam2, [idd, opt, box]);
            },
            'boxOpt': function (ra, opt, i, idd, box) {

                var ra0 = ra.container('m-2 p-2 bg-black rounded box-shadow text-light', 'div', 'float:left;width:170px; height: 170px; border: 1px solid #fff; border-style: dashed; border-width: 1px;;')
                    .container('border-bottom border-gray pb-2 mb-0', 'h6')
                    .addText('Option ' + (parseInt(i) + 1))
                    .up()
                    .container('media text-white pt-2')
                    .container('media-body ml-2 mb-0 small lh-125', 'p')
                    .container('d-block text-light', 'strong')
                    .addText(opt.text)
                    .up()
                    .addText(opt.description)
                    .br()
                    .br();

                ra0.addButton('Select',
                    (function (i, j, w) {
                        return function () {
                            gam2.vs.selectOption(i, j, w)
                        };
                    })(idd, opt, box),
                    'btn-light button'
                )
            }
        },
        'addUtil': function(to, type, level=1, levelCost=100) {
          // landing pad
          // miner
          // mine pit
          // crane/ robotic arm
          // trade station
          // shipyard
          // transporter
          // cargo ship
          // docker
          // research center
          // research lab
          // communication relay
          // antenna 
          // radar
          // jump gate
          // hangar
          // depot
          // factory
          // asteroid station
          // research station
          // dwellings
          // galaxy region
          // cluster
          // solar system
          // sun
          // planet
          // moon
          // asteroids belt
          // asteroid
          // pump jack
          // oxigenator
          // oil refinary
          // chemical plant

        // shipyard
        // transporter
        // cargo ship
        // ship
        // jump gate
        // communication relay
        // trade station
        // asteroid station
        // research station
        // storage station
          
          to.push({
            title: type,
            level: level,
            levelCost: levelCost,
          });
        },
        'addRes': function (to, name, form = 'pure', amount = 0, unitValue = 0, lvl = 0) {
            to.push({
                title: 'Resource',
                name: name,
                description: 'Asteroid resource',
                level: 1,
                amount: amount,
                unitValue: unitValue,
                slot: gam2.slot.add().addItem(name, form, amount, unitValue),
                cost: 1500,
                powerUsage: 15,
                peopleUsage: 1,
                levelCost: 500,
                color: 'dark',
                repaint:0,
            });
        },
        'addDwelling': function (to, name, usage =0) {
          to.push({
            title: 'Dwelling',
            name: name,
            description: 'Dwellings for employees',
            level: 1,
            cost: 10000,
            powerCost: 4,
            peopleUsage: 0,
            levelCost: 500,
            usage: usage,
            capacity:5,
            powerUsage: 0,
            peopleUsage: 0,
            everySec: 10,
            timer: 0,
            color:'power',
            repaint:0,
          });
        },
        'addCraft': function (to, name, resMax = 1, ques = 1) {
            to.push({
                title: 'Crafter',
                name: name,
                description: 'Craft items',
                resMax: resMax,
                queues: ques,
                recepie: 0,
                slot: gam2.slot.add(),
                amount: 0,
                unitValue: 0,
                everySec: 3,
                timer:0,
                cost: 5000,
                powerUsage: 15,
                peopleUsage: 3,
                level: 1,
                levelCost: 100,
                color: 'crafter',
                repaint:0,
            });
        },
        'addAsmb': function (to, name, resMax = 2, ques = 1) {
            to.push({
                title: 'Assambler',
                name: name,
                description: 'Assamble items',
                resMax: resMax,
                queues: ques,
                cost: 10000,
                powerUsage: 5,
                peopleUsage: 4,
                level: 1,
                levelCost: 2000,
                color: 'asmb',
                repaint:0,
            });
        },
        'addSmelt': function (to, name, ques = 1) {
            to.push({
                title: 'Smelter',
                name: name,
                description: 'Smelt items',
                queues: ques,
                resource: 0,
                slot: gam2.slot.add(),
                amount: 0,
                unitValue: 0,
                everySec: 2,
                timer:0,
                cost: 2500,
                powerUsage: 10,
                peopleUsage: 2,
                level: 1,
                levelCost: 100,
                color: 'smelter',
                repaint:0,
            });
        },
        'addPower': function (to, name, lvl = 1) {
            to.push({
                title: 'Power',
                name: name,
                description: 'Adds power to the grid',
                level: 1,
                generated: 0,
                max: 5,
                cost: 1500,
                powerUsage: 0,
                peopleUsage: 1,
                levelCost: 200,
                color: 'power',
                repaint:0,
            });
        },

        'addSilo': function (to, name, slots = 1, max = 150) {
            to.push({
                title: 'Silo',
                name: name,
                description: 'Silo for resources',
                slots: new Array(slots),
                max: max,
                level: 1,
                cost: 650,
                powerUsage: 3,
                peopleUsage: 1,
                levelCost: 100,
                color: 'silo',
                repaint:0,
            });
        },
        'addStorage': function (to, name, slots = 5, max = 100) {
            to.push({
                title: 'Storage',
                name: name,
                description: 'Storage for items',
                slot: {},
                slotsMax: slots,
                cargo: 0,
                cargoMax: max,
                level: 1,
                cost: 500,
                powerUsage: 5,
                peopleUsage: 4,
                levelCost: 250,
                color: 'storage',
                repaint:0,
                page: 1,
                pageMax: Math.ceil(slots / 3),
            });
        },
        'addMenu': function (name) {
            if (name === 'util') {
                this.addPower(this.menu, 'Power 1');
                this.addSmelt(this.menu, 'Smelter 1');
                this.addCraft(this.menu, 'Crafter 1');
                this.addStorage(this.menu, 'Storage 1');
                this.addSilo(this.menu, 'Silo 1')
                this.addAsmb(this.menu, 'Assambler 1');
                this.addDwelling(this.menu, 'dw', 2);
            

            } else if (name === 'res') {
                var seedId = 'name' + gam2.res.length;
                this.rd.restart(seedId, 1);
                this.addRes(this.menu, this.rd.getName(seedId), 'pure', 0, 2 + 4 * gam2.res.length);
                this.addRes(this.menu, this.rd.getName(seedId), 'pure', 0, 2 + 4 * (gam2.res.length + 1));

            }
            this.menuType = name;
        },
        'init': function (seed = 512) {
            var seedHash = rd.hashCode(gam2.rd.seed + seed);

            this.rd.r = rd.sessionWithSeed(seedHash);

            var seedId = 'name' + gam2.res.length;
            this.rd.restart(seedId, 1);
            this.addRes(this.res, this.rd.getName(seedId), 'pure', 10, 5, 2);

            this.addRes(this.res, this.rd.getName(seedId), 'pure', 25, 10, 2);
            this.addDwelling(this.util, 'dw', 2)
            this.show();
            this.initEvents();
        },
        'initEvents': function () {
          //var L = gam2.loc.init();
          setInterval(this.event.everySec, 1000);
        },
        'event': {
            'tim': {},
            'everySec1': function() {
              gam2.resTick()
              gam2.utilTick()
            },
            'everySec': function () {
                for (let r in gam2.res) {
                    var box = gam2.res[r];
                    gam2.actions.mine(box);
                    box.repaint = 1;
                }
                for (let u in gam2.util) {
                    var box = gam2.util[u];
                    if (box && box.everySec) {
                        if (!('util' + u in gam2.event.tim)) {
                            gam2.event.tim['util' + u] = 0;
                        }
                            
                        gam2.event.tim['util' + u]++;
                        box.timer = gam2.event.tim['util' + u];
                        
                        if (gam2.event.tim['util' + u] !== box.everySec) {
                            continue;
                        }
                        gam2.event.tim['util' + u] = 0;
                        box.timer = gam2.event.tim['util' + u];
                        

                        var maxAmount = 0;
                        var boxSrc;
                        if (box.title == 'Smelter') {
                            if (!box.resource) {
                                continue;
                            }
                            //console.log(box.source)
                            //continue;
                            boxSrc = gam2[box.source[0]][box.source[1]];
                            maxAmount = box.level > boxSrc.slot.amount ? boxSrc.slot.amount : box.level;
                            boxSrc.slot.amount -= maxAmount;
                            box.slot.amount += maxAmount;
                            box.repaint = 1;
                        } else if (box.title == 'Crafter') {
                            if (!box.recepie) {
                                continue;
                            }
                            boxSrc = gam2[box.source[0]][box.source[1]];
                            maxAmount = box.level > boxSrc.slot.amount ? boxSrc.slot.amount : box.level;
                            boxSrc.slot.amount -= maxAmount;
                            if (box.dest) {
                                var bbox = gam2[box.dest[0]][box.dest[1]];
                                var name = boxSrc.recepie +' ' + boxSrc.slot.form;
                                if(!(name in bbox.slot)) {
                                  bbox.slot[boxSrc.recepie] = gam2.slot.add().addItem(boxSrc.slot.name, boxSrc.slot.form, 0, boxSrc.slot.unitValue)
                                }
                                bbox.slot[boxSrc.recepie].amount += maxAmount;

                            } else {
                                box.slot.amount += maxAmount;
                            }
                            box.repaint = 1;
                        } else if (box.title == 'Dwelling') {
                          if (box.capacity > box.usage) {
                            box.usage++;
                            gam2.people++;
                            
                           // gam2.card['util'+u].addText()clear();
                           //var tikk= $('#util'+u).find('.tik').get(0);
                          // tikk.parent()
                              box.repaint = 1;
                          }
                        }
                    }
                }
                //gam2.actions.repaint();
               // gam2.actions.show(1);
                gam2.show(1);
            }
        },
        'actions': {
            'repaint': function () {
                var box;
                for(var r in gam2.res) {
                    box = gam2.res[r];
                    if (!box.repaint) {
                        continue;
                    }
                    gam2.card['res' + r].clear();
                }
                for(var u in gam2.util) {
                    box = gam2.util[u];
                    if (!box.repaint) {
                        continue;
                    }
                    gam2.card['util' + u].clear();
                }
            },
            'show': function (refresh=0) {
              if(refresh) {
                for(var c in gam2.card) {
                  gam2.clearCard(c);
                }
                return;
              }
                ra.clear();
                gam2.show();
            },
            'mine': function (box) {
                box.slot.add(box.level);
            },
            'sell': function (box, amount = -1, show = 1) {
                amount = amount < 0 ? box.slot.amount : amount;
                if (amount > box.slot.amount) {
                    return;
                }

                box.slot.add(-amount);

                gam2.money += box.unitValue * amount;

                console.log('Sold ' + amount + ' ' + box.slot.item + ' ' + (box.slot.form !== 'pure' ? box.slot.form : ''));

                if (show) {
                   // ra.clear();
                    //gam2.show();
                    //box.repaint=1;
                    //gam2.repaintUtil.res();
                }
            },
            'search': function () {
                gam2.addMenu('res');
                ra.clear();
                gam2.show();
            },
            'build': function () {
                gam2.addMenu('util');
                ra.clear();
                gam2.show();
            },
            'cancel': function () {
                gam2.menu = [];
                gam2.menuType = 0;
                ra.clear();
                gam2.show();
            },
            'selectMenu': function (to, box) {
                to.push(box);
                gam2.money -= box.cost;
                gam2.powerUsage += box.powerUsage;
                gam2.peopleUsage += box.peopleUsage;
                if(box.title === 'Dwelling') {
                  gam2.people+= box.usage;
                }
                //console.log(util)
                gam2.menu = [];
                gam2.menuType = 0;
                ra.clear();
                gam2.show();
            },
            'powerOn': function (box) {
                box.generated = box.level * 5;
                gam2.power += box.generated;
                ra.clear();
                gam2.show();
            },
            'powerOff': function (box) {
                gam2.power -= box.generated;
                box.generated = 0;

                ra.clear();
                gam2.show();
            },
            'levelUp': function (box) {
                gam2.money -= box.levelCost;
                box.level++;
                box.levelCost += Math.round(box.levelCost * 1.5);
                ra.clear();
                gam2.show();
            },
            'smelterSell': function (m, box) {
                var amount = box.slot.amount;
                gam2.money += box.slot.unitValue * amount;
                box.slot.amount = 0;
                //console.log('sell' + resId + ' ' +  amount);
                if (1) {
                    ra.clear();
                    gam2.show();
                }
            },
            'smelterResource': function (idd, box) {
                //console.log(box)
                if (!(idd in gam2.vs.opt)) {
                    var options = [];
                    for (var i in gam2.res) {
                        options.push({
                            'text': 'Out: ' + gam2.res[i].name + ' bar',
                            'description': 'In: ' + gam2.res[i].name,
                            'src': 'res',
                            'id': i,
                        });
                    }
                    gam2.vs.addOptionsFor(idd, options, gam2.actions.smelterResourceSelect);
                } else {
                    gam2.vs.clearOptionsFor(idd);
                }
                ra.clear();
                gam2.show();

            },
            'smelterResourceSelect': function (idd, opt, box) {
                //console.log('option:'+ i, box);
                var i = opt.id;
                box.resource = gam2.res[i].name;
                box.slot.addItem(box.resource, 'bar', 0, gam2.res[i].unitValue * 10)
                //box.slamount = 0;
               // box.unitValue = gam2.res[i].unitValue * 10;
                box.source = [opt.src, i];

                gam2.vs.clearOptionsFor(idd);
                ra.clear();
                gam2.show();

            },
            'crafterSell': function (m, box) {
                var amount = box.slot.amount;
                gam2.money += box.slot.unitValue * amount;
                box.slot.amount = 0;
                //console.log('sell' + resId + ' ' +  amount);
                if (1) {
                    ra.clear();
                    gam2.show();
                }
            },
            'crafterRecepie': function (idd, box) {
                //console.log(box)
                var outOpts = [];
                if (!(idd in gam2.vs.opt)) {
                    var options = [];
                    for (var i in gam2.util) {
                        var b = gam2.util[i];

                        if (b.title === 'Smelter') {
                            if (!b.resource) {
                                continue;
                            }
                            options.push({
                                'text': 'Out: ' + b.resource + ' liquid',
                                'description': 'In: ' + b.name + ' bar',
                                'src': 'util',
                                'id': i,
                            });
                        } else if (b.title === 'Crafter' && idd !== 'util' + i) {
                            if (!b.recepie) {
                                continue;
                            }
                            console.log('b' + 'util' + i + ' ' + idd);
                            options.push({
                                'text': 'Out: ' + b.recepie + ' barrel',
                                'description': 'In: ' + b.recepie + 'x2',
                                'src': 'util',
                                'id': i,
                            });
                        } else if (b.title === 'Storage') {
                            //continue;
                            if (!box.recepie) {
                                continue;
                            }
                            if (b.slotsMax > Object.keys(b.slot).length) {
                                options.push({
                                    'text': 'To: ' + b.title + '(' + b.level + ')',
                                    'description': 'Store to storage',
                                    'dest': 'util',
                                    'id': i,
                                    'item': box.slot.name+ ' ' + box.slot.form,
                                    'unitValue': box.slot.unitValue,
                                });
                                console.log('testt');
                            }
                        }
                    }
                    //options.concat(outOpts);
                    gam2.vs.addOptionsFor(idd, options, gam2.actions.crafterRecepieSelect);

                } else {
                    gam2.vs.clearOptionsFor(idd);
                }
                ra.clear();
                gam2.show();
            },
            'crafterRecepieSelect': function (idd, opt, box) {
                var i = opt.id;
                console.log('option:' + i);
                if (opt.dest) {
                    box.dest = [opt.dest, i];
                    var bbox = gam2[opt.dest][i];
                    if (!(opt.item in bbox.slot)) {
                        
                        bbox.slot[opt.item] = gam2.slot.add()
                        .addItem(box.slot.name, box.slot.form, 0, box.slot.unitValue)
                        
                    }
                    //gam2.actions.store(opt.item)
                } else {
                    var slot = gam2[opt.src][i].slot;
                    box.recepie = slot.item;
                    box.slot.addItem(box.recepie, 'liquid', 0, slot.unitValue * 10)
                  
                    //box.unitValue = gam2[opt.src][i].unitValue * 10;
                    box.source = [opt.src, i];
                }

                gam2.vs.clearOptionsFor(idd);
                ra.clear();
                gam2.show();
            },
            'storagePage': function (box) {
                box.page++;
                if (box.page > box.pageMax) {
                    box.page = 1;
                }
                ra.clear();
                gam2.show();
            }
        },
        'showResCard': function(idx) {
          var ra5= gam2.card['res'+idx];
          
          var box= gam2.res[idx];
          var buttons= [], texts= [];
          var title = box.title +' '+ box.level;
          var head= box.name;
          
          //ra5.up().addText('ghdgghgg');
          
          ra5.container('border-bottom border-gray pb-2 mb-0', 'h6')
                .addText(title)
                .up()
                .container('media text-white pt-2')
                .container('media-body ml-2 mb-0 small lh-125', 'p')
                .container('d-block text-light', 'strong')
                .addText(head)
                .up();
            while (texts.length < 3) {
                texts.push(0);
            }
            for (var t in texts) {
                if (texts[t]) {
                    ra5.addText(texts[t]);
                }
                ra5.br();
            }

            for (var b in buttons) {
                var bt = buttons[b];
                ra5.addButton(bt[0], bt[1], 'button ' + bt[2]);
            }

        },
        'repaintCard': function(rca, title='', head='', texts = [], buttons = []) {
            rca = rca
                //.container('', 'div', 'position:relative;top:0px;z-index:997')
               // .container('border-bot4tom bor4der-gray pb-2 mb-0', 'h6')
                .addText(title)
                .up()
                .container('media text-white pt-2')
                .container('media-body ml-2 mb-0 small lh-125', 'p')
                .container('d-block text-light', 'strong')
                .addText(head)
                .up();
              while (texts.length < 3) {
                texts.push(0);
              }
              for (var t in texts) {
                if (texts[t]) {
                  rca.addText(texts[t]);
                }
                rca.br();
              }
          
              for (var b in buttons) {
                var bt = buttons[b];
                rca.addButton(bt[0], bt[1], 'button ' + bt[2]);
              }
              return rca;
        },
        'showCard': function (id, color = 'black', icon = 'asterisk', dashed = 0, title = '$', head = 'Money', texts = [], buttons = [],x2='') {
            if (head === '') {
                head = '&nbsp;';
            }

            var ra3 = ra
                .container('m-2 p-2 bg-' + color + ' rounded box-shadow text-light bg-card'+x2+' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id':id})

                .container('fas fa-' + icon + ' fa-bgd'+x2+' fa-5x', 'div', '')
                .up()

                .container('tt', 'div', 'position:relative;top:0px;z-index:997')
                .container('border-bot4tom bor4der-gray pb-2 mb-0', 'h6')
                ;
            
            ra3=this.repaintCard(ra3, title, head, texts, buttons);
            gam2.card[id]=ra3;

            return ra3;
        },
        'clearCard': function(id) {
          var ra4= gam2.card[id];
          ra4.parent().parent().clear();
        },
        'repaintUtil': {
          'res': function(r, btns=0) {
            var box = gam2.res[r];
            
            if(!btns) {
              btns = [];
              if (box.title === 'Resource') {
                btns.push(['Sell 1', (function(b,r) {
                  return function() {
                    gam2.actions.sell(b, 1);
                    gam2.repaintUtil.res(r);
                  };
                })(box,r), 'btn-warning button']);
                btns.push(['Sell *', (function(b,r) {
                  return function() {
                    gam2.actions.sell(b);
                    gam2.repaintUtil.res(r);
                  };
                })(box,r), 'btn-danger button']);
                if (gam2.money > box.levelCost) {
                  btns.push(['Lvl up',
                                          (function(box,r) {
                      return function() {
                        gam2.actions.levelUp(box);
                        gam2.repaintUtil.res(r);
                      };
                    })(box,r),
                  'btn-success button']);
                }
              }
            }
            
                    gam2.card['res' + r] =
                    gam2.card['res' + r]
                      .parent(1)
                      .parent(1)
                      .clear()
                      .container('tt', 'div', 'position:relative;top:0px;z-index:997')
                      .container('border-bot4tom bor4der-gray pb-2 mb-0', 'h6');
                      
                    gam2.card['res'+r] = 
                    gam2.repaintCard(gam2.card['res'+r], box.title + ' ' + box.level, box.name,
                        [
                            'Amount: ' + box.slot.amount + ' $' + gam2.hum.val(box.slot.unitValue * box.slot.amount),
                            'Level: ' + box.level + ' ($' + gam2.hum.val(box.levelCost) + ')',
                        ], btns).container('tik', 'div').up();
                    
          },
        },
        'show': function (repaint = 0) {
            var box;
            /*
            this.showCard('money', 'money', '', 0, '$', 'Money', [
                'Amount: $' + this.hum.val(this.money),
                'Power: ' + this.powerUsage + ' / ' + this.power
            ]);*/
            
          if(!repaint) {
              $('.s-money').html( this.hum.val(this.money))
              $('.s-power').html( this.hum.val(this.powerUsage) +' / '+ this.hum.val(this.power))
              $('.s-people').html( this.hum.val(this.peopleUsage) +' / '+ this.hum.val(this.people))
            
              this.showCard('ship', 'ship', 'paper-plane i-empty', 0, 'Ship','');
              this.showCard('miner', 'crafter', 'qrcode i-crafter', 0, 'Miner','');
            
            
            for(var r=0; r<1; r++) {
              this.showCard('empty0', 'empty', 'plus i-empty', 1, 'Empty', '', ['', '', ''], [
                ['Build', false, 'btn-dark button']
              ]);
            }
          }

            for (var r in this.res) {
                box = this.res[r];
                var btns = [];
                if (box.title === 'Resource') {
                    btns.push(['Sell 1', (function (b,r) {
                        return function () {
                            gam2.actions.sell(b, 1);
                            gam2.repaintUtil.res(r);
                        };
                    })(box,r), 'btn-warning button']);
                    btns.push(['Sell *', (function (b,r) {
                        return function () {
                            gam2.actions.sell(b);
                            gam2.repaintUtil.res(r);
                        };
                    })(box,r), 'btn-danger button']);
                    if (gam2.money > box.levelCost) {
                        btns.push(['Lvl up',
                            (function (box,r) {
                                return function () {
                                    gam2.actions.levelUp(box);
                                    gam2.repaintUtil.res(r);
                                };
                            })(box,r),
                            'btn-success button']);
                    }
                }
                if (repaint && box.repaint) {
                    box.repaint = 0;
                    gam2.repaintUtil.res(r, btns);
                    continue;
                }
                box.vs = this.showCard(
                    'res' + r,
                    box.color, 'asterisk i-resource anim-res', 0,
                    box.title + ' ' + box.level, box.name,
                    [
                        'Amount: ' + box.slot.amount + ' $' + gam2.hum.val(box.slot.unitValue * box.slot.amount),
                        'Level: ' + box.level + ' ($' + gam2.hum.val(box.levelCost) + ')',
                    ], btns
                ).container('tik', 'div');
                //gam2.res[1].vs.parent().parent().parent().parent().clear()
            }
            
            if(repaint) {
              return;
            }

            var card = 0, x2='',tikSec = 0, tikDelay= 0, title = '', icon = '', head = '', texts = [], btns = [];

            for (var m in this.util) {
                card = 0;
                tikSec = 0;
                title = '';
                tikDelay =0;
                icon = '';
                head = '';
                texts = [];
                btns = [];
                x2='';

                box = this.util[m];
                
                if(box.timer) {
                  tikDelay = -box.timer;
                }

                if (box.title === 'Smelter') {
                    card = 1;
                    title = box.title + ' ' + box.level;
                    icon = 'burn anim-smelter i-smelter';

                    if (box.resource) {
                        head = 'Out: ' + box.resource + ' bar';
                        texts = [
                            'In: ' + box.resource,
                            'Amount: ' + box.slot.amount + ' $' + gam2.hum.val(box.slot.amount * box.slot.unitValue),
                            'Level: ' + box.level + ' (Next: $' + gam2.hum.val(box.levelCost) + ')'
                        ];
                    } else {
                        icon += ' anim-stop';
                        head = 'No resource';
                    }

                    btns = [['Select',
                        (function (m, box) {
                            return function (e) {
                                gam2.actions.smelterResource('util' + m, box)
                            };
                        })(m, box),
                        'btn-warning button'
                    ]];

                    if (box.resource) {
                        btns.push(['Sell *',
                            (function (m, box) {
                                return function () {
                                    gam2.actions.smelterSell(m, box)
                                };
                            })(m, box),
                            'btn-danger button']);
                    }

                    if (gam2.money > box.levelCost) {
                        btns.push(['Lvl up',
                            (function (box) {
                                return function () {
                                    gam2.actions.levelUp(box)
                                };
                            })(box),
                            'btn-success button']);
                    }

                    tikSec = 2;

                } else if (box.title === 'Crafter') {
                    card = 1;
                    title = box.title + ' ' + box.level;
                    icon = 'cog anim-res i-crafter';

                    if (box.recepie) {
                        head = 'Out: ' + box.recepie + ' '+box.slot.form;
                        texts = [
                            'In: ' + box.recepie + ' bar',
                            'Amount: ' + box.slot.amount + ' $' + gam2.hum.val(box.slot.amount * box.slot.unitValue),
                            'Level: ' + box.level + ' (Next: $' + gam2.hum.val(box.levelCost) + ')'
                        ];

                    } else {
                      icon+=' anim-stop'
                        head = 'No recepie';
                    }

                    btns = [['Select', (function (m, box) {
                        return function (e) {
                            gam2.actions.crafterRecepie('util' + m, box)
                        };
                    })(m, box), 'btn-warning button']];

                    if (box.recepie) {
                        btns.push(['Sell *', (function (m, box) {
                            return function () {
                                gam2.actions.crafterSell(m, box)
                            };
                        })(m, box), 'btn-danger button']);
                    }

                    if (gam2.money > box.levelCost) {
                        btns.push(['Lvl up', (function (box) {
                            return function () {
                                gam2.actions.levelUp(box)
                            };
                        })(box), 'btn-success button']);
                    }

                    tikSec = 3;

                } else if (box.title === 'Storage') {
                    card = 1;
                    title = box.title + ' ' + box.level;
                    icon = 'expand anim-storage i-storage anim-stop';
                    head = 'Page: ' + box.page + ' / ' + box.pageMax;
                    texts = [];

                    var s = 0;
                    var perPage = 3;
                    var pag = 1;
                    var b = 0;
                    for (var i in box.slot) {
                        s++;
                        if (pag == box.page) {
                            b++;
                            texts.push(box.slot[i].name +' '+box.slot[i].form + ': ' + box.slot[i].amount) //+ ' $' + gam2.hum.val(box.slot[i].amount * box.slot[i].unitValue));
                        }
                        pag = Math.floor(s / perPage) + 1;
                    }
                    if (s < box.slotsMax) {
                        for (var i = s; i < box.slotsMax; i++) {
                            s++;
                            if (pag == box.page) {
                                b++;
                                texts.push('s' + i + ': None');
                            }
                            pag = Math.floor(s / perPage) + 1;
                        }
                    }

                    btns = [
                        ['Page', (function (box) {
                            return function () {
                                gam2.actions.storagePage(box)
                            };
                        })(box), 'btn-light button'],
                        ['Sell X', false, 'btn-danger button'],
                        ['Lvl up', false, 'btn-success button'],
                    ];

                    tikSec = 5;
                } else if (box.title === 'Assambler') {
                  card=1;
                  title = box.title + ' ' + box.level;
                    icon = 'globe anim-asmb i-asmb anim-stop';
                    head = 'No recepie';
                    texts = [];
                    x2='';
                    tikSec=20;
                } else if (box.title === 'Dwelling') {
                 //   ra2.up().br().br().br().br()
                  //      .addButton('Lvl up', false, 'btn-success button')
                       // .addButton('Sell *', false, 'btn-warning button');
                       card = 1;
                       title = box.title + ' ' + box.level;
                       icon = 'cube anim-asmb i-asmb anim-stop';
                       head = 'Cap: ' + box.usage +' / '+ box.capacity;
                       texts = [
                         'Level: ' + box.level + ' (Next: $' + gam2.hum.val(box.levelCost) + ')'
                       ];
                       if (gam2.money > box.levelCost) {
                         btns.push(['Lvl up', (function(box) {
                             return function() {
                               box.capacity++;
                               gam2.actions.levelUp(box);
                              
                             };
                           })(box),
                                                   'btn-success button']);
                       }
                      // btns.push(['Lvl up', false, 'btn-success button'])
                       x2 = '';
                       
                    tikSec = 10;
                  //  tikDelay = - box.timer;
                
                } else if (box.title === 'Silo') {
                    ra2.up().br().br().br().br()
                        .addButton('Lvl up', false, 'btn-success button')
                        .addButton('Sell *', false, 'btn-warning button');

                    tikSec = 5;
                   // ra2.up().container('tik', 'div', 'animation-duration:5s');

                } else if (box.title === 'Power') {
                    card = 1;
                    title = box.title;
                    icon = 'bolt anim-storage i-storage anim-stop';
                    head = '';
                    texts = [
                        'Level: ' + box.level + ' (Next: $' + gam2.hum.val(box.levelCost) + ')',
                        'Generated: ' + box.generated + ' / ' + box.level * 5
                    ];

                    if (box.generated === 0) {
                        btns.push(['On', (function (box) {
                            return function () {
                                gam2.actions.powerOn(box)
                            };
                        })(box), 'btn-success button']);
                        if (gam2.money > box.levelCost) {
                            btns.push(['Lvl up', (function (box) {
                                return function () {
                                    gam2.actions.levelUp(box)
                                };
                            })(box), 'btn-success button']);
                        }
                    } else {
                        btns.push(['Off', (function (box) {
                            return function () {
                                gam2.actions.powerOff(box)
                            };
                        })(box), 'btn-success button']);
                    }
                    tikSec = 10;
                }

                if (card) {
                    var q = this.showCard('util' + m, box.color, icon, 0, title, head, texts, btns,x2);

                    if (tikSec) {
                        q.container('tik', 'div', 'animation-duration:' + tikSec + 's; animation-delay: '+ tikDelay +'s');
                    }
                }

                this.vs.showOptionsFor('util' + m, box, ra);
            }
            if (this.menu.length == 0) {
                ra.container('m-2 p-2 bg-darkcyan rounded box-shadow text-light', 'div', 'float:left;width:170px; height: 170px; border-style: dashed; border-width: 1px;')
                    .container('border-bottom border-gray pb-2 mb-0', 'h6')
                    .addText('+1 Resource')
                    .up()
                    .container('media text-white pt-2')
                    .container('media-body ml-2 mb-0 small lh-125', 'p')
                    .container('d-block text-light', 'strong')
                    .addText('Up for more?')
                    .up()
                    .br()
                    .br()
                    .br()
                    .addButton('Search', gam2.actions.search, 'btn-light button')
                ;

                ra.container('m-2 p-2 bg-util rounded box-shadow text-light', 'div', 'float:left;width:170px; height: 170px; border-style: dashed; border-width: 1px;')
                    .container('border-bottom border-gray pb-2 mb-0', 'h6')
                    .addText('+1 Utility')
                    .up()
                    .container('media text-white pt-2')
                    .container('media-body ml-2 mb-0 small lh-125', 'p')
                    .container('d-block text-light', 'strong')
                    .addText('Need an utility?')
                    .up()
                    .br()
                    .br()
                    .br()
                    .addButton('Build', gam2.actions.build, 'btn-light button')
                ;
            } else {
                var powerLeft = gam2.power - gam2.powerUsage;
                var peopleLeft = gam2.people - gam2.peopleUsage;
                
                for (var m in this.menu) {
                    box = this.menu[m];
                    var ra0 = ra.container('m-2 p-2 bg-black rounded box-shadow text-light', 'div', 'float:left;width:170px; height: 170px; border-style: dashed; border-width: 1px;')
                        .container('border-bottom border-gray pb-2 mb-0', 'h6')
                        .addText(box.title)
                        .up()
                        .container('media text-white pt-2')
                        .container('media-body ml-2 mb-0 small lh-125', 'p')
                        .container('d-block text-light', 'strong')
                        .addText(box.name)
                        .up()
                        .addText('Ppl cost:' + box.peopleUsage)
                        .br()
                        .addText('Cost: ' + box.cost)
                        .br()
                        .addText('Power Usage: ' + box.powerUsage)
                        .br();
                    if (gam2.money < box.cost) {
                        ra0
                            .container('d-block text-danger')
                            .addText('Low money:' + (gam2.hum.val(gam2.money - box.cost)));
                    } else if (peopleLeft < box.peopleUsage) {

                        ra0
                            .container('d-block text-danger')
                            .addText('Low people:' + (gam2.hum.val(peopleLeft - box.peopleUsage)));
                    
                    } else if (powerLeft < box.powerUsage) {

                        ra0
                            .container('d-block text-danger')
                            .addText('Low power:' + (gam2.hum.val(powerLeft - box.powerUsage)));
                    } else {
                        ra0.addButton('Select',
                            (function (to, w) {
                                return function () {
                                    gam2.actions.selectMenu(to, w)
                                };
                            })(gam2[gam2.menuType], box),
                            'btn-light button'
                        )
                        ;
                    }
                }
                ra.container('m-2 p-2 bg-back rounded box-shadow text-light', 'div', 'float:left;width:170px; height: 170px; border-style: dashed; border-width: 1px;')
                    .container('border-bottom border-gray pb-2 mb-0', 'h6')
                    .addText('Back')
                    .up()
                    .container('media text-white pt-2')
                    .container('media-body ml-2 mb-0 small lh-125', 'p')
                    .container('d-block text-light', 'strong')
                    .addText('Go to previous grid')
                    .up()
                    .br()
                    .br()
                    .br()
                    .addButton('Cancel', gam2.actions.cancel, 'btn-light button')
                ;
            }
        }
    };
export { gam2 };