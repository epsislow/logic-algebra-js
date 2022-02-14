import {DbStorageConstr} from "/library/modules/DbStorage.js";

let r = function(el) {
    return vs.from(el);
}

window.r = r;

 $('document').ready(function () {
   console.log('begin');

    if ('vs' in window) {
        vs.page('Gam2');

        var ra = vs.clearBody()
            .section('top')
            .br()
            .addButton('Index', '/index.html', 'button btn-info')
            .addButton('Cache', function () { gam2.mem.loadData(); }, 'button btn-success')
            .addButton('Load', function () { gam2.mem.loadSlot(); },'button btn-info')
            .addButton('Save', function () { gam2.mem.saveSlot(); }, 'button btn-danger')
            .addText(' ').el;

        vs.addSectionsToMain();
        gam2.start(ra, vs, rd);
        
    } else {
      console.log('no vs');
    }
});

var gam2 = {
    'dbStorage': {},
    'start': function (ra, vs, rand) {
        this.view.main = ra;
        this.view.vs = vs;

        gam2.dbStorage = DbStorageConstr('gam2db', 'gam2');
        gam2.dbStorage.storage.initIdxdb();

        const seed = this.model.rand.seed.root; //'gam2b5xBxhe$X54B8sd';
        this.model.rand.seed.main = rand.hashCode(seed + seed, 23131);
        let rd = rand.sessionWithSeed(rand.hashCode(seed + seed));

        this.model.rand.rd = rd;

        this.model.rand.seed.loc0 = rd.hashCode(seed + 'loc0', rd.rand(127, 65536));
        this.model.rand.seed.loc1 = rd.hashCode(seed + 'loc1', rd.rand(127, 65536));
        this.model.rand.seed.loc2 = rd.hashCode(seed + 'loc2', rd.rand(127, 65536));
        this.model.rand.seed.loc3 = rd.hashCode(seed + 'loc3', rd.rand(127, 65536));
        this.model.rand.seed.res = rd.hashCode(seed + 'res', rd.rand(127, 65536));
        //this.model.rand.seed.recepie = rd.hashCode(seed + 'recepie', rd.rand(127, 65536));
        this.model.rand.seed.box = rd.hashCode(seed + 'box', rd.rand(127, 65536));

        for(var i of ['init','model','view','action']) {
          this.init.parents.apply(gam2[i]);
        }
        this.model.constr.init();
        this.view.topBar = r(ra).container('topbar','div').el;
        
        this.init.topBar();
        this.view.content = r(ra).container('content','div').el;
        this.model.res.init();
        this.init.boot();
        this.view.draw();
        this.init.events();
        console.log(gam2.model.box.list);
    },
    'mem': {
        'currentSlot': 0,
        'saveSlot': function () {
            gam2.dbStorage.save(this.getData(0), 0, this.currentSlot);
        },
        'loadSlot': function () {
            gam2.dbStorage.load(function (data) { gam2.mem.loadData(JSON.stringify(data)); }, function (data) {return 0} , this.currentSlot);
        },
        'getData': function (asJSON = 1) {
            let cpos = gam2.model.loc.currentPos;
            let bx = gam2.model.box;
            let data = {'cpos': cpos, 'bxlist': {}, 'seeds': {}};
            data.seeds.root = gam2.model.rand.seed.root;
            for(let c in bx.list) {
              let plist = gam2.model.constr.getPropList(bx.list[c]);
              data.bxlist[c] = [];
              for(let i in plist) {
                data.bxlist[c].push(bx.toObj(plist[i]));
              }
            }
            data.coins = gam2.model.box.coins;
            //c = gam2.model.box.toObj(gam2.model.box.list['7.5.7.2'].p); JSON.stringify(c);
            //gam2.model.constr.getPropList(gam2.model.box.list[gam2.model.loc.currentPos], 1, 0);

            return asJSON? JSON.stringify(data): data;
        },
        'loadData': function (dataText = 0) {
          dataText = dataText? dataText:
              //"{\"cpos\":\"7.5.7.2\",\"bxlist\":{\"7.5.7.2\":[{\"type\":\"miner\",\"pos\":1,\"level\":1,\"levelCost\":1,\"levelCostFloat\":1,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"tickAmount\":1,\"maxTickAmount\":50,\"maxAmount\":100,\"outputId\":0,\"everySec\":0,\"slotOut\":[{\"posi\":-1,\"poso\":0,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"slotsOut\":1,\"to\":0,\"clearTik\":0},{\"type\":\"dwellings\",\"pos\":2,\"level\":2,\"levelCost\":100,\"levelCostFloat\":0,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":1,\"everySec\":15,\"capacity\":5,\"usage\":2},{\"type\":\"miner\",\"pos\":3,\"level\":1,\"levelCost\":1,\"levelCostFloat\":1,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"tickAmount\":1,\"maxTickAmount\":50,\"maxAmount\":100,\"outputId\":0,\"everySec\":0,\"slotOut\":[{\"posi\":-1,\"poso\":0,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"slotsOut\":1,\"to\":0,\"clearTik\":0},{\"type\":\"storage\",\"pos\":8,\"level\":1,\"levelCost\":3,\"levelCostFloat\":3,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"slots\":4,\"maxAmount\":250,\"slot\":[{\"posi\":0,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0},{\"posi\":1,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0},{\"posi\":2,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0},{\"posi\":3,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"clearTik\":0,\"tickPaint\":1},{\"type\":\"seller\",\"pos\":9,\"level\":1,\"levelCost\":10,\"levelCostFloat\":0,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"sloti\":36,\"slotsOut\":4,\"slot\":[{\"posi\":0,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}]},{\"type\":\"launch-pad\",\"pos\":10,\"level\":1,\"levelCost\":10,\"levelCostFloat\":0,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"pads\":2,\"pad\":{}}]},\"seeds\":{\"root\":\"gam2b5xBxhe$X54B8sd\"},\"coins\":{\"7.5.7.2\":{\"money\":2000000,\"ppl\":[4,20],\"power\":[5,50]}}}";
              "{\"cpos\":\"7.5.7.2\",\"bxlist\":{\"7.5.7.2\":[{\"type\":\"miner\",\"pos\":1,\"level\":20,\"levelCost\":524288,\"levelCostFloat\":524288,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":1,\"tickAmount\":20,\"maxTickAmount\":50,\"maxAmount\":19100,\"outputId\":14,\"everySec\":5,\"slotOut\":[{\"posi\":-1,\"poso\":0,\"item\":14,\"amount\":0,\"unitValue\":9,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"slotsOut\":1,\"to\":[\"7.5.7.2\",8],\"clearTik\":0},{\"type\":\"dwellings\",\"pos\":2,\"level\":4,\"levelCost\":100,\"levelCostFloat\":0,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":5,\"everySec\":15,\"capacity\":5,\"usage\":2},{\"type\":\"miner\",\"pos\":3,\"level\":21,\"levelCost\":1048576,\"levelCostFloat\":1048576,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":1,\"tickAmount\":21,\"maxTickAmount\":50,\"maxAmount\":20100,\"outputId\":14,\"everySec\":5,\"slotOut\":[{\"posi\":-1,\"poso\":0,\"item\":14,\"amount\":0,\"unitValue\":9,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"slotsOut\":1,\"to\":[\"7.5.7.2\",8],\"clearTik\":0},{\"type\":\"storage\",\"pos\":8,\"level\":9,\"levelCost\":19683,\"levelCostFloat\":19683,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"slots\":4,\"maxAmount\":2250,\"slot\":[{\"posi\":0,\"poso\":-1,\"item\":14,\"amount\":41,\"unitValue\":9,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0},{\"posi\":1,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0},{\"posi\":2,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0},{\"posi\":3,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"clearTik\":0,\"tickPaint\":1},{\"type\":\"seller\",\"pos\":9,\"level\":1,\"levelCost\":10,\"levelCostFloat\":0,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"sloti\":36,\"slotsOut\":4,\"slot\":[{\"posi\":0,\"poso\":-1,\"item\":0,\"amount\":0,\"unitValue\":0,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}]},{\"type\":\"launch-pad\",\"pos\":10,\"level\":1,\"levelCost\":10,\"levelCostFloat\":0,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":0,\"pads\":2,\"pad\":{}}]},\"seeds\":{\"root\":\"gam2b5xBxhe$X54B8sd\"},\"coins\":{\"7.5.7.2\":{\"money\":418216,\"ppl\":[4,20],\"power\":[5,50]}}}";

          let data= JSON.parse(dataText);
          let bx=gam2.model.box;
          let cs=gam2.model.constr;
          gam2.model.flags.loading = 1;

          if('coins' in data) {
              gam2.model.box.coins = {...data.coins};
          }
          if('seeds' in data) {
              gam2.model.rand.seed.root = data.seeds.root;
          }
          if('cpos' in data) {
              gam2.model.loc.currentPos = data.cpos;
          }

            gam2.model.box.list = {};
          if('bxlist' in data) {
            for(let c in data.bxlist) {
              if (!data.bxlist.hasOwnProperty(c)) {
                  continue;
              }
              for(let i in data.bxlist[c]) {
                  if (!data.bxlist[c].hasOwnProperty(i)) {
                      continue;
                  }
                  //console.log('i:',i);
                if(i==0) {
                    bx.list[c] = cs.addBox(bx.fromObj(data.bxlist[c][i]));
                } else {
                    bx.list[c] = bx.list[c].nextObj(
                    cs.addBox(bx.fromObj(data.bxlist[c][i]))
                  );
                }
              }
            }
          }
            gam2.model.flags.loading = 0;
            gam2.view.card = {}
            gam2.view.cardMenu = {};
            gam2.view.cardBox = {};
            gam2.view.cardOpt = {};
            gam2.view.content.html('');
            gam2.view.topBar.html('');

            /*
            let p = gam2.model.constr.getPropList(
                gam2.model.box.list[gam2.model.loc.currentPos]
                    .first.next.next.next.p.slot
            );
            console.log(p);
            */
            gam2.view.draw();
            //
            //gam2.model.constr.getPropList(gam2.model.box.list[gam2.model.loc.currentPos], 1, 0);
        },
        'loadBox': function () {
            let c = "{\"type\":\"miner\",\"pos\":1,\"level\":4,\"levelCost\":158,\"moneyCost\":0,\"peopleCost\":0,\"powerCost\":0,\"is\":\"box\",\"repaint\":0,\"timer\":1,\"tickAmount\":4,\"maxTickAmount\":50,\"maxAmount\":3100,\"outputId\":13,\"everySec\":5,\"slotOut\":[{\"posi\":-1,\"poso\":0,\"item\":13,\"amount\":201,\"unitValue\":8,\"form\":\"\",\"is\":\"slot\",\"requireAmount\":0}],\"slotsOut\":1,\"clearTik\":0}";

            let cpos = gam2.model.loc.currentPos;

            gam2.model.box.list[cpos].p = gam2.model.box.fromObj(JSON.parse(c));
            gam2.model.box.list[cpos].p.clearTik = 1;

            //gam2.model.box.fromObj(JSON.parse(c))
            gam2.view.drawBoxes();
        }
    },
    'init': {
        'parents': function () {
          this.view = gam2.view;
          this.model = gam2.model;
          this.action = gam2.action;
        },
        'events': function() {
          setInterval(gam2.action.everySec.bind(gam2.action), 1000);
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
         // console.log(p0+','+p1+','+p2+','+p3);
          
          gam2.model.loc.pmap = {
            0: {[p0]:locProps(p0, 'sun', 0, 'Icarus')},
            [[p0].join('.')]: {[p1]:locProps(p1, 'asteroid-belt', 1, 'Cloud Rupler',p0)},
            [[p0,p1].join('.')]: {[p2]: locProps(p2, 'asteroid', 2, 'Jadvis', p0+'.'+p1)},
            [[p0,p1,p2].join('.')]: {[p3]: locProps(p3, 'asteroid-st', 3, 'Balder', p0+'.'+p1+'.'+p2)},
          }
          
         // console.log(gam2.model.loc.pmap);

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
          //console.table(p);
          
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
            );
            
          this.model.loc.list = loc;
          cr = loc;
          this.model.loc.current = cr;
          this.model.loc.currentPos= [p0,p1,p2,p3].join('.');
        
          window.cr = cr;
         // console.log('cr', cr);
          
          var blist = this.model.constr.addBox(
              this.action.box.miner.defaults({type:'miner', pos:1}))
            .nextObj(
              this.model.constr.addBox({type:'dwellings', everySec: 15, pos:2, level:1, levelCost:100, capacity: 5, usage: 2})
            )
            .nextObj(
              this.model.constr.addBox(
                this.action.box.miner.defaults({ type: 'miner', pos: 3 })
              ) 
              //this.model.constr.addBox({type:'cargo', sloti:8, slots: 8, slot: {}, pos:3, level:1, levelCost: 10})
            )
            .nextObj(
              this.model.constr.addBox({type:'crafter', sloti:2, slots: 3, slotsOut:1, slot: {}, slotOut:{}, pos:4, level:3, levelCost: 10})
            )/*
            .nextObj(
              this.model.constr.addBox({ type: 'cargo', sloti: 24, slots: 8, slot: {}, pos: 5, level: 1, levelCost: 10 })
            )
            .nextObj(
              this.model.constr.addBox({ type: 'cargo', sloti: 36, slots: 8, slot: {}, pos: 6, level: 1, levelCost: 10 })
            )
            .nextObj(
              this.model.constr.addBox({ type: 'assembler', sloti: 2, slots: 2, slotsOut:1, slot: {}, pos: 7, level: 1, levelCost: 10 })
            )*/
              .nextObj(
                  this.model.constr.addBox( // { type: 'storage', sloti: 36, slots: 8, slot: {}, pos: 8, level: 1, levelCost: 10 })
                    this.action.box.storage.defaults({ type: 'storage', pos: 8 })
                  )
              ) 
              
              .nextObj(
                  this.model.constr.addBox({ type: 'seller', sloti: 36, slotsOut: 4, slot: {}, pos: 9, level: 1, levelCost: 10 })
              )
              .nextObj(
                  this.model.constr.addBox({ type: 'launch-pad', pads: 2, pad: {}, pos: 10, level: 1, levelCost: 10 })
              )

          var crkey = [p0,p1,p2,p3].join('.');
          
          
          this.model.box.list= {};
          
          this.model.box.list[crkey] = blist.first;
          
          p = gam2.model.constr.getPropList(cr, 1, 1);
          
          this.model.box.coins= {};
          this.model.box.coins[crkey] = {
            'money':100,
            'ppl':[4,20],
            'power':[5,50],
          }
          
          gam2.model.res.gen(105);
          gam2.model.reputation.genh(8);
          gam2.model.res.genRecepies();
          
          console.log(gam2.model.res.recepies);
        },
        'topBar': function (money=0,pplUsg=0,ppl=0,powerUsg=0,power=0) {
            if(!this.view.topBarVals && power===0) {
              return;
            }
            this.view.topBarVals = (power!==0);
            r(this.view.topBar)
                .clear()
                .addText(' ')

                .container('fa fa-donate','i')
                .up()
                .container('s-money','span')
                .addText(money)
                .up()

                .container('fa fa-plug','i')
                .up()
                .container('s-power','span')
                .addText(powerUsg+' / '+power)
                .up()

                .container('fa fa-child','i')
                .up()
                .container('s-people','span')
                .addText(pplUsg + ' / '+ ppl)
                .up()
                .up();
        }
    },
    'view':{
      'vs': null,
      'main': null,
      'topBar': null,
      'topBarVals': 0,
      'content': null,
      'locEnd': null,
      'card': {},
      'cardOpt': {},
      'cardBox': {},
      'cardMenu': {},
      'box': {
          'miner': {
              'paint': function (id, box, clear=0) {
                  let opt = {};
                  let act = gam2.action.box.miner;

                  let state = gam2.action.box.miner.state(box);

                  let btns = {}, btns2= {};

                  if(clear) {
                      btns.clr = 1;
                      btns.add = state.actions();
                      btns2.clr=1;
                      btns2.add = state.actions2();
                  } else {
                    btns.clr = 1;
                      btns.add = state.actions();
                      btns2.clr=1;
                      btns2.add = state.actions2();
                  
                      //btns.add = state.actionsUpdate();
                  }

                  opt.lvl = box.level;

                  opt.btns = btns;
                  opt.btns2= btns2;
                  let clearTikOpt = state.clearTikOpt();
                  if (clearTikOpt === 1) {
                      opt.tikUp = true;
                  }
                  if (clearTikOpt === -1) {
                      opt.tikUp = false;
                      opt.timerClear = 1;
                  }
                  // if (!clear && box.everySec) {
                  //     opt.tikUp = true;
                  //     opt.timerClear = 1;
                  // }
                  opt.content = state.content();

                  return opt;
              },
              'popupTo': function (box) {
                var cpos = gam2.model.loc.currentPos;
                
                gam2.action.popup(box, function(c, onClose, box){
                  let p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
                  if (!p.length) {
                    return;
                  }
                  
                  for (const i in p) {
                    if (!p.hasOwnProperty(i)) {
                      continue;
                    }
                    if(!('from' in p[i])) {
                      continue;
                    }
                    c = c.br()
                        .addButton('select', (function(box, cpos, pos) {
                          return function() {
                            gam2.action.box.miner.selectTo(box, cpos, pos);
                            onClose();
                          }
                        })(box, cpos, p[i].pos), 'button btn-success', {'style':'float: left'})

                        .container('','div','color:white')
                        .addText(p[i].type +' '+ p[i].level + ' P:'+ p[i].pos)
                        .up()
                        .br()
        
                  }
                })
              }
          },
          'dwellings':{
            'paint': function(id, box, clear = 0) {
              if(!clear) {
                return {timerClear:1};
              }
              //console.log(clear)
              return {
                lvl: box.level,
                timerClear: 1,
                btns: { clr: 1, addSpacer: 1 },
                content: [
                    {type: 'slot', res: 8, amount: 3, missing:1},
                  ],
              };
            }
          },
          'storage':{
            'paint': function(id, box, clear=0) {
              
              let opt = {};
              let act = gam2.action.box.storage;
              
              let state = gam2.action.box.storage.state(box);
              
              let btns = {}, btns2= {};
              
              if (clear) {
                btns.clr = 1;
                btns.add = state.actions();
                    btns2.clr=1;
                      btns2.add = state.actions2();
                  
              } else {
                //btns.add = state.actionsUpdate();
                
                btns.clr = 1;
                btns.add = state.actions();
                    btns2.clr=1;
                      btns2.add = state.actions2();
                  
              }
              
              opt.lvl = box.level;
              
              opt.btns = btns;
              opt.btns2 = btns2;
              
              let clearTikOpt = state.clearTikOpt();
              if (clearTikOpt === 1) {
                opt.tikUp = true;
              }
              
              if(clear) {
                opt.content = state.content();
              }
              
              return opt;
              /*
            return {
              lvl: box.level,
              timerClear: 1,
              btns: { clr: 1, addSpacer: 1 },
              content: [
                { type: 'slot', res: 20 + box.sloti, amount: 20 },
                { type: 'slot', res: 21 , amount: 20 },
                { type: 'slot', res: 22 + box.sloti, amount: 20 },
                { type: 'slot', res: 23 + box.sloti, amount: 20 },
                { type: 'slot', res: 24 + box.sloti, amount: 20 },
                { type: 'slot', res: 25 + box.sloti, amount: 20 },
                { type: 'slot', res: 26 + box.sloti, amount: 20 },
                { type: 'slot', res: 27 + box.sloti, amount: 20 },
              ],
            };*/
          }
          },
          'cargo': {
              'paint': function (id, box) {
                  var sl = gam2.model.constr.getPropList(box.slot);
                  var content=[];
                  for(let i=0; i<sl.length;i++) {
                    content.push(
                      {type: 'slot', res: 20+i+ box.sloti, amount: i},
                    );
                  }
                  
                  return {
                      lvl: box.level,
                      timerClear: 1,
                      btns:{clr: 1, addSpacer:1},
                      content:content,
                  };
              }
          },
          'launch-pad': {
              'paint': function (id, box) {
                  return {
                      btns:{clr: 1, addSpacer:1},
                      content: [
                          {type: 'pad', ship: 'airliner'},
                          {type: 'pad', ship: 'transporter'},
                      ],
                  };
              }
          },
          'crafter': {
            'paint': function(id, box) {
              return {
                lvl: box.level,
                btns: { clr: 1, 'add': [
                  ['Lvl up', (function(box) { return function() { gam2.action.lvlUp(box) } })(box), 'btn-success'],
                  ['Recepie', (function(box) { return function() { gam2.action.recepies(box) } })(box), (!box.recepie ? 'btn-light': 'btn-info')]
                ] },
                content: [
                  {type: 'slot', res: 20+ box.sloti, amount: 20},
                  {type: 'slot', res: 21+ box.sloti, amount: 20},
                  {type: 'br'},
                  { type: 'slot-out', res: 30 + box.sloti, amount: 20, missing: 1 },
                //  { type: 'br' },
                 // { type: 'text', text: 'Resource: ' + res[(30 + box.sloti) % res.length].name }
                                ],
              };
            }
          },
          
      },
      'draw':function() {
        this.drawLoc(1);
        this.drawBoxes(1);
      },
      'drawLoc': function() {
        var cr= this.model.loc.current;
        var divs = [
             r(this.view.content)
               .container('m-2 bg-card', 'div', '', 0, 1)
               .el,
             r(this.view.content)
               .container('m-2 bg-card', 'div', '', 0, 1)
               .el
        ].reverse();

        if(cr=== null) {
          return;
        }
        
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
                   containerDiv = 
                      divs[Math.floor(i/2)];
                      
                      /*r(this.view.content)
                       .container('m-2 bg-card', 'div', '',0, 0)
                       .el;*/
                   
               }
               el = this.drawCard('loc'+ i, p[i], containerDiv);

               el.click((function (el, bi, plist) {return function () { gam2.action.loc.unlockLoc(el, bi, plist); }})(el, i, p));
           }
           this.view.locEnd = divs[1];
       }
      },
      'paintTopBar': function(coins) {
        gam2.init.topBar(
          coins.money,
          coins.ppl[0], coins.ppl[1],
          coins.power[0], coins.power[1]
        )
      },
      'drawBox': function(box, paintAll = 0) {
          let id = 'b' + box.pos;
          if(paintAll) {
              this.drawCard(id, box);
          }
          this.paint(id, box,paintAll || box.repaint);
      },
      'drawBoxes': function(paintAll=0) {
        var cpos = gam2.model.loc.currentPos;

        if(!(cpos in gam2.model.box.list)) {
          return;
        }
        if(cpos in gam2.model.box.coins) {
          this.paintTopBar(gam2.model.box.coins[cpos])
        } else {
          gam2.init.topBar();
        }
        let p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
        if (!p.length) {
            return;
        }
        
        for (const i in p) {
            if(!p.hasOwnProperty(i)) {
                continue;
            }
            this.drawBox(p[i], paintAll);
        }
        
      },
      'drawCard': function(id, box, container = null, opt=0, wTikSec = 0, redrawAll=1) {
          if(!(box.type in this.model.cards)) {
            throw Error(box.type+ ' not found')
          }
          var crd= this.model.cards[box.type];
          
          var house =(box.is==='loc')?box.house:0;
          var x2 = (box.is==='loc' && !opt)?'-xs':'', color = crd.bg, dashed = crd.dashed;

//crd.icon = (box.type==='cargo')?'empty':'empty';
    //color='empty';
   // dashed=1;
var clr=(box.is==='loc')?3:5;
          var icon = crd.icon+ " b-clr i-clr"+clr+" "+ crd.icon;
          
          var title = (box.is==='loc')? box.name:box.type;
          var topRight = (box.is==='loc') ? box.loc: box.level;

          title = title.charAt(0).toUpperCase() + title.slice(1);

          var cel;

          cel = r(container ? container: this.view.content)
            .container( (box.is==='loc' &&! opt? 'mb-3':'m-2') + ' p-2 unlock bg-' + color + (opt?' option'+(box.locWithBuilds?'-bl':''):'')+' rounded box-shadow text-light bg-card'+x2+' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id':id})

            .container(box.is === 'box'? 'face front m-2': '','div')
            .container('fas fa-' + icon + ' fa-bgd'+x2+' fa-5x', 'div', '')
            .up()

            .container('tt', 'div', 'position:relative;top:0px;z-index:997')
            .container('top', 'div')
                .container('pb-0 mb-0 h6-left', 'h6', 'float:left')
                .addText(title)
                .up()

                .container('pb-0 mb-0 h6-right', 'h6', 'float:right')
                .addText(topRight)
                .up()
            .up();

          if (box.is === 'box') {
            
              cel = cel
                  .container('content', 'div')
                  .container('media text-white')
                  .container('media-body ml-2 mb-0 small lh-125', 'p')
                  .container('d-block text-light', 'strong')
                  .up();

              cel = cel
                  
                  .container('d-text', 'div','clear: both')
                  .br()
                  .br()
                  .br()
                  .up()
                  .up()
                  .up()
                  .up()
                  .container('btns', 'div')
                  .up()
                  .container('tik', 'div', !wTikSec ? 'animation:none': 'animation-duration:' + wTikSec + 's')
                  .up()
                  .container('timer','div', 'line-height: 14px')
                  .addText('')
                  .up()
          } else {
              cel = cel
                  .container('bottom' + x2, 'div')
                  .container('pb-2 mb-0 h6-left', 'h6', 'float:left')
                  .addText((!opt || x2 === '-xs') ? '' : box.type)
                  .up()
                  .container('pb-2 mb-0 h6-right', 'h6', 'float:right')
                  
                  .addJqEl(house?gam2.model.reputation.getHouseIco(box.house):'')
                    
                  .up()
                  
                  .up()
          }
           cel = cel.up()
             .up();
             
           
          if (box.is === 'box') {
             cel = cel
             .container('face back m-2','div')
             
             .container('tt', 'div', 'position:relative;top:0px;z-index:997')
            .container('top', 'div')
                .container('pb-2 mb-0 h6-left', 'h6', 'float:left')
                  .addText(title)
                .up()

                .container('pb-2 mb-0 h6-right', 'h6', 'float:right')
                  .addText(topRight)
                .up()
            .up()
            .up();
            
            cel = cel
              .container('content', 'div')
              .container('media text-white')
              .container('media-body ml-2 mb-0 small lh-125', 'p')
              .container('d-block text-light', 'strong')
              .up();
            
            cel = cel
            
              .container('d-text', 'div', 'clear: both')
              .br()
              .br()
              .br()
              .up()
              .up()
              .up()
              .up()
            
            .container('btns', 'div')
            
            .up()
            
            .container('tik', 'div', !wTikSec ? 'animation:none' : 'animation-duration:' + wTikSec + 's')
              .up()
              .container('timer', 'div', 'line-height: 14px')
              .addText('')
              .up()
                  
             
             .up();
          }
          cel = cel
             .el;
        ;
        if(opt) {
          this.cardOpt[id] = cel;
        } else if(box.is==='box') {
          this.cardBox[id] = cel;
        } else {
          this.card[id] = cel;
        }
        return cel;
      },
      'paint': function(id, box, clear=0) {
        box.repaint = 0;
                
        var opt= {'btns': {}}; // = {btns:{'add':[['Lvl up', (function(box) { return function() {gam2.action.lvlUp(box)}})(box), 'btn-success']]}};

        if(clear) {
          opt.btns.clr =1;
          opt.btns.addSpacer =1;
          opt.tikUp =0
          opt.texts =-1;
          opt.contentClear = 1;
          opt.timerClear = 1;
        }

        if((box.type in gam2.view.box) && ('paint' in gam2.view.box[box.type])) {
          opt = gam2.view.box[box.type].paint(id, box, clear);
        }
/*
        if(box.type==='miner') {
          opt.tikUp = true;
          opt.tikSec = 1;
    //      opt.texts= ['1/2 xxxxxxxx','2/2 xxxxxxxx', '  xxxxxxxx'];
        } else if(box.type=='cargo') {
          opt.tikUp=true;
         opt.tikSec=4;
         // opt.strong='3 / 3'
         // opt.texts =['3 / 6']
        
        } else {
          opt.tikUp = true;
          opt.tikSec = 15;
          //opt.strong = "test";
          //opt.texts= [1,2,3];
        }
        opt.lvl = box.level;
        if(clear) {
          opt.btns.clr =1;
          opt.tikUp =0
          opt.texts =-1;
        }
        */
        if(box.everySec) {
          opt.timer=box.everySec- ('timer' in box? box.timer : 0);
          if(opt.timer) {
            opt.tikDelay = -box.timer;
          }
          opt.tikSec= box.everySec;
        }
        this.paintBox(id, opt);
        //gam2.view.paintBox('b1', {'texts': [gam2.model.res.getResIco(5)]});
      },
      'paintBox': function(id, options = {}) {
          if (!(id in this.cardBox)) {
              return;
          }
          if (id === 'b1') {
              //console.log(options);
          }
          options = Object.assign({}, {
              'title': 0,
              'lvl': 0,
              'strong': 0,
              'texts': 0,
              'btns':0,
              'btns2': 0,
              'tikUp': -1,
              'tikSec': 0,
              'tikDelay': 0,
              'timer': 0,
              'timerClear': 0,
              'contentClear': 0,
              'content': [],
          }, options);

          let title = options.title;
          let lvl = options.lvl;
          let strong = options.strong;
          let texts = options.texts;
          let buttons = options.btns;
          let buttons2 = options.btns2;
          let tikUp = options.tikUp;
          let tikSec = options.tikSec;
          let tikDelay = options.tikDelay;
          let timer= options.timer;
          let timerClear= options.timerClear;
          let bt, style;

          if (title) {
              r(this.cardBox[id]).in('.h6-left').clear().addText(title);
          }
          if (lvl) {
              r(this.cardBox[id]).in('.h6-right').clear().addText(lvl);
          }
          if (timerClear) {
              r(this.cardBox[id]).in('.timer').clear();
          }
          if (timer) {
              r(this.cardBox[id]).in('.timer').clear().addText(timer+'s');
          }

          let dBlock = r(this.cardBox[id]).in('.content .d-block');
          let dText = r(this.cardBox[id]).in('.content .d-text');
          if(strong) {
              if (strong === -1) {
                  dBlock.clear();
              } else {
                  dBlock.clear().addText(strong);
              }
          }

          if (texts) {
              if (texts === -1) {
                  dText.clear();
              } else {
                  dText.clear();
                  for (let t in texts) {
                      if (!texts.hasOwnProperty(t)) {
                          continue;
                      }
                      dText.addText(texts[t]).br();
                  }
              }
          }

          if (options.contentClear) {
              dBlock.clear();
              dText.clear();
          }
          if (options.content.length) {
              dText.clear();
              for(let i in options.content) {
                  dText = r(this.cardBox[id]).in('.content .d-text');

                  let elem = options.content[i];
                  if (elem.type === 'slot') {
                      dText = dText.container('slot', 'div');

                      if (elem.res) {
                          dText
                              .addJqEl(gam2.model.res.getResIco(elem.res))
                              .container(elem.missing ? 'req-amount':'amount', 'div')
                              .addText(elem.amount)
                              .up();
                      }
                      dText = dText.up();
                  } else if (elem.type === 'slot-out') {
                      dText = dText
                          .container('slot slot-output' + (elem.missing? ' slot-req-no-qty': ''), 'div');

                      if (elem.res) {
                          dText = dText
                              .addJqEl(gam2.model.res.getResIco(elem.res))
                              .container(elem.missing ? 'req-amount':'amount', 'div')
                              .addText(elem.amount)
                              .up()
                      }
                      dText = dText.up();
                  } else if (elem.type === 'pad') {
                      let icoClass = 'ico ', icoStyle = '';
                      if (elem.ship === 'airliner') {
                          icoClass += 'fas fa-location-arrow fa-4x p-2';
                      } else if (elem.ship === 'cargo') {
                          icoClass += 'fas fa-box fa-3x p-3';
                          icoStyle = "transform: translateX(0px) rotate(45deg)";
                      } else if (elem.ship === 'transporter') {
                          icoClass += 'fas fa-brush fa-4x p-1';
                          icoStyle = "transform: translateX(15px) rotate(-135deg)";
                      } else {
                          dText.container('pad', 'div').up();
                          continue;
                      }
                      dText
                          .container('pad', 'div')
                          .container(icoClass,'div', icoStyle)
                          .up()
                          .up();

                  } else if (elem.type === 'text') {
                      dText.addText(elem.text).br();
                  } else if (elem.type === 'br') {
                      dText.br(('count' in elem)? elem.count: 1);
                  }

              }
          }

function rep(buttons, btn) {
  let b;

  if (buttons.clr) {
    btn.clear();
    if (buttons.addSpacer) {
      btn.container('spacer', 'div', 'height:27px;display:block;');
    }
  }
  for (b in buttons.upd) {
    if (!buttons.upd.hasOwnProperty(b)) {
      continue;
    }
    bt = buttons.upd[b];
    btn.addButton(bt[0], bt[1], 'button ' + bt[2]);
  }

  for (b in buttons.add) {
    if (!buttons.add.hasOwnProperty(b)) {
      continue;
    }
    bt = buttons.add[b];
    btn.addButton(bt[0], bt[1], 'button ' + bt[2]);
  }
}
          if (buttons) {
              buttons = Object.assign({}, {'clr': 0, 'addSpacer': 0, 'upd': {}, 'add':[]}, buttons);

              let btn = r(this.cardBox[id]).in('.btns');
              
              rep(buttons, btn);
          }

if (buttons2) {
  buttons2 = Object.assign({}, { 'clr': 0, 'addSpacer': 0, 'upd': {}, 'add': [] }, buttons2);

  let btn = r(this.cardBox[id]).in('.btns');

  rep(buttons2, r(this.cardBox[id]).in('.btns', 1))
}

          let tick = r(this.cardBox[id]).in('.tik').clear();

          if (tikUp === false) {
              tick.el.attr('style', 'animation:none');
          } else if (tikUp === true && tikSec > 0) {
              style = 'animation-duration:' + tikSec + 's';
              if (tikDelay) {
                  style += ';animation-delay: '+ tikDelay +'s';
              }
              tick.el.attr('style', 'animation:none');
              tick.el.get(0).offsetWidth;
              tick.el.attr('style', style);
              //gam2.view.paintBox('b2', {'lvl': 3, 'tikSec': 5, 'tikUp': true, 'tikDelay': -1})
          }
      },
      'getLocPs': function(box) {
        return [box.pos,0,0,0];
      },
      'genLocs': function(lvl, p0= 0, p1= 0, p2= 0, p3= 0, forceAtPos=0, mergeLocsP = 0) {
        let rd = this.model.rand.rd;
        let pmap = gam2.model.loc.pmap;
        let seedLoc = this.model.rand.seed['loc'+lvl];
        let seedLocId = rd.hashCode(seedLoc+p0+'.'+p1+'.'+p2+'.'+p3, lvl);
       // console.log(seedLocId);
        let rdChr =  this.model.rand.rdChr.bind(this.model.rand);
        let rdNam = this.model.rand.rdNam.bind(this.model.rand);
        let cstr = this.model.constr;
        rd.restartSeed(seedLocId);
        
        var pkeys;
        //console.log('bf pk',p0,p1,p2,p3);
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
      //  console.log('pkey '+pkey);
        if(pkey in pmap) {
          //console.log('pmp ',pmap[pkey]);
          mergeLocsP= pmap[pkey];
        }

        const maxPos = lvl === 3? 3: 10;
        let cob, ccr;
        let types = [
          ['sun'],
          ['planet','asteroid-belt','asteroid-belt','asteroid-belt','gas-planet','ice-planet','arid-planet'],
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
        let house=0;
        for(let pos = 1; pos <= maxPos; pos++ ) {
          if (lvl === 3 && 1) {
            house = rd.rand(2, gam2.model.reputation.house.length, seedLocId);
          } else {
            house = 0;
          }
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
              : (type ==='asteroid-belt'?'Cloud ':'') +rdNam(seedLocId)
              ),'', house)
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
      'addLocSelected': function(containerDiv, i, a) {
               el = this.drawCard('loc'+ i, p[i], containerDiv);

               el.click((function (el, bi, plist) {return function () { gam2.action.loc.unlockLoc(el, bi, plist); }})(el, i, p));
      },
      'deleteEls': function(els) {
        for (const i in els) {
          if (!els.hasOwnProperty(i)) {
            continue;
          }
          r(els[i]).remove();
          delete els[i];
        }
      },
      'showLocOptions': function(p,p0,p1,p2,p3) {
          //console.log('showLocOptions '+ p0,p1,p2,p3);
        gam2.view.deleteEls(gam2.view.cardOpt);
        var containerDiv;
        var el;
        
        for (const i in p) {
          if (!p.hasOwnProperty(i)) {
            continue;
          }
          if(p[i].type==='empty') {
            continue;
          }
          p[i].locWithBuilds = this.findLocWithBuilds(i,p[i],p0,p1,p2,p3);
          
          el = this.drawCard('opt' + i, p[i], null, 1);
        
          el.click((function(i, p,p0,p1,p2,p3) { return function() { gam2.action.loc.selectLoc(i, p,p0,p1,p2,p3); } })(i, p,p0,p1,p2,p3));
        }
      },
      'findLocWithBuilds': function (i,loc,p0,p1,p2,p3) {
        var lvl = loc.lvl;
        if(lvl === 0) {
          p0=loc.pos;
        } else if(lvl ===1) {
          p1=loc.pos;
        } else if(lvl ===2) {
          p2=loc.pos;
        } else if(lvl ===3) {
          p3=loc.pos;
        };
        var ps=[p0];
        if(p1!==0) {
          ps.push(p1);
        }
        if (p2!== 0) {
          ps.push(p2);
        }
        if (p3!== 0) {
          ps.push(p3);
        }
        var bl= gam2.model.box.list;
        var c= ps.join('.');
        var bkeys = Object.keys(bl);
        const found = bkeys.find(el => {
          if (el.includes(c)) {
            return true;
          }
          
        });
        return (found!==undefined);
      },
    },
    'model': {
        'flags': {
            'loading': 0,
        },
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
            'icon':'cookie-bite fa-sml',
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
          'gas-planet': {
            'icon':'moon',
            'bg':'empty',
            'dashed':1,
          },
          'ice-planet': {
            'icon':'bowling-ball',
            'bg':'empty',
            'dashed':1,
          },
          'arid-planet': {
            'icon':'cookie',
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
          'trade-st': {
            'icon': 'table fa-med',
            'bg': 'empty',
            'dashed': 1,
          },
          'storage-st': {
            'icon': 'square',
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
          },
            'assembler': {
                'icon':'play',
                'bg': 'silo',
                'dashed': 0,
            },
            'storage': {
                'icon':'play',
                'bg': 'power',
                'dashed': 0,
            },
            'launch-pad': {
                'icon':'play',
                'bg': 'dark',
                'dashed': 0,
            },
            'docker': {
              'icon': 'play',
              'bg': 'dark',
              'dashed': 0,
            },
            'seller': {
                'icon':'play',
                'bg': 'dark',
                'dashed': 0,
            },
          'transport': {
            'icon': 'location-arrow',
            'bg': 'crafter',
            'dashed':0
          },
          'cargo': {
            'icon':'location-arrow',
            'bg': 'empty',
            'dashed': 1,
          },
          'airliner': {
            'icon': 'square',
            'bg':'crafter',
            'dashed': 0,
          },
          'crafter':{
            'icon':'',
            'bg':'smelter',
            'dashed': 1,
          }
        },
        'loc': {
          'list': null,
          'current': null,
          'currentPos':'0.0.0.0',
        },
        'slot': {
          'addItemToSlots': function(box, item, amount, unitValue) {
          var slots = gam2.model.constr.getPropList(box.slot)
          if (!slots.length) {
            return false;
          }
          let slotItem = this.findSlotNonFullWithItem(slots, box, item);
          if (!slotItem) {
            slotItem = this.findNextEmptySlot(slots);
          }
          if (!slotItem) {
            return 0;
          }
          let reminder = slotItem.amount + amount - box.maxAmount;
        
        
          slotItem.item = item;
          slotItem.unitValue = unitValue;
            
          if (reminder > 0) {
            slotItem.amount = box.maxAmount;
            return this.addItemToSlots(box, item, reminder, unitValue)
          }
          slotItem.amount += amount;
        
          return 1;
        },
        'subItemFromSlots': function(box, item, amount) {
          var slots = gam2.model.constr.getPropList(box.slot)
          if (!slots.length) {
            return false;
          }
          let slotItem = this.findSlotNonFullWithItem(slots, box, item);
          if (!slotItem) {
            return 0;
          }
          let reminder = amount - slotItem.amount;
          if (reminder > 0) {
            slotItem.amount = 0;
            return this.subItemFromSlots(box, item, reminder);
          }
          slotItem.amount -= amount;
          return 1;
        },
        'amountExistsInSlots': function(box, item, amount) {
          var slots = gam2.model.constr.getPropList(box.slot)
          if (!slots.length) {
            return false;
          }
          let sum = 0;
          for (let i in slots) {
            if (slots[i].item === item && slots[i].amount > 0) {
              sum += slots[i].amount;
            }
          }
          return (amount > sum) ? 0 : 1;
        },
        'emptyAmountExistsInSlots': function(box, item, amount) {
          var slots = gam2.model.constr.getPropList(box.slot)
          if (!slots.length) {
            return false;
          }
          let sumEmpty = 0;
          for (let i in slots) {
            if (slots[i].item === item && slots[i].amount < box.maxAmount) {
              sum += box.maxAmount - slots[i].amount;
            } else if (slots[i].item === 0)
              sum = box.maxAmount;
          }
          return (amount > sum) ? 0 : 1;
        },
        'findSlotNonFullWithItem': function(slots, box, item) {
          for (let i in slots) {
            if (slots[i].item === item && slots[i].amount < box.maxAmount) {
              return slots[i];
            }
          }
          return 0;
        },
        'findNextEmptySlot': function(slots) {
          for (let i in slots) {
            if (slots[i].item === 0) {
              return slots[i];
            }
          }
          return 0;
        },
    },
        'box': {
            'addSlotsFor': function (box) {
                if(!('slot' in box)) {
                    return;
                }
                box.slot = gam2.model.constr.addSlot({'posi':0});

                let slots = box.slots | 1;
                if(slots > 1) {
                    let sl= box.slot;
                    // console.log(pub.p);
                    for(let i=0; i<slots-2;i++) {
                        sl = sl.nextObj(
                            gam2.model.constr.addSlot({'posi':i+1})
                        )
                    }
                }
            },
            'addSlotOutsFor': function (box) {
                if(!('slotOut' in box)) {
                    return;
                }

                box.slotOut = gam2.model.constr.addSlot({'poso':0});
                let slotsOut = box.slotsOut | 1;
                if (slotsOut > 1) {
                    let sl = box.slotOut;
                    for (let i = 0; i < slotsOut-2; i++) {
                        sl = sl.nextObj(
                            gam2.model.constr.addSlot({'poso':i+1})
                        )
                    }
                }
            },
            'fromObj': function (pub) {
                let box = {};
                for(let b in pub) {
                    if (!pub.hasOwnProperty(b)) {
                        continue;
                    }
                    if (Array.isArray(pub[b])) {
                        if(!pub[b].length) {
                            continue;
                        }
                        let first = pub[b][0];
                        if (typeof first !== 'object' || !('is' in first)) {
                            box[b] = pub[b];
                            continue;
                        }
                        let chain = null;
                        let idx = 0;
                        for(let f in pub[b]) {
                            if (!pub[b].hasOwnProperty(f)) {
                                continue;
                            }
                            let subObj = pub[b][f];
                            if (first.is === 'slot') {
                                if (idx === 0) {
                                    chain = gam2.model.constr.addSlot(pub[b][f]);
                                } else {
                                    chain = chain.nextObj(
                                        gam2.model.constr.addSlot(pub[b][f])
                                    );
                                }
                            }
                            idx++;
                        }
                        /*if (pub.type === 'storage') {
                            console.log('chain:', gam2.model.constr.getPropList(chain.first));
                        }*/
                        box[b] = chain.first;
                    } else {
                        if (b === 'repaint') {
                            pub[b] = 1;
                        }
                        box[b] = pub[b];
                        /*if (pub.type === 'storage' || box.type === 'miner') {
                            console.log(b+ ':',box[b]);
                        }*/
                    }
                }
                return box;
            },
            'toObj': function (box) {
                let pub = {};
                for(let b in box) {
                    if (!box.hasOwnProperty(b)) {
                        continue;
                    }
                    if (typeof box[b] === 'object' &&  ('p' in box[b])) {
                        pub[b] = gam2.model.constr.getPropList(box[b].first, 1 ,0);
                    } else {
                        pub[b] = box[b];
                    }
                }

                return pub;
            },
          'list': null,
          'coins': {},
          'coin': {
            'units': ['', 'K', 'M','G','T','R','S'],
            'add': function(a, b) {
                var r = {};
                if (b.u === a.u) {
                  r = {...a};
                  r.n = a.n + b.n;
                } else {
                  r.u= this.biggestU(a.u, b.u);
                  r.n= a.u? a.n: b.n;
                }
                return r;
            },
            'sub': function(a, b) {
              var r = {};
              if (b.u === a.u) {
                r = { ...a };
                r.n = a.n - b.n;
              } else {
                r.u = this.biggestU(a.u, b.u);
                r.n = a.u ? a.n : b.n;
              }
              return r;
            },
            'biggestU': function(a, b) {
              return this.units.indexOf(a)>this.units.indexOf(b)? a:b;
            },
            'lastU': function(u, n) {
              var r = [];
              var i = this.units.indexOf(u);
              do {
                r.push(this.units[i]);
                i--;
              } while(i>=0);
              return r;
            }
          }
        },
        'reputation':{
          'house': [],
          'icoList': ['paw','piggy-bank','poo-storm','sink','square-root-alt','superscript','university','utensils'],
          'colorList': ['cyan','pink','yellow','white', 'seagreen','salmon','lightgreen','lawngreen','orange','deepskyblue','firebrick','mediumvioletred','mediumpurple'],
          'colorUni': {},
          'init': function() {
            this.add('self','crown','yellow');
          },
          'add': function(name, ico = 0, color = 'light') {
            var id = this.house.length;
            this.house[id] = {
              name: name,
              value: 0,
              ico: ico,
              color: color
            }
            return id;
          },
          'genh': function (num) {
                let rd = gam2.model.rand.rd;
                let ico, suf, name, color;
                let seed = gam2.model.rand.seed.res;
                var icoList = [], colorList= [];
                for(let i=0;i<num;i++) {
                    if(!icoList.length) {
                      icoList = [...this.icoList];
                    }
                    ico = rd.pickOneFrom(icoList,1, seed);
                    if(ico in this.colorUni && !this.colorUni[ico].length) {
                      ico = rd.pickOneFrom(icoList,1, seed);
                    }
                    suf = rd.randomBytes(1,1) + rd.pickOneFrom(['um','um','is','ix','us','ad','am'],0, seed);
                    name = rd.randomName(rd.rand(2,4),0,suf, 0, seed);
                    if(!(ico in this.colorUni)) {
                      this.colorUni[ico] = [...this.colorList];
                    }
                    /*if (!colorList.length) {
                      colorList = [...this.colorUni[ico]];
                    }*/
                    
                    color = rd.pickOneFrom(this.colorUni[ico], 1, seed);
                    this.add(name, ico, color);
                    
                    const idx= this.colorUni[ico].indexOf(color);
            
                    /*if (idx > -1) {
                      this.colorUni[ico].splice(idx, 1);
                    }*/
                    if(!this.colorUni[ico].length) {
                      console.log('no for '+ico)
                    }
                }
                //console.log(this.reg)
            },
            'getHouseIco': function(id) {
              var house = this.house[id % this.house.length];
              // console.log(res, this.reg[id+1])
              return $('<i>').addClass('fas')
                .addClass('fa-' + house.ico)
                .attr('style', 'font-size: 24px;color:' + house.color);//.html(house.ico);
            },
        },
        'res': {
            'icoList':['atom','adjust','cheese', 'bars','circle-notch','clone','cubes','cube','columns','glass-whiskey', 'database','dice-d6','dice-d20', 'dot-circle','egg','eject','equals','fire','fire-alt','flask','hockey-puck','grip-vertical','gem','radiation-alt','neuter', 'icicles','mountain','ring','shapes','share-alt-square','square','stop-circle','sun','tint','th-large','th','water','wave-square','window-restore', 'bong', 'flask','boxes'],
            'colorList':["aliceblue", "antiquewhite", "aqua", "aquamarine", "biege", "bisque", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "coral", "cornflowerblue", "cyan", "darkcyan", "darkgreen", "darkorchid", "darkred", "deeppink", "deepskyblue", "darkslategray", "darkslateblue", "gold", "goldenrod", "gray", "greenyellow", "hotpink", "indianred", "lavender", "lemonchiffon", "lightblue", "lightcyan", "lightcoral", "lightseagreen", "lightskyblue", "lightsteelblue", "lime", "linen", "mediumaquamarine", "mediumseagreen", "mediumcoral", "mediumturquoise", "mediumvioletred", "mistyrose", "olive", "orangered", "orange", "palegoldenrod", "purple", "plum", "pink", "powderblue", "red", "rosybrown", "royalblue", "salmon", "sandybrown", "seagreen", "silver", "seashell", "springgreen", "steelblue", "teal", "tan", "thistle", "turquoise", "violet", "wheat", "white", "yellow", "yellowgreen"],
            'colorList2': ['cyan','pink','yellow','white', 'seagreen','salmon','lightgreen','lawngreen','orange','deepskyblue','firebrick','mediumvioletred','mediumpurple'],
            'colorList3': ['grape','grape'],
            'colorUni': {},
            'mineIcoList': ['tint','shapes','tablets','soap', 'icicles', 'genderless', 'air-freshener','glass-whiskey','water'],
            'reg':[],
            'recepies': {},
            'init': function() {
              this.add('money','donate','white');
              this.add('moneyK','donate','yellow');
              this.add('moneyM','donate','greenyellow');
              this.add('moneyG','donate','aquamarine');
              this.add('moneyT','donate','lightblue');
              this.add('moneyR','donate','lightviolet');
              this.add('moneyS','donate','pink');
              
              this.add('power','battery-full','greenyellow');
              this.add('child','child','lightgreen');
            },
            'add': function (name, ico=0, color='light', unitValue=0) {
                var id=this.reg.length;
                this.reg[id] = {
                    name: name,
                    value: 0,
                    ico: ico,
                    color: color,
                    unitValue: unitValue
                }
                return id;
            },
            'gen': function (num) {
                let rd = gam2.model.rand.rd;
                let ico, suf, name, color;
                let seed = gam2.model.rand.seed.res;
                var icoList = [], colorList= [];
                var unitValue =0;
                for(let i=0;i<num;i++) {
                    if(i >= 0 && i <= 5) {
                      unitValue = i + 4;
                    }
                    if(!icoList.length) {
                      icoList = [...this.icoList];
                    }
                    ico = rd.pickOneFrom(icoList,1, seed);
                    if(ico in this.colorUni && !this.colorUni[ico].length) {
                      ico = rd.pickOneFrom(icoList,1, seed);
                    }
                    suf = rd.randomBytes(1,1) + rd.pickOneFrom(['um','um','is','ix','us','ad','am'],0, seed);
                    name = rd.randomName(rd.rand(2,4),0,suf, 0, seed);
                    if(!(ico in this.colorUni)) {
                      this.colorUni[ico] = [...this.colorList2];
                    }
                    /*if (!colorList.length) {
                      colorList = [...this.colorUni[ico]];
                    }*/
                    
                    color = rd.pickOneFrom(this.colorUni[ico], 1, seed);
                    this.add(name, ico, color, unitValue);
                    
                    const idx= this.colorUni[ico].indexOf(color);
            
                    /*if (idx > -1) {
                      this.colorUni[ico].splice(idx, 1);
                    }*/
                    if(!this.colorUni[ico].length) {
                      console.log('no for '+ico)
                    }
                }
                //console.log(this.reg)
            },
            'getResIco': function (id) {
                var res = this.reg[id % this.reg.length];
               // console.log(res, this.reg[id+1])
                return $('<i>').addClass('fas')
                    .addClass('fa-'+res.ico)
                    .attr('style', 'font-size: 24px;color:'+res.color);
            },
            'genRecepies': function() {
                let seed = gam2.model.rand.seed.res;
                let resLength = this.reg.length;
                let numItems=1;
                for(let i= 15; i<resLength; i++) {
                  numItems=1;
                  if(i > 30) {
                    numItems++;
                  }
                  if(i > 45) {
                    numItems++;
                  }
                  if(i > 55) {
                    numItems++;
                  }
                  
                  if(i > 75) {
                    numItems++;
                  }
                  
                  
                  
                  this.recepies[i] = 
                    this.genRecepieFor(i, numItems, i-numItems-4)
                  
                }
            },
            'genRecepieFor': function(item, numItems, minId=5, opt= {}) {
                let seed = gam2.model.rand.seed.res;
                let reg = gam2.model.res.reg;
                let inp={};
                let rd = gam2.model.rand.rd;
                let unitValue = 0;
                //console.log(minId+': '+ reg[minId].unitValue)
                
                for(let i=minId; i< minId + numItems;i++) {
                  let nItem= i; //rd.rand(minId, maxId, seed);
                  inp[nItem]= rd.rand(5,10)*Math.pow(10, rd.rand(0,2, seed));
                  unitValue += inp[nItem]*reg[nItem].unitValue*(11)/(9);
                }
                
                reg[item].unitValue = unitValue;
              
                return {
                  inp: inp,
                  out: item,
                  unitValue: Math.ceil(unitValue)
                }
            },
            'hexToHsl': function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    var r = parseInt(result[1], 16);
    var g = parseInt(result[2], 16);
    var b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    s = s*100;
    s = Math.round(s);
    l = l*100;
    l = Math.round(l);

    var colorInHSL = 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
            }
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
                'root': 'gam2b5xBxhe$X54B8sd',
                'main': null
            },
        },
        'constr': {
            'getAddFunc': function (defaultProp, callback=0) {
                var defaults = JSON.parse(JSON.stringify(defaultProp));

                return (function(callback) {
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
                        'setParentObj': function(obj) {
                          this.parent = obj;
                          obj.child = this.first;
                          var n = this;
                          while(n= n.next) {
                            n.parent = obj;
                          }
                        },
                        'get': function(num) {
                          var c= this.first;
                          var i=1;
                          while (i < num) {
                            c = c.next;
                            i++;
                          }
                          return c;
                        },
                        'last': function() {
                          var c= this;
                          let i=0, imax=1000;
                          while((c.next) && (i < 1000)) {
                            c= c.next;
                            i++;
                          }
                          return c;
                        }
                    };
                    pub.first = pub;
                    pub.firstParent = pub;
                    if(typeof callback === 'function') {
                      callback.apply(null, [pub]);
                    }
                    return pub;
                }})(callback);
            },
            'init': function () {
                this.addLoc= this.getAddFunc({
                    'name': '',
                    'type': '',
                    'lvl': 0,
                    'pos': 0,
                    'card': 'empty',
                    'is':'loc',
                });

                this.addSlot= this.getAddFunc({
                    'posi':-1,
                    'poso':-1,
                    'item': 0,
                    'amount': 0,
                    'unitValue': 0,
                    'form':'',
                    'is':'slot',
                    'requireAmount': 0,
                });

                this.addBox= this.getAddFunc({
                    'type': 0,
                    'pos':1,
                    'level': 0,
                    'levelCost': 0,
                    'levelCostFloat': 0,
                    'moneyCost': 0,
                    'peopleCost': 0,
                    'powerCost': 0,
                    'is':'box',
                    'rot':0,
                    'repaint': 1,
                    'timer':0,
                }, function(pub) {
                    pub.levelCostFloat = pub.levelCost;
                    if(gam2.model.flags.loading) {
                        return;
                    }
                    gam2.model.box.addSlotsFor(pub.p);
                    gam2.model.box.addSlotOutsFor(pub.p);
                });
            },
            'locProps': function ( pos,type, lvl, name, crkey='', house =0) {
                return {
                    card:'empty',
                  is:'loc',
                    pos: pos,
                    type: type,
                    lvl: lvl,
                    name: name,
                    loc: 'L' + lvl + ':' + ((pos< 10)? '0': '') + pos,
                    crkey: crkey+'.'+pos,
                    house: house,
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
      'event': {
        'list': {},
        'put': function(name, hdl, ctx) {
          let L= this.list;
          if(!(name in L)) {
            L[name] = [];
          }
          L[name].push(hdl.bind(ctx));
        },
        'do': function(name, obj = {}) {
          let L= this.list;
          
          if(!(name in L) || !L[name].length) {
            return;
          }
          for(let t in L[name]) {
            L[name[t]].call(obj);
          }
        }
      },
        'getCoins': function () {
            var cpos = gam2.model.loc.currentPos;

            if (!(cpos in gam2.model.box.coins)) {
                gam2.model.box.coins[cpos] = {
                    'money': 0,
                    'ppl': [0, 0],
                    'power': [0, 0],
                };
            }

            return gam2.model.box.coins[cpos];
        },
      'box': {
        'miner': {
          'tick': function(box) {
            if (box.outputId) {
                gam2.action.box.miner.mine(box);
            }
            if (box.to) {
                gam2.action.box.miner.sendTo(box);
            }
            box.clearTik = 1;
            box.repaint = 1;
          },
          'mine': function (box) {
              if (!box.outputId) {
                  return;
              }
              let slot = box.slotOut.p;
              if (slot.item !== box.outputId) {
                  let res = gam2.model.res.reg;
                  slot.item = box.outputId;
                  slot.unitValue = box.outputId - 5;
                  slot.amount = 0;
              }
              if (slot.amount > box.maxAmount) {
                    //nothing to do, all is done
              } else if (box.maxAmount - slot.amount > box.tickAmount ) {
                  slot.amount += box.tickAmount;
              } else {
                  slot.amount = box.maxAmount;
              }
          },
          'defaults': function (box) {
              box.type='miner';
              box.level = 1;
              box.levelCost = 1;
              box.levelCostFloat = 1;
              box.tickAmount = 1;
              box.maxTickAmount = 50;
              box.maxAmount = 100;
              box.outputId = 0;
              box.everySec = 0;
              box.slotOut = {};
              box.slotsOut = 1;
              box.to = 0;
              box.clearTik = 0;
              
              return box;
          },
          'lvlUp': function (box) {
              let coins = gam2.action.getCoins();

              if (coins.money < box.levelCost) {
                  return;
              }
              coins.money -= box.levelCost;

              box.levelCostFloat *= 2;
              box.levelCost = Math.round(box.levelCostFloat);

              box.level++;
              box.tickAmount++;
              box.maxAmount += 1000;

              box.repaint = 1;
              gam2.view.paintTopBar(coins);
              gam2.view.drawBox(box,0);
          },
          'stopMine': function (box) {
              let bonusAmount = [2, 1, 1, 0, 0];
              box.tickAmount -= bonusAmount[(box.outputId - 10)];
              box.outputId = 0;
              box.everySec = 0;
              box.clearTik = -1;

              box.repaint = 1;
              gam2.view.drawBox(box,0);
          },
          'sellAll': function (box) {
              let slot = box.slotOut.p;
              if (!slot.amount) {
                  return;
              }
              let coins = gam2.action.getCoins();
              coins.money += slot.amount * slot.unitValue;

              slot.amount = 0;

              box.repaint = 1;
              gam2.view.paintTopBar(coins);
              gam2.view.drawBox(box,0);
          },
          'prospect': function (box) {
              box.outputId = 10;
              let bonusAmount = [2, 1, 1, 0, 0];
              box.tickAmount += bonusAmount[(box.outputId - 10)];

              let slot = box.slotOut.p;
              if(slot.item === 0) {
                  slot.item = box.outputId;
                  slot.unitValue = box.outputId - 5;
                  slot.amount = 0;
              }
              box.everySec = 5;
              box.clearTik = 1;

              box.repaint = 1;
              gam2.view.drawBox(box,0);
          },
          'connectTo': function(box) {
            let ev = gam2.action.event;
            var cpos = gam2.model.loc.currentPos;
        
            if(!box.to) {
              gam2.view.box.miner.popupTo(box);
              //box.to = [cpos, 8];
              //ev.put('b'+box.pos);
            } else {
              box.to = 0;
            }
            
              box.repaint = 1;
              gam2.view.drawBox(box,0);
          },
          'selectTo': function(box, cpos, pos) {
            box.to = [cpos, 8];
            
              box.repaint = 1;
              gam2.view.drawBox(box,0);
          },
          'sendTo': function(box) {
            if(!box.to) {
              return;
            }
            let to, pos;
            [pos,to]= box.to;
            
            var cpos = gam2.model.loc.currentPos;
            let slot = box.slotOut.p;
              
        var p = gam2.model.constr.getPropList(gam2.model.box.list[pos])
        if (!p.length) {
          return;
        }
        let ev = gam2.action.event;
        
        for(let i in p) {
          if(p[i].pos === to) {
            slot.amount -= box.tickAmount;
            gam2.model.slot.addItemToSlots(p[i], slot.item, box.tickAmount, slot.unitValue);
            
            ev.do('b'+box.pos+'.miner.sendTo', box);
            
            if(cpos === pos) {
              //console.log(p[i]);
              p[i].repaint=1;
              
              gam2.view.drawBox(p[i],0);
            }
            return;
          }
        }
          },
          'change': function (box) {
              //   0  1  2  3  4
              //  10 11 12 13 14
              //   3  2  2  1  1
              let bonusAmount = [2, 1, 1, 0, 0];
              box.tickAmount -= bonusAmount[(box.outputId - 10)];

              box.outputId++;

              if (box.outputId > 14) {
                  box.outputId = 10;
              }

              box.tickAmount += bonusAmount[(box.outputId - 10)];

              let slot = box.slotOut.p;
              if (slot.item !== box.outputId) {
                  let res = gam2.model.res.reg;
                  slot.item = box.outputId;
                  slot.unitValue = box.outputId - 5;
                  slot.amount = 0;
              }

              box.repaint = 1;
              gam2.view.drawBox(box,0);
          },
          'state': function (box) {
              let state = {};
              let slot = box.slotOut.p;

              state.actions = function () {
                  let acts = [];
                  let coins = gam2.action.getCoins();

                  if (box.tickAmount < box.maxTickAmount) {
                      acts.push(['Lvl up', (function(box) { return function() {gam2.action.box.miner.lvlUp(box)}})(box), (coins.money >= box.levelCost) ? 'btn-success': 'btn-danger']);
                  }

                  if (!box.outputId) {
                      acts.push(['Search', (function(box) { return function() {gam2.action.box.miner.prospect(box)}})(box), 'btn-info']);
                  }
                  if(!box.outputId) {
                     acts.push(['To', (function(box) { return function() {gam2.action.box.miner.connectTo(box)}})(box), box.to? 'btn-warning':'btn-success']);
                  }
                  
                  if (box.outputId) {
                      acts.push(['>', (function(box) { return function() {gam2.action.box.miner.change(box)}})(box), 'btn-success']);
                      acts.push(['Stop', (function(box) { return function() {gam2.action.box.miner.stopMine(box)}})(box), 'btn-danger']);
                  }
                  if (slot.amount) {
                      acts.push(['Sell*', (function(box) { return function() {gam2.action.box.miner.sellAll(box)}})(box), 'btn-warning']);
                  }
                  acts.push(['inf', (function(box) { return function() { gam2.action.box.storage.rot3(box) } })(box), 'btn-light']);
          

                  return acts;
              }
              
              state.actions2 = function() {
                let acts2 = [];
                acts2.push(['inf', (function(box) { return function() { gam2.action.box.storage.rot3(box) } })(box), 'btn-light']);
          
                return acts2;
              }

              state.actionsUpdate = function () {
                  return [];
              }

              state.content = function () {
                  let conts;
                  conts = [
                      {type: 'slot-out', res: slot.item, amount: slot.amount, missing: (slot.item > 0 ? 0: 1)},{type: 'br'},
                  ];

                  if (slot.item > 0) {
                      let res = gam2.model.res.reg[slot.item];
                      conts.push({type: 'text', text: 'Res: '+ res.name + ' $'+ slot.amount * slot.unitValue});
                  }

                  if (box.level < 50) {
                      conts.push({type: 'text', text: 'Next Lvl: $'+ box.levelCost});
                  }

                  conts.push({type: 'text', text: 'Mine +'+ box.tickAmount + ' $'+ box.tickAmount * slot.unitValue});

                  return conts;
              }

              state.clearTikOpt = function () {
                  if (!box.clearTik) {
                      return false;
                  }
                  let clearTik = box.clearTik;
                  box.clearTik = 0;
                  return clearTik;
              }

              return state;
          }
        },
        'dwellings': {
          'tick': function(box) {
            box.level++;
            box.repaint = 1;
          },
        },
        'crafter': {
            'defaults': function (box) {
                box.type='crafter';
                box.level = 1;
                box.levelCost = 10;
                box.levelCostFloat = 10;
                box.slots = 1;
                box.slot = {};
                box.slotsOut = 1;
                box.slotOut = {};
                box.from = 1;
                box.to = 0;
                box.recepie = 0;
                return box;
            }
        },
        'storage': {
          'defaults': function(box) {
            box.type='storage';
            box.level = 1;
            box.levelCost = 3;
            box.levelCostFloat = 3;
            box.slots = 4;
            box.maxAmount = 250;
            box.slot = {};
            box.from = 1;
            box.clearTik = 0;
            box.tickPaint=1;
            return box;
          },
          'tick': function(box) {
          },
          'sellAll': function(box) {
            var slots = gam2.model.constr.getPropList(box.slot)
            
            let coins = gam2.action.getCoins();
              
            for(let i in slots) {
              let sl = slots[i];
              
              if (!sl.item || !sl.amount) {
                  continue;
              }
              coins.money += sl.amount * sl.unitValue;

              sl.amount = 0;
              sl.item = 0;
            }
            
              box.repaint = 1;
              gam2.view.paintTopBar(coins);
              gam2.view.drawBox(box,0);
          },
          'lvlUp': function (box) {
              let coins = gam2.action.getCoins();

              if (coins.money < box.levelCost) {
                  return;
              }
              coins.money -= box.levelCost;
              box.levelCostFloat *= 3;
              box.levelCost = Math.round(box.levelCostFloat);

              box.level++;
              if(box.level%10===0 && box.level !== 50) {
                box.slots++;
                let last = box.slot.last();
                last.nextObj(
                  gam2.model.constr.addSlot({'posi': last.p.posi +1})
                )
              } else {
                box.maxAmount += 250;
              }

              box.repaint = 1;
              gam2.view.paintTopBar(coins);
              gam2.view.drawBox(box,0);
          },
          'rot3': function(box) {
            let el=gam2.view.cardBox['b'+box.pos];
            if(!box.rot) {
              el.toggleClass('rot3');
            } else {
              el.toggleClass('rot3');
              box.rot=-1;
            }
            box.rot++;
          },
          'state': function(box) {
            let state = {};
          
            state.actions = function() {
              let acts = [];
              let coins = gam2.action.getCoins();
          
              if (box.level < 50) {
                acts.push(['Lvl up', (function(box) { return function() { gam2.action.box.storage.lvlUp(box) } })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
              }

              acts.push(['Sell*', (function(box) { return function() { gam2.action.box.storage.sellAll(box) } })(box), 'btn-warning']);
              acts.push(['inf', (function(box) { return function() { gam2.action.box.storage.rot3(box) } })(box), 'btn-light']);
          
              return acts;
            }
            
            state.actions2 = function() {
              let acts2 = [];
              acts2.push(['inf', (function(box) { return function() { gam2.action.box.storage.rot3(box) } })(box), 'btn-light']);
            
              return acts2;
            }
            
            state.actionsUpdate = function() {
              return [];
            }
          
            state.content = function() {
              let conts = [];
              
              var slots = gam2.model.constr.getPropList(box.slot);
          
              for(let i=0; i<slots.length;i++) {
                let slot = slots[i];
                conts.push(
                  { type: 'slot', res: slot.item, amount: slot.amount, missing: (slot.item > 0 ? 0 : 1) },
                );
              }
          
            /*  if (slot.item > 0) {
                let res = gam2.model.res.reg[slot.item];
                conts.push({ type: 'text', text: 'Res: ' + res.name + ' $' + slot.amount * slot.unitValue });
              }*/
          
              if (box.level < 50) {
                conts.push({type: 'br'});
                conts.push({ type: 'text', text: 'Next Lvl: $' + box.levelCost});
                conts.push({ type: 'text', text: 'Max: ' + box.maxAmount});
                
              }
          
            //  conts.push({ type: 'text', text: 'Mine +' + box.tickAmount + ' $' + box.tickAmount * slot.unitValue });
          
              return conts;
            }
          
            state.clearTikOpt = function() {
              if (!box.clearTik) {
                return false;
              }
              let clearTik = box.clearTik;
              box.clearTik = 0;
              return clearTik;
            }
          
            return state;
          }
        }
      },
      'everySec': function() {
      var cpos = gam2.model.loc.currentPos;
        
      for(let pos in gam2.model.box.list)
      {
        var p = gam2.model.constr.getPropList(gam2.model.box.list[pos])
        if (!p.length) {
          return;
        }
        
         for (let u in p) {
                    var box = p[u];
                    if(!box) {
                      continue;
                    }
                    
                    if (box.tickPaint) {
                      if (pos === cpos) {
                            box.repaint=0;
                            gam2.view.paint('b' + box.pos, box, box.repaint);
                      }
                      continue;
                    }
                    
                    if(! box.everySec) {
                      continue;
                    }
                    
                        if (!('timer' in box)) {
                            box.timer = 0;
                        }
                            
                        box.timer++;
                        
                        if (box.timer !== box.everySec) {
                          if (pos === cpos) {
                            box.repaint=0;
                            gam2.view.paint('b' + box.pos, box, box.repaint);
                          }
                          continue;
                        }
                        box.timer = 0;
                    
                    if(box.type in gam2.action.box && ('tick' in gam2.action.box[box.type])) {
                      gam2.action.box[box.type].tick(box);
                    }
                    if (pos === cpos && box.repaint) {
                      gam2.view.paint('b' + box.pos, box, box.repaint);
                    }
         }
      }
      },
      'selectRecepie': function(box, recepie) {
          box.recepie = recepie;

          box.repaint = 1;
          gam2.view.drawBox(box,0);
      },
      'popup': function(params=0, contentHdlr = 0, closeHdlr = 0) {
        //r(gam2.view.content).css('position: fixed; height:100%; overflow:hidden');

          let onClose = (function(closeHdlr) {
              return function () {
                  r($('.popbox-over')).remove(0);
                  r(gam2.view.pbox).remove(0);
                  gam2.view.pbox = null;

                  closeHdlr && closeHdlr(params);
              }
          })(closeHdlr);
        
        let c= r(gam2.view.main)
           .container('popbox-over','div')
            .up()
           .container('popcont', 'div')
               .container('popbox', 'div')
                   .container('boxclose', 'div')
                     .addButton('close', onClose , 'button btn-danger')
                   .up();
           
        contentHdlr && contentHdlr(c, onClose, params);
        
        c = c.up().el;
        gam2.view.pbox = c;
      },
      'recepies': function(box) {
        this.popup(box, function(c, onClose, box) {
          let res = gam2.model.res;
        let recp = gam2.model.res.recepies;


            c = c
                .br(1)
                .addButton('select', (function(box, rec) {
                    return function() {
                        gam2.action.selectRecepie(box, rec);
                        onClose();
                    }
                })(box, 0), 'button btn-danger', {'style':'float: left'})

                .container('','div','color:yellow')
                .addText('Empty')
                .up();


        for(let i in recp) {
          let reso= res.reg[recp[i].out];
          let rec= recp[i];
          
          if(Object.keys(rec.inp).length >3) {
            continue;
          }
          
          c = c
            .br(1)
            .addButton('select', (function(box, rec) {
              return function() {
                gam2.action.selectRecepie(box, rec);
                  onClose();
              }
            })(box, rec), 'button btn-success', {'style':'float: left'})
            
            .container('','div','color:white')
            .addText(reso.name)
            .up()
        
            .container('slot slot-output', 'div')
            .addJqEl(res.getResIco(rec.out))
            .container('amount', 'div')
            .addText(1)
            .up()
            .up();

            
         c = c.container('slot-spc', 'div', 'width: 20px;')
         .up();
            
          for(let j in rec.inp) {
            c = c.container('slot', 'div')
             .addJqEl(res.getResIco(j))
             .container('amount', 'div')
               .addText(rec.inp[j])
             .up()
             .up();
          }
          
          c = c.br(1);
        }

        });
        
      },
      'lvlUp': function (box) {
        var cr= this.model.loc.current;
        if(!(cr.p.crkey in gam2.model.box.list)) {
          return;
        }
        var b = this.model.box.list[cr.p.crkey];

        do{
          if('sloti' in b.p) {
            b.p.sloti++;
            b.p.repaint = 1;
          }
        } while(b = b.next);
        //gam2.view.deleteEls(gam2.view.cardBox);
        //gam2.view.deleteEls(gam2.view.cardBox);

        gam2.view.drawBoxes();
      },
        'hdl': {
          'ref':function (object, method) {
            return function() {
              return method.apply(object, arguments);
            };
          },
        },
        'loc': {
            'selectLoc': function(bi, p,p0,p1,p2,p3) {
               // console.log('selectLoc '+ p0,p1,p2,p3);

              gam2.view.deleteEls(gam2.view.cardOpt);
              //gam2.view.locEnd.first().next().remove();
             // gam2.view.locEnd.first().remove();
          
              var lvl = p[bi].lvl;
              var pos = p[bi].pos;
              var xr, pp;
              gam2.view.locEnd.prev().remove();
              gam2.view.locEnd.remove();

              var cr = gam2.model.loc.current;
              var first;

              if (null === cr) {
                  first = 1;
                  cr = gam2.model.loc.list.first.get(pos);
              } else {
                  first = 0;
                  cr = cr.child.first.get(pos);
              }
                  /*
                  console.table(pp);

                  gam2.model.loc.current = xr.first.get(pos);

                  gam2.view.drawLoc();
                  gam2.view.showLocOptions(pp);
                  return;*/

              gam2.model.loc.current= cr;
              
              gam2.view.drawLoc();
              
              
              if (cr.p.lvl === 0) {
                  xr = gam2.view.genLocs(lvl+1,pos,0,0,0);
                  pp = gam2.model.constr.getPropList(xr.first,1,0);

                  p0 = pos;

                  cr.child = xr;
                  xr.setParentObj(cr);
                  //console.table(pp);
              } else if(cr.p.lvl < 3) {
                  if (lvl === 1) {
                      p1 = pos;
                  } else if (lvl === 2) {
                      p2 = pos;
                  } else if (lvl === 3) {
                      p3 = pos;
                  }
                 // console.log('sssf', p0, p1, p2, p3);

                  xr = gam2.view.genLocs(cr.p.lvl + 1, p0, p1, p2, p3);
                  pp = gam2.model.constr.getPropList(xr.first, 1, 0);
                  cr.child = xr;
                  xr.setParentObj(cr);
                  //console.table(pp);
              } else {
                p3 = pos;
              }
              
              gam2.model.loc.currentPos = [p0,p1,p2,p3].join('.');
              
              gam2.view.drawBoxes(1);
              gam2.view.showLocOptions(pp, p0, p1, p2, p3);
            },
            'unlockLoc': function (el, bi, plist) {
               if(Object.keys(gam2.view.cardBox).length) {
                 gam2.view.deleteEls(gam2.view.cardBox);
                 gam2.init.topBar();
               }
              
               var box= plist[bi];
               var card = gam2.view.card;
               var cr = gam2.model.loc.current;
               if(cr.lvl === 3) {
                 gam2.model.loc.oldCurrentComplet = cr;
               }

               var p0,p1,p2,p3;
               p0= box.lvl<=0?0:plist[0].pos;
               p1= box.lvl<=1?0:plist[1].pos;
               p2= box.lvl<=2?0:plist[2].pos;
               p3= box.lvl<=3?0:plist[3].pos;
               if(box.lvl === 0 && ('loc0' in card)) {
                 r(card['loc0']).clear();
                 delete card['loc0'];
                 
               }
               if(box.lvl <= 1 && ('loc1' in card)) {
                 if(box.lvl===1) {
                   r(card['loc1']).clear();
                 } else {
                   r(card['loc1']).remove();
                   delete card['loc1'];
                 }
                 
               }
               if(box.lvl <= 2 && ('loc2' in card)) {
                 if(box.lvl===2) {
                   r(card['loc2']).clear();
                 } else {
                   r(card['loc2']).remove();
                   delete card['loc2'];
                 }
               }
               if(box.lvl <= 3 && ('loc3' in card)) {
                 el.unbind('click');
                 if(box.lvl===3) {
                   r(card['loc3']).clear();
                 } else {
                   r(card['loc3']).remove();
                   delete card['loc3'];
                 }
      
               }
               var ncr = cr;
               if(box.lvl === 0) {
                   ncr = null;
               } else {
                   do {
                     ncr = ncr.parent;
                   } while (ncr.p.lvl >= box.lvl);
               }

               /*
               if (box.lvl <= 3) {
                 ncr = ncr.parent;
               }
               if(box.lvl <= 2) {
                 ncr = ncr.parent;
               }
               if (box.lvl <= 1) {
                 ncr = ncr.parent;
               }
               if (box.lvl === 0) {
                 ncr = null;
               }*/
               gam2.model.loc.current = ncr;
               gam2.model.loc.currentPos = [p0,p1,p2,p3].join('.')
               //console.log('new-cr', ncr.p);

              // gam2.view.locEnd = r(el).up().el.next();
              // [p0, p1, p2, p3] = gam2.view.getLocPs(box);
                
                var xr = gam2.view.genLocs(box.lvl,p0,p1,p2,p3);
                var p = gam2.model.constr.getPropList(xr.first,1,0);
                if(ncr) {
                  ncr.child = xr;
                  xr.setParentObj(ncr);
                } else {
                    ncr = xr;
                    gam2.model.loc.list = ncr;
                }
                //console.table(p);
                
                gam2.view.showLocOptions(p,p0,p1,p2,p3);
            },
        }
    },
}



export { gam2 };
