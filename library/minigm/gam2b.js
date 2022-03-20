import {DbStorageConstr} from "/library/modules/DbStorage.js";

let r = function (el) {
  return vs.from(el);
}

window.r = r;

window.exp = function (circ) {
  // Note: cache should not be re-used by repeated calls to JSON.stringify.
  var cache = [];
  let j = JSON.stringify(circ, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      // Duplicate reference found, discard key
      let idx = cache.indexOf(value);
      if (idx >= 0) return '*ref[' + idx + ']`*';

      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // Enable garbage collection
  return j;
}

$('document').ready(function () {
  console.log('begin');

  if ('vs' in window) {
    vs.page('Gam2');

    var ra = vs.clearBody()
      .section('top')
      .br()
      .addButton('Index', '/index.html', 'button btn-info')
      .addButton('Cache', function () {
        gam2.mem.loadData();
      }, 'button btn-success')
      .addButton('Load', function () {
        if (!confirm('load?')) {
          return 0
        }
        ;gam2.mem.loadSlot();
      }, 'button btn-info')
      .addButton('Save', function () {
        if (!confirm('save?')) {
          return 0
        }
        ;gam2.mem.saveSlot();
      }, 'button btn-danger')
      .addButton('+++', function () {
        gam2.idle.calcSec(3600);
        console.log('+3600')
      }, 'button btn-light')
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
    this.model.rand.seed.ship = rd.hashCode(seed + 'ship', 65536/2);

    for (var i of ['init', 'model', 'view', 'action']) {
      this.init.parents.apply(gam2[i]);
    }
    this.model.constr.init();
    this.view.topBar = r(ra).container('topbar', 'div').el;

    this.init.topBar();
    this.view.content = r(ra).container('content', 'div').el;
    this.model.res.init();
    this.init.boot();
    this.view.draw();
    this.init.events();
    console.log(gam2.model.box.list);
  },
  'idle': {
    'calcSec': function (secs) {
      let f = gam2.action.everySec.bind(gam2.action);
      gam2.model.flags.calcIdle = 1;

      let cpos = gam2.model.loc.currentPos;
      gam2.model.loc.currentPos = '0.0.0.0';


      for (let s = 0; s < secs; s++) {
        f(0);
      }

      gam2.model.flags.calcIdle = 0;
      gam2.model.loc.currentPos = cpos;

      gam2.view.card = {}
      gam2.view.cardMenu = {};
      gam2.view.cardBox = {};
      gam2.view.cardOpt = {};
      gam2.view.content.html('');
      gam2.view.topBar.html('');

      gam2.view.draw();


    },
    'getTime': function (secs) {
      let s = secs % 60;
      //s= ((s< 10)?'0':'')+s;
      let m = Math.floor((secs - s) / 60) % 60;
      //m = ((m< 10)?'0':'')+m;
      let h = Math.floor((secs - m) / 3600);
      return (h ? (h + 'h ') : '') + (m ? (m + 'm ') : '') + (s ? (s + 's') : '');
      return Math.floor(100 * secs / 3600) / 100 + 'h';
    },
    'calcTimeIdle': function (lastTs) {
      return Math.floor(((new Date()).getTime()) / 1000 - lastTs);
    },
    'calcPos': function (pos) {
      let p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
      if (!p.length) {
        return;
      }


      let prt = {}, pb = {};
      for (const i in p) {
        if (!p.hasOwnProperty(i)) {
          continue;
        }
        pb[p[i].pos] = p[i];
        if (p.to) {
          prt[p.to[1]] = p[i].pos;
        }
      }
      var root = {}, notAll = 0;
      for (const i in prt) {
        if (!(prt[i] in prt)) {
          root.push(prt[i]);
        }
      }
      // mark pass
      /*
        r1=a1/s1
        rt'=r1*ts

        a= 1/3
        b= 1/2

            a   b
        t0 3/0 0/0
        t1 3/0 0/0
        t2 3/0 0/0
        t3 2/1 1/0
        t4 2/1 1/0
        t5 2/1 0/1
        t6 1/2 1/1
        t7 1/2 1/1
        t8 1/2 0/2
        t9 0/3 1/2
        t0 0/3 1/2
        t1 0/3 0/2

        */
      if (notAll) {

      }
    }
  },
  'mem': {
    'currentSlot': 0,
    'saveSlot': function () {
      gam2.dbStorage.save(this.getData(0), 0, this.currentSlot, 1, function () {
        alert('Saved')
      });
    },
    'loadSlot': function () {
      gam2.dbStorage.load(function (data) {
        gam2.mem.loadData(JSON.stringify(data));
      }, function (data) {
        return 0
      }, this.currentSlot);
    },
    'getData': function (asJSON = 1) {
      let cpos = gam2.model.loc.currentPos;
      let bx = gam2.model.box;
      let lp = gam2.action.box['launch-pad'];
      let data = {'cpos': cpos, 'bxlist': {}, 'seeds': {}, 'lp': {}};
      data.seeds.root = gam2.model.rand.seed.root;
      for (let c in bx.list) {
        let plist = gam2.model.constr.getPropList(bx.list[c]);
        data.bxlist[c] = [];
        for (let i in plist) {
          data.bxlist[c].push(bx.toObj(plist[i]));
        }
      }
      data.conveyor = gam2.action.box.belts.conveyor;
      data.lp.plans = {};
      for (let p in lp.plans) {
        if (!lp.plans.hasOwnProperty(p)) {
          continue;
        }
        if (typeof lp.plans[p] === 'object') {
          data.lp.plans[p] = {};
          for (let i in lp.plans[p]) {
            if (!lp.plans[p].hasOwnProperty(i)) {
              continue;
            }
            if (typeof lp.plans[p][i] === 'object') {
              if (i === 'ship') {
                data.lp.plans[p][i + '.id'] = lp.plans[p].ship.id;
              } else if (i === 'box') {
                data.lp.plans[p][i + '.ref'] = [lp.plans[p].cpos, lp.plans[p].box.pos];
              } else if (i === 'loan') {
                data.lp.plans[p][i + '.id'] = lp.plans[p].loan.id;
              } else if (Array.isArray(lp.plans[p][i])) {
                data.lp.plans[p][i] = lp.plans[p][i];
              } else {
                data.lp.plans[p][i] = bx.toObj(lp.plans[p][i]);
              }
            } else {
              data.lp.plans[p][i] = lp.plans[p][i];
            }
          }
        } else {
          data.lp.plans[p] = lp.plans[p];
        }
      }

      data.lp.ships = {};
      for (let p in lp.ships) {
        if (!lp.ships.hasOwnProperty(p)) {
          continue;
        }
        if (typeof lp.ships[p] === 'object') {
          data.lp.ships[p] = {};
          for (let i in lp.ships[p]) {
            if (!lp.ships[p].hasOwnProperty(i)) {
              continue;
            }
            if (typeof lp.ships[p][i] === 'object') {
              if (i === 'loan') {
                data.lp.ships[p][i + '.id'] = lp.ships[p].loan.id;
              } else if (i === 'plan') {
                data.lp.ships[p][i + '.id'] = lp.ships[p].plan.id;
              } else {
                data.lp.ships[p][i] = bx.toObj(lp.ships[p][i]);
              }
            } else {
              data.lp.ships[p][i] = lp.ships[p][i];
            }
          }
        } else {
          data.lp.ships[p] = lp.ships[p];
        }
      }

      data.lp.loans = {};
      for (let p in lp.loans) {
        if (!lp.loans.hasOwnProperty(p)) {
          continue;
        }
        if (typeof lp.loans[p] === 'object') {
          data.lp.loans[p] = {};
          for (let i in lp.loans[p]) {
            if (!lp.loans[p].hasOwnProperty(i)) {
              continue;
            }
            if (typeof lp.loans[p][i] === 'object') {
              if (i === 'ship') {
                data.lp.loans[p][i + '.id'] = lp.loans[p].ship.id;
              } else {
                data.lp.loans[p][i] = bx.toObj(lp.loans[p][i]);
              }
            } else {
              data.lp.loans[p][i] = lp.loans[p][i];
            }
          }
        } else {
          data.lp.loans[p] = lp.loans[p];
        }
      }

      data.coins = gam2.model.box.coins;
      data.lastTs = Math.floor(((new Date()).getTime()) / 1000);
      //c = gam2.model.box.toObj(gam2.model.box.list['7.5.7.2'].p); JSON.stringify(c);
      //gam2.model.constr.getPropList(gam2.model.box.list[gam2.model.loc.currentPos], 1, 0);

      return asJSON ? JSON.stringify(data) : data;
    },
    'loadData': function (dataText = 0) {
      dataText = dataText ? dataText :
        '{"cpos":"7.5.7.2","bxlist":{"7.5.7.2":[{"type":"dwellings","pos":1,"level":89113,"levelCost":100,"levelCostFloat":100,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":3,"everySec":15,"capacity":5,"usage":2},{"type":"miner","pos":2,"level":17,"levelCost":65536,"levelCostFloat":65536,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":0,"tickAmount":17,"maxTickAmount":50,"maxAmount":8100,"outputId":14,"everySec":5,"slotOut":[{"posi":-1,"poso":0,"item":14,"amount":0,"unitValue":9,"form":"","is":"slot","requireAmount":0}],"slotsOut":1,"to":["7.5.7.2",4],"clearTik":0},{"type":"storage","pos":3,"level":11,"levelCost":177147,"levelCostFloat":177147,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":0,"slots":5,"maxAmount":2500,"slot":[{"posi":0,"poso":-1,"item":23,"amount":2500,"unitValue":2824,"form":"","is":"slot","requireAmount":0,"selected":0},{"posi":1,"poso":-1,"item":23,"amount":2500,"unitValue":2824,"form":"","is":"slot","requireAmount":0,"selected":0},{"posi":2,"poso":-1,"item":23,"amount":2500,"unitValue":2824,"form":"","is":"slot","requireAmount":0},{"posi":3,"poso":-1,"item":23,"amount":2500,"unitValue":2824,"form":"","is":"slot","requireAmount":0},{"posi":4,"poso":-1,"item":23,"amount":2500,"unitValue":2824,"form":"","is":"slot","requireAmount":0}],"from":1,"clearTik":0,"tickPaint":1},{"type":"crafter","pos":4,"level":15,"levelCost":163840,"levelCostFloat":163840,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":2,"slots":2,"slot":[{"posi":0,"poso":-1,"item":14,"amount":34,"unitValue":9,"form":"","is":"slot","requireAmount":0,"reqAmount":70},{"posi":1,"poso":-1,"item":0,"amount":0,"unitValue":0,"form":"","is":"slot","requireAmount":0,"selected":0}],"slotsOut":1,"tickAmount":15,"maxTickAmount":50,"maxAmount":7100,"slotOut":[{"posi":-1,"poso":0,"item":19,"amount":0,"unitValue":770,"form":"","is":"slot","requireAmount":0}],"from":1,"to":["7.5.7.2",5],"everySec":7,"clearTik":0,"recepie":{"inp":{"14":70},"out":19,"outAmount":1,"unitValue":770}},{"type":"crafter","pos":5,"level":14,"levelCost":81920,"levelCostFloat":81920,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":0,"slots":2,"slot":[{"posi":0,"poso":-1,"item":19,"amount":0,"unitValue":770,"form":"","is":"slot","requireAmount":0,"reqAmount":9,"selected":0},{"posi":1,"poso":-1,"item":0,"amount":0,"unitValue":0,"form":"","is":"slot","requireAmount":0}],"slotsOut":1,"tickAmount":14,"maxTickAmount":50,"maxAmount":6600,"slotOut":[{"posi":-1,"poso":0,"item":23,"amount":0,"unitValue":2824,"form":"","is":"slot","requireAmount":0,"selected":0}],"from":1,"to":["7.5.7.2",3],"everySec":7,"clearTik":0,"recepie":{"inp":{"19":9},"out":23,"outAmount":3,"unitValue":2824}},{"type":"crafter","pos":6,"level":1,"levelCost":10,"levelCostFloat":10,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":0,"slots":1,"slot":[{"posi":0,"poso":-1,"item":0,"amount":0,"unitValue":0,"form":"","is":"slot","requireAmount":0}],"slotsOut":1,"tickAmount":1,"maxTickAmount":50,"maxAmount":100,"slotOut":[{"posi":-1,"poso":0,"item":0,"amount":0,"unitValue":0,"form":"","is":"slot","requireAmount":0}],"from":1,"to":0,"everySec":0,"clearTik":0,"recepie":0},{"type":"launch-pad","pos":9,"level":1,"levelCost":5,"levelCostFloat":5,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":0,"pads":1,"pad":[{"pos":0,"shipId":0,"plan":0,"is":"pad"}],"slots":1,"slot":[{"posi":0,"poso":-1,"item":0,"amount":0,"unitValue":0,"form":"","is":"slot","requireAmount":0}],"from":1,"to":0,"clearTik":1,"tickPaint":1},{"type":"builder","pos":10,"level":"","levelCost":10000,"levelCostFloat":10000,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":0,"timer":0}],"7.5.7.4":[{"type":"builder","pos":1,"level":"","levelCost":10000,"levelCostFloat":10000,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":1,"timer":0}],"7.5.7.5":[{"type":"laboratory","pos":1,"level":1,"levelCost":200000,"levelCostFloat":200000,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":1,"timer":0,"everySec":0,"researchPoints":10},{"type":"R&D-center","pos":2,"level":1,"levelCost":200000,"levelCostFloat":200000,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":1,"timer":0,"everySec":0,"researchPoints":5},{"type":"dwellings","pos":3,"level":89113,"levelCost":100,"levelCostFloat":100,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":1,"timer":3,"everySec":15,"capacity":5,"usage":2},{"type":"launch-pad","pos":5,"level":1,"levelCost":5,"levelCostFloat":5,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":1,"timer":0,"pads":1,"pad":[{"pos":0,"shipId":1,"plan":0,"is":"pad"}],"slots":1,"slot":[{"posi":0,"poso":-1,"item":0,"amount":0,"unitValue":0,"form":"","is":"slot","requireAmount":0}],"from":1,"to":0,"clearTik":1,"tickPaint":1},{"type":"builder","pos":6,"level":"","levelCost":10000,"levelCostFloat":10000,"moneyCost":0,"peopleCost":0,"powerCost":0,"is":"box","rot":0,"repaint":1,"timer":0}]},"seeds":{"root":"gam2b5xBxhe$X54B8sd"},"lp":{"plans":{"id":1},"ships":{"id":1},"loans":{"id":1}},"coins":{"7.5.7.2":{"money":75544,"ppl":[4,20],"power":[5,50]},"7.5.7.5":{"money":498475,"ppl":[100,200],"power":[20,100]},"7.5.7.4":{"money":10000,"ppl":[0,20],"power":[0,50]}},"lastTs":1646995499}';

      let data = JSON.parse(dataText);
      let bx = gam2.model.box;
      let cs = gam2.model.constr;
      let lastTs = 0;
      let lp = gam2.action.box['launch-pad'];
      gam2.model.flags.loading = 1;

      if ('coins' in data) {
        gam2.model.box.coins = {...data.coins};
      }
      if ('seeds' in data) {
        gam2.model.rand.seed.root = data.seeds.root;
      }
      if ('cpos' in data) {
        gam2.model.loc.currentPos = data.cpos;
      }
      if ('lastTs' in data) {
        lastTs = data.lastTs;
      }
      if ('conveyor' in data) {
        gam2.action.box.belts.conveyor = data.conveyor;
      }

      gam2.model.box.list = {};
      if ('bxlist' in data) {
        for (let c in data.bxlist) {
          if (!data.bxlist.hasOwnProperty(c)) {
            continue;
          }
          for (let i in data.bxlist[c]) {
            if (!data.bxlist[c].hasOwnProperty(i)) {
              continue;
            }
            //console.log('i:',i);
            if (i === "0") {
              bx.list[c] = cs.addBox(bx.fromObj(data.bxlist[c][i]));
            } else {
              bx.list[c] = bx.list[c].nextObj(
                cs.addBox(bx.fromObj(data.bxlist[c][i]))
              );
            }
          }
        }
      }

      if ('lp' in data) {
        let hasAllStruct = ('ships' in data.lp) && ('loans' in data.lp) && ('plans' in data.lp);
        //hasAllStruct = false;

        if (hasAllStruct && ('loans' in data.lp)) {
          for (let p in data.lp.loans) {
            lp.loans[p] = bx.fromObj(data.lp.loans[p]);
          }
        }

        if (hasAllStruct && ('ships' in data.lp)) {
          for (let p in data.lp.ships) {
            lp.ships[p] = bx.fromObj(data.lp.ships[p]);
          }
        }
        if (hasAllStruct && ('plans' in data.lp)) {
          for (let p in data.lp.plans) {
            if (!data.lp.plans.hasOwnProperty(p)) {
              continue;
            }
            if (typeof data.lp.plans[p] === 'object') {
              lp.plans[p] = {};
              let cpos, pos;
              for (let i in data.lp.plans[p]) {
                if (!data.lp.plans[p].hasOwnProperty(i)) {
                  continue;
                }
                if (typeof data.lp.plans[p][i] === 'object') {
                  if (i === 'ship.id') {
                    lp.plans[p].ship = lp.ships[data.lp.plans[p][i]];
                  } else if (i === 'box.ref') {
                    [cpos, pos] = data.lp.plans[p][i];
                    lp.plans[p].box = gam2.model.box.findBoxByRef(cpos, pos);
                  } else if (i === 'loan.id') {
                    lp.plans[p].loan = lp.loans[data.lp.plans[p][i]];
                  } else if (Array.isArray(data.lp.plans[p][i])) {
                    lp.plans[p][i] = data.lp.plans[p][i];
                  } else {
                    lp.plans[p][i] = bx.fromObj(data.lp.plans[p][i]);
                  }
                } else {
                  lp.plans[p][i] = data.lp.plans[p][i];
                }
              }
            } else {
              lp.plans[p] = data.lp.plans[p];
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

      let secs = 0;

      if (lastTs) {
        secs = gam2.idle.calcTimeIdle(lastTs);
        gam2.idle.calcSec(secs);
      }
      let coins = gam2.action.getCoins();
      gam2.view.paintTopBar(coins);

      console.log(gam2.action.box['launch-pad'].plans)
      alert('Loaded. ' + (lastTs ? 'Passed ' + gam2.idle.getTime(secs) : ''));

      console.log(
        'loaded boxes:',
        gam2.model.constr.getPropList(gam2.model.box.list[gam2.model.loc.currentPos], 1, 0)
      )
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
    'events': function () {
      setInterval(gam2.action.everySec.bind(gam2.action), 1000);
    },
    'boot': function () {
      let cr;
      let rd = this.model.rand.rd;
      let rdChr = this.model.rand.rdChr;

      let seedLoc = this.model.rand.seed.loc0;
      let seedRes = this.model.rand.seed.res;
      let seedBox = this.model.rand.seed.box;

      let locProps = gam2.model.constr.locProps;

      let p0 = rd.rand(1, 10, seedLoc);
      let p1 = rd.rand(1, 10, seedLoc);
      let p2 = rd.rand(1, 10, seedLoc);
      let p3 = rd.rand(1, 2, seedLoc);
      let p3b = 4;
      let p3c = 5;
      // console.log(p0+','+p1+','+p2+','+p3);

      gam2.model.loc.pmap = {
        0: {[p0]: locProps(p0, 'sun', 0, 'Icarus')},
        [[p0].join('.')]: {[p1]: locProps(p1, 'asteroid-belt', 1, 'Cloud Rupler', p0)},
        [[p0, p1].join('.')]: {[p2]: locProps(p2, 'asteroid', 2, 'Jadvis', p0 + '.' + p1)},
        [[p0, p1, p2].join('.')]: {
          [p3]: locProps(p3, 'asteroid-st', 3, 'Balder', p0 + '.' + p1 + '.' + p2),
          [p3b]: locProps(p3b, 'trade-st', 3, 'L3', p0 + '.' + p1 + '.' + p2),
          [p3c]: locProps(p3c, 'research-st', 3, 'M8', p0 + '.' + p1 + '.' + p2),
        },
      }

      console.log(gam2.model.loc.pmap);

      var xr = gam2.view.genLocs(0, 0, 0, 0, 0, 0, {[p0]: locProps(p0, 'sun', 0, 'Icarus')});
      var loc = xr.first.get(p0)

        .addChildObj(
          gam2.view.genLocs(1, p0, 0, 0, 0, p1, {[p1]: locProps(p1, 'asteroid-belt', 1, 'Cloud A2')}).get(p1)
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
              locProps(p1, 'asteroid-belt', 1, 'Cloud ' + rdChr(seedLoc, 1, 0).toUpperCase() + rdChr(seedLoc, 0, 1))
            )
          )
          .addChildObj(
            this.model.constr.addLoc(
              locProps(p2 - 1, 'asteroid', 2, rdChr(seedLoc, 1, 0).toUpperCase() + rdChr(seedLoc, 0, 1))
            )
          )
          .nextObj(
            this.model.constr.addLoc(
              locProps(p2, 'asteroid', 2, rdChr(seedLoc, 1, 0).toUpperCase() + rdChr(seedLoc, 0, 1))
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
      this.model.loc.currentPos = [p0, p1, p2, p3].join('.');

      window.cr = cr;
      // console.log('cr', cr);

      var blist =
        this.model.constr.addBox(
          {type: 'dwellings', everySec: 15, pos: 1, level: 1, levelCost: 100, capacity: 5, usage: 2}
        ).nextObj(
          this.model.constr.addBox(
            this.action.box.miner.defaults({type: 'miner', pos: 2})
          )
        ).nextObj(
          this.model.constr.addBox(
            this.action.box.storage.defaults({type: 'crafter', pos: 3})
          )
        )
          .nextObj(
            this.model.constr.addBox(
              {type: 'builder', level: '', levelCost: 10000, pos: 4}
            )
          );

      var blistb = this.model.constr.addBox(
        {type: 'builder', level: '', levelCost: 10000, pos: 1}
      )

      var blistc =
        this.model.constr.addBox(
          {type: 'laboratory', everySec: 0, pos: 1, level: 1, levelCost: 200000, researchPoints: 10}
        )
          .nextObj(
            this.model.constr.addBox(
              {type: 'R&D-center', everySec: 0, pos: 2, level: 1, levelCost: 200000, researchPoints: 5}
            )
          )
          .nextObj(
            this.model.constr.addBox(
              {type: 'dwellings', everySec: 15, pos: 3, level: 1, levelCost: 100, capacity: 5, usage: 2}
            )
          ).nextObj(
          this.model.constr.addBox(
            {type: 'builder', level: '', levelCost: 10000, pos: 4}
          )
        );


      /*
            .nextObj(
              this.model.constr.addBox(
                this.action.box.miner.defaults({ type: 'miner', pos: 3 })
              )
              //this.model.constr.addBox({type:'cargo', sloti:8, slots: 8, slot: {}, pos:3, level:1, levelCost: 10})
            )
            .nextObj(
              this.model.constr.addBox(
                  //{type:'crafter', sloti:2, slots: 3, slotsOut:1, slot: {}, slotOut:{}, pos:4, level:3, levelCost: 10}
                    this.action.box.storage.defaults({ type: 'crafter', pos: 4 })
              )
            )
            .nextObj(
              this.model.constr.addBox({ type: 'cargo', sloti: 24, slots: 8, slot: {}, pos: 5, level: 1, levelCost: 10 })
            )
            .nextObj(
              this.model.constr.addBox({ type: 'cargo', sloti: 36, slots: 8, slot: {}, pos: 6, level: 1, levelCost: 10 })
            )
            .nextObj(
              this.model.constr.addBox({ type: 'assembler', sloti: 2, slots: 2, slotsOut:1, slot: {}, pos: 7, level: 1, levelCost: 10 })
            )
              .nextObj(
                  this.model.constr.addBox( // { type: 'storage', sloti: 36, slots: 8, slot: {}, pos: 8, level: 1, levelCost: 10 })
                    this.action.box.crafter.defaults({ type: 'crafter', pos: 8 })
                  )
              )

              .nextObj(
                  this.model.constr.addBox({ type: 'seller', sloti: 36, slotsOut: 4, slot: {}, pos: 9, level: 1, levelCost: 10 })
              )
              .nextObj(
                  this.model.constr.addBox({ type: 'launch-pad', pads: 2, pad: {}, pos: 10, level: 1, levelCost: 10 })
              )*/

      var crkey = [p0, p1, p2, p3].join('.');


      this.model.box.list = {};

      this.model.box.list[crkey] = blist.first;


      this.model.box.list[[p0, p1, p2, p3b].join('.')] = blistb.first;

      this.model.box.list[[p0, p1, p2, p3c].join('.')] = blistc.first;

      p = gam2.model.constr.getPropList(cr, 1, 1);

      this.model.box.coins = {};
      this.model.box.coins[crkey] = {
        'money': 10000,
        'ppl': [4, 20],
        'power': [5, 50],
      }

      this.model.box.coins[[p0, p1, p2, p3c].join('.')] = {
        'money': 500000,
        'ppl': [100, 200],
        'power': [20, 100],
      }

      this.model.box.coins[[p0, p1, p2, p3b].join('.')] = {
        'money': 10000,
        'ppl': [0, 20],
        'power': [0, 50],
      }
      gam2.model.res.gen(55);
      gam2.model.reputation.genh(8);
      gam2.model.res.genRecepies();
      gam2.model.res.genItems();
      
      gam2.view.paintTopBar(
      this.model.box.coins[crkey]
      );

      console.log(gam2.model.res.recepies);
    },
    'topBar': function (money = 0, pplUsg = 0, ppl = 0, powerUsg = 0, power = 0) {
      if (gam2.model.flags.calcIdle) {
        return;
      }
      if (!this.view.topBarVals && power === 0) {
        return;
      }
      this.view.topBarVals = (power !== 0);
      r(this.view.topBar)
        .clear()
        .addText(' ')

        .container('fa fa-donate', 'i')
        .up()
        .container('s-money', 'span')
        .addText(money)
        .up()

        .container('fa fa-plug', 'i')
        .up()
        .container('s-power', 'span')
        .addText(powerUsg + ' / ' + power)
        .up()

        .container('fa fa-child', 'i')
        .up()
        .container('s-people', 'span')
        .addText(pplUsg + ' / ' + ppl)
        .up()
        .up();
    }
  },
  'view': {
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
        'paint': function (id, box, clear = 0) {
          let opt = {};
          let act = gam2.action.box.miner;

          let state = gam2.action.box.miner.state(box);

          let btns = {}, btns2 = {};

          if (clear) {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();
          } else {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

            //btns.add = state.actionsUpdate();
          }

          opt.lvl = box.level;

          opt.btns = btns;
          opt.btns2 = btns2;
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

          gam2.action.popup(box, function (c, onClose, box) {
            let p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
            if (!p.length) {
              return;
            }

            for (const i in p) {
              if (!p.hasOwnProperty(i)) {
                continue;
              }
              if (!('from' in p[i])) {
                continue;
              }
              if (p[i].pos === box.pos) {
                continue;
              }
              c = c.br()
                .addButton('select', (function (box, cpos, pos) {
                  return function () {
                    gam2.action.box.miner.selectTo(box, cpos, pos);
                    onClose();
                  }
                })(box, cpos, p[i].pos), 'button btn-success', {'style': 'float: left'})

                .container('', 'div', 'color:white')
                .addText(p[i].type + ' ' + p[i].level + ' P:' + p[i].pos)
                .up()
                .br()

            }
          })
        }
      },
      'R&D-center': {
        'paint': function (id, box, clear = 0) {
          if (!clear) {
            return {timerClear: 1};
          }

          let btns = {clr: 1, add: []}, btns2 = {clr: 1, add: []};

          btns.add.push(['inf', (function (box) {
            return function () {
              gam2.action.box.storage.rot3(box)
            }
          })(box), 'btn-light']);

          btns2.add.push(['Drop', (function (box) {
            return function () {
              gam2.action.dropBox(box)
            }
          })(box), 'btn-danger']);
          btns2.add.push(['inf', (function (box) {
            return function () {
              gam2.action.box.storage.rot3(box)
            }
          })(box), 'btn-light']);
          let cpos = gam2.model.loc.currentPos;

          return {
            lvl: box.level,
            timerClear: 1,
            btns: btns,
            btns2: btns2,
            content: [
              {
                type: 'slot',
                slotRefs: {slot: {item: 0, amount: 0, unitValue: 0}, box: box, cpos:cpos},
                selected: 0,
                res: 8,
                amount: 3,
                missing: 1
              },
            ],
          };
        }
      },
      'laboratory': {
        'paint': function (id, box, clear = 0) {
          if (!clear) {
            return {timerClear: 1};
          }

          let btns = {clr: 1, add: []}, btns2 = {clr: 1, add: []};

          btns.add.push(['inf', (function (box) {
            return function () {
              gam2.action.box.storage.rot3(box)
            }
          })(box), 'btn-light']);

          btns2.add.push(['Drop', (function (box) {
            return function () {
              gam2.action.dropBox(box)
            }
          })(box), 'btn-danger']);
          btns2.add.push(['inf', (function (box) {
            return function () {
              gam2.action.box.storage.rot3(box)
            }
          })(box), 'btn-light']);
          let cpos = gam2.model.loc.currentPos;

          return {
            lvl: box.level,
            timerClear: 1,
            btns: btns,
            btns2: btns2,
            content: [
              {
                type: 'slot',
                slotRefs: {slot: {item: 0, amount: 0, unitValue: 0}, box: box, cpos:cpos},
                selected: 0,
                res: 8,
                amount: 3,
                missing: 1
              },
            ],
          };
        }
      },
      'dwellings': {
        'paint': function (id, box, clear = 0) {
          if (!clear) {
            return {timerClear: 1};
          }

          let btns = {clr: 1, add: []}, btns2 = {clr: 1, add: []};

          btns.add.push(['inf', (function (box) {
            return function () {
              gam2.action.box.storage.rot3(box)
            }
          })(box), 'btn-light']);

          btns2.add.push(['Drop', (function (box) {
            return function () {
              gam2.action.dropBox(box)
            }
          })(box), 'btn-danger']);
          btns2.add.push(['inf', (function (box) {
            return function () {
              gam2.action.box.storage.rot3(box)
            }
          })(box), 'btn-light']);
          let cpos = gam2.model.loc.currentPos;

          return {
            lvl: box.level,
            timerClear: 1,
            btns: btns,
            btns2: btns2,
            content: [
              {
                type: 'slot',
                slotRefs: {slot: {item: 8, amount: 3, unitValue: 0}, box: box, cpos:cpos},
                selected: 0,
                res: 8,
                amount: 3,
                missing: 1
              },
            ],
          };
        }
      },
      'trader': {
        'paint': function (id, box, clear = 0) {
          let opt = {};

          let state = gam2.action.box.trader.state(box);

          let btns = {}, btns2 = {};

          if (clear) {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          } else {
            //btns.add = state.actionsUpdate();

            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          }

          opt.lvl = box.level;

          opt.btns = btns;
          opt.btns2 = btns2;

          let clearTikOpt = state.clearTikOpt();
          if (clearTikOpt === 1) {
            opt.tikUp = true;
          }

          if (clear) {
            opt.content = state.content();
          }

          return opt;
        }
      },
      'bank': {
        'paint': function (id, box, clear = 0) {
          let opt = {};

          let state = gam2.action.box.bank.state(box);

          let btns = {}, btns2 = {};

          if (clear) {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          } else {
            //btns.add = state.actionsUpdate();

            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          }

          opt.lvl = box.level;

          opt.btns = btns;
          opt.btns2 = btns2;

          let clearTikOpt = state.clearTikOpt();
          if (clearTikOpt === 1) {
            opt.tikUp = true;
          }

          if (clear) {
            opt.content = state.content();
          }

          return opt;
        }
      },
      'belts': {
        'paint': function (id, box, clear = 0) {
          let opt = {};

          let state = gam2.action.box.belts.state(box);

          let btns = {}, btns2 = {};

          if (clear) {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          } else {
            //btns.add = state.actionsUpdate();

            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          }

          opt.lvl = box.level;

          opt.btns = btns;
          opt.btns2 = btns2;

          let clearTikOpt = state.clearTikOpt();
          if (clearTikOpt === 1) {
            opt.tikUp = true;
          }

          if (clear) {
            opt.content = state.content();
          }

          return opt;
        }
      },
      'storage': {
        'paint': function (id, box, clear = 0) {
          let opt = {};

          let state = gam2.action.box.storage.state(box);

          let btns = {}, btns2 = {};

          if (clear) {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          } else {
            //btns.add = state.actionsUpdate();

            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

          }

          opt.lvl = box.level;

          opt.btns = btns;
          opt.btns2 = btns2;

          let clearTikOpt = state.clearTikOpt();
          if (clearTikOpt === 1) {
            opt.tikUp = true;
          }

          if (clear) {
            opt.content = state.content();
          }

          return opt;
        }
      },
      'cargo': {
        'paint': function (id, box) {
          var sl = gam2.model.constr.getPropList(box.slot);
          var content = [];
          for (let i = 0; i < sl.length; i++) {
            content.push(
              {type: 'slot', res: 20 + i + box.sloti, amount: i},
            );
          }

          return {
            lvl: box.level,
            timerClear: 1,
            btns: {clr: 1, addSpacer: 1},
            content: content,
          };
        }
      },
      'launch-pad': {
        'paint': function (id, box, clear) {
          let opt = {};
          let act = gam2.action.box.storage;

          let state = gam2.action.box['launch-pad'].state(box);

          let btns = {}, btns2 = {};

          btns.clr = 1;
          btns.add = state.actions();
          btns2.clr = 1;
          btns2.add = state.actions2();

          if (clear) {
            opt.content = state.content();
          }

          opt.lvl = box.level;
          opt.btns = btns;
          opt.btns2 = btns2;

          return opt;
        }
      },
      'defences': {
        'paint': function (id, box) {
          return {
            btns: {clr: 1, addSpacer: 1},
            content: [
              {type: 'defence-pad', subType: 0},
            ],
          };
        }
      },
      'power': {
        'paint': function (id, box) {
          return {
            btns: {clr: 1, addSpacer: 1},
            content: [
              {type: 'power-pad', subType: 0},
            ],
          };
        }
      },
      'builder': {
        'paint': function (id, box) {
          let btns = {clr: 1};

          if (this.allowBuild()) {
            btns.add = [['build', (function (box) {
              return function () {
                gam2.action.build(box)
              }
            })(box), 'btn-light']];
          } else {
            btns.addSpacer = 1;
          }
          var cpos = gam2.model.loc.currentPos;
          let p
          if (!(cpos in gam2.model.box.list)) {
            p = [];
          } else {
            p = gam2.model.constr.getPropList(gam2.model.box.list[cpos]);
          }
          let totalBoxes = p.length - 1;
          let ltype = gam2.model.loc.current.p.type;
          let maxBoxes = (ltype in gam2.model.loc.maxBoxes) ? gam2.model.loc.maxBoxes[ltype] : 0;
          return {
            btns: btns,
            content: [{type: 'text', text: totalBoxes + ' / ' + maxBoxes}],
          };
        },
        'allowBuild': function () {
          let maxBoxes = gam2.model.loc.current.p.maxBoxes;
          var cpos = gam2.model.loc.currentPos;

          if ((cpos in gam2.model.box.list)) {
            let p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
            if (!p.length) {
              return 0;
            }

            if (p.length <= maxBoxes) {
              return 1;
            }
          }
        }
      },
      'crafter': {
        'paint': function (id, box, clear = 0) {
          let opt = {};
          let act = gam2.action.box.miner;

          let state = gam2.action.box.crafter.state(box);

          let btns = {}, btns2 = {};

          if (clear) {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();
          } else {
            btns.clr = 1;
            btns.add = state.actions();
            btns2.clr = 1;
            btns2.add = state.actions2();

            //btns.add = state.actionsUpdate();
          }

          opt.lvl = box.level;

          opt.btns = btns;
          opt.btns2 = btns2;
          let clearTikOpt = state.clearTikOpt();
          if (clearTikOpt === 1) {
            opt.tikUp = true;
          }
          if (clearTikOpt === -1) {
            opt.tikUp = false;
            opt.timerClear = 1;
          }
          opt.content = state.content();

          return opt;
        }
      },

    },
    'draw': function () {
      this.drawLoc(1);
      this.drawBoxes(1);
    },
    'drawLoc': function () {
      var cr = this.model.loc.current;
      var divs = [
        r(this.view.content)
          .container('m-2 bg-card', 'div', '', 0, 1)
          .el,
        r(this.view.content)
          .container('m-2 bg-card', 'div', '', 0, 1)
          .el
      ].reverse();

      if (cr === null) {
        return;
      }

      var p = gam2.model.constr.getPropList(cr, 0, 1);
      if (p.length) {
        p = p.reverse();

        var containerDiv;
        var el;

        for (const i in p) {
          if (!p.hasOwnProperty(i)) {
            continue;
          }
          if (i % 2 === 0) {
            containerDiv =
              divs[Math.floor(i / 2)];

            /*r(this.view.content)
                       .container('m-2 bg-card', 'div', '',0, 0)
                       .el;*/

          }
          el = this.drawCard('loc' + i, p[i], containerDiv);

          el.click((function (el, bi, plist) {
            return function () {
              gam2.action.loc.unlockLoc(el, bi, plist);
            }
          })(el, i, p));
        }
        this.view.locEnd = divs[1];
      }
    },
    'paintTopBar': function (coins) {
      gam2.init.topBar(
        coins.money,
        coins.ppl[0], coins.ppl[1],
        coins.power[0], coins.power[1]
      );
      
      let b= gam2.action.box.bank.banks;
      let cpos = gam2.model.loc.currentPos;
      if(cpos in b) {
        for(let boxPos in b[cpos]) {
            let box = gam2.model.box.findBoxByRef(cpos, boxPos);
          //  console.log('kk',cpos, boxPos, box);
            if(box) {
              box.repaint = 1;
              gam2.view.drawBox(box, 0);
            }
        }
      }
    },
    'drawBox': function (box, paintAll = 0) {
      if (gam2.model.flags.calcIdle) {
        return;
      }
      let id = 'b' + box.pos;
      if (paintAll) {
        this.drawCard(id, box);
      }
      this.paint(id, box, paintAll || box.repaint);
    },
    'drawBoxes': function (paintAll = 0) {
      var cpos = gam2.model.loc.currentPos;

      if (!(cpos in gam2.model.box.list)) {
        return;
      }
      if (cpos in gam2.model.box.coins) {
      } else {
        gam2.init.topBar();
      }
      let p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
      if (!p.length) {
        return;
      }

      for (const i in p) {
        if (!p.hasOwnProperty(i)) {
          continue;
        }
        this.drawBox(p[i], paintAll);
      }

    },
    'drawCard': function (id, box, container = null, opt = 0, wTikSec = 0, redrawAll = 1) {
      if (!(box.type in this.model.cards)) {
        throw Error(box.type + ' not found')
      }
      var crd = this.model.cards[box.type];

      var house = (box.is === 'loc') ? box.house : 0;
      var x2 = (box.is === 'loc' && !opt) ? '-xs' : '', color = crd.bg, dashed = crd.dashed;

//crd.icon = (box.type==='cargo')?'empty':'empty';
      //color='empty';
      // dashed=1;
      var clr = (box.is === 'loc') ? 3 : 5;
      var icon = crd.icon + " b-clr i-clr" + clr + " " + crd.icon;
      if(box.type === 'empty') {
        icon = crd.icon +' i-cnstr';
        //color='dark';
      }

      var title = (box.is === 'loc') ? box.name : box.type;
      var topRight = (box.is === 'loc') ? box.loc : box.level;

      title = title.charAt(0).toUpperCase() + title.slice(1);

      var cel;

      cel = r(container ? container : this.view.content)
        .container((box.is === 'loc' && !opt ? 'mb-3' : 'm-2') + ' p-2 unlock bg-' + color + (opt && box.type!=='empty' ? ' option' + (box.locWithBuilds ? '-bl' : '') : '') + ' rounded box-shadow text-light bg-card' + x2 + ' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id': id})

        .container(box.is === 'box' ? 'face front m-2' : '', 'div')
        .container('fas fa-' + icon + ' fa-bgd' + x2 + ' fa-5x', 'div', '')
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
      } else {
        cel = cel
          .container('bottom' + x2, 'div')
          .container('pb-2 mb-0 h6-left', 'h6', 'float:left')
          .addText((!opt || x2 === '-xs') ? '' : box.type)
          .up()
          .container('pb-2 mb-0 h6-right', 'h6', 'float:right')

          .addJqEl(house ? gam2.model.reputation.getHouseIco(box.house) : '')

          .up()

          .up()
      }
      cel = cel.up()
        .up();


      if (box.is === 'box') {
        cel = cel
          .container('face back m-2', 'div')

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
      if (opt) {
        this.cardOpt[id] = cel;
      } else if (box.is === 'box') {
        this.cardBox[id] = cel;
      } else {
        this.card[id] = cel;
      }
      return cel;
    },
    'paint': function (id, box, clear = 0) {
      box.repaint = 0;

      var opt = {'btns': {}}; // = {btns:{'add':[['Lvl up', (function(box) { return function() {gam2.action.lvlUp(box)}})(box), 'btn-success']]}};

      if (clear) {
        opt.btns.clr = 1;
        opt.btns.addSpacer = 1;
        opt.tikUp = 0
        opt.texts = -1;
        opt.contentClear = 1;
        opt.timerClear = 1;
      }

      if ((box.type in gam2.view.box) && ('paint' in gam2.view.box[box.type])) {
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
      if (box.everySec) {
        opt.timer = box.everySec - ('timer' in box ? box.timer : 0);
        if (opt.timer) {
          opt.tikDelay = -box.timer;
        }
        opt.tikSec = box.everySec;
      }
      this.paintBox(id, opt);
      //gam2.view.paintBox('b1', {'texts': [gam2.model.res.getResIco(5)]});
    },
    'paintBox': function (id, options = {}) {
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
        'btns': 0,
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
      let timer = options.timer;
      let timerClear = options.timerClear;
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
        r(this.cardBox[id]).in('.timer').clear().addText(timer + 's');
      }

      let dBlock = r(this.cardBox[id]).in('.content .d-block');
      let dText = r(this.cardBox[id]).in('.content .d-text');
      if (strong) {
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
        for (let i in options.content) {
          dText = r(this.cardBox[id]).in('.content .d-text');

          let elem = options.content[i];
          if (elem.type === 'slot') {
            dText = dText.container('slot' + (elem.selected ? (elem.selected > 1 ? ' slot-selected'+elem.selected: ' slot-selected') : ''), 'div');

            dText.el.click((function (elem) {
                return function () {
                  gam2.action.slotClick($(this), elem.slotRefs, 0)
                }
              })(elem)
            );

            if (elem.res) {
              dText
                .addJqEl(gam2.model.res.getResIco(elem.res))
                .container(elem.missing ? 'req-amount' : 'amount', 'div')
                .addText(elem.amount)
                .up();
            }
            dText = dText.up();
          } else if (elem.type === 'slot-out') {
            dText = dText
              .container('slot slot-output' + (elem.missing ? ' slot-req-no-qty' : '') + (elem.selected ? (elem.selected === 2 ? ' slot-selected2' : ' slot-selected') : ''), 'div');

            dText.el.click((function (elem) {
                return function () {
                  gam2.action.slotClick($(this), elem.slotRefs, 0)
                }
              })(elem)
            );

            if (elem.res) {
              dText = dText
                .addJqEl(gam2.model.res.getResIco(elem.res))
                .container(elem.missing ? 'req-amount' : 'amount', 'div')
                .addText(elem.amount)
                .up()
            }
            dText = dText.up();
          } else if (elem.type === 'power-pad') {
            let icoClass = 'ico ', icoStyle = '';
            if (elem.subType === 'gas') {
              //icoClass += 'fas fa-location-arrow fa-4x p-2';
            } else {
              dText.container('power-pad', 'div').up();
              continue;
            }
            dText
              .container('power-pad', 'div')
              .container(icoClass, 'div', icoStyle)
              .up()
              .up();
          } else if (elem.type === 'defence-pad') {
            let icoClass = 'ico ', icoStyle = '';
            if (elem.subType === 'ion-battery') {
              //icoClass += 'fas fa-location-arrow fa-4x p-2';
            } else {
              dText.container('defence-pad', 'div').up();
              continue;
            }
            dText
              .container('defence-pad', 'div')
              .container(icoClass, 'div', icoStyle)
              .up()
              .up();
          } else if (elem.type === 'btn') {
            dText.addButton(elem.text, elem.click, 'button btn-'+ elem.color);
          } else if (elem.type === 'belt') {
            if (elem.refs) {

              /*
              dText = dText
                .container('belt');

              if(elem.refs.from.res) {
                dText = dText
                  .container('slot', 'div');

                dText.el.click(elem.refs.resetAction);

                dText.addJqEl(gam2.model.res.getResIco(elem.refs.from.item))
                  .container(elem.refs.from.missing ? 'req-amount' : 'amount', 'div')
                  .addText(elem.refs.from.amount)
                  .up()
                  .up();
              } else {
                dText = dText
                  .container('slot', 'div');

                dText.el.click(elem.refs.resetAction);
                dText = dText.up();
              }

              if(elem.refs.to.res) {
                dText = dText
                  .container('slot', 'div');

                dText.el.click((function () {
                  console.log('test00');
                  return elem.refs.resetAction;
                })());

                dText.addJqEl(gam2.model.res.getResIco(elem.refs.to.item))
                  .container(elem.refs.to.missing ? 'req-amount' : 'amount', 'div')
                  .addText(elem.refs.to.amount)
                  .up()
                  .up();
              } else {
                dText = dText
                  .container('slot', 'div');

                dText.el.click(elem.refs.resetAction);
                dText = dText.up();
              }
              dText = dText.up();
               */
              dText = dText
                .container('belt')
                //.addIcon('code', elem.showAction,'button btn-success')
                .addButton(dText.getIconEl('angle-left').append(' ').append(dText.getIconEl('angle-right')), elem.showAction, 'button btn-success')
                .addButton(dText.getIconEl('times'), elem.resetAction, 'button btn-danger')
                .up();

            } else {
              dText = dText
                .container('belt')
                .addButton('No flow', elem.noFlowAction, 'button btn-info')
                .up();
            }
          } else if (elem.type === 'pad') {
            let icoClass = 'ico ', icoStyle = '', icoPos='';
            let house= elem.color;
            /*elem.ship='transporter';
            house=3;*/
            let houseE= gam2.model.reputation.house[house % gam2.model.reputation.house.length];
            icoStyle='color:'+houseE.color+';';
            if (elem.ship === 'airliner') {
              icoPos='bottom: 0; left: 0; transform: translate(22px, -20px) rotate(45deg);';
              icoClass += 'fas fa-location-arrow fa-3x p-2';
            } else if (elem.ship === 'cargo') {
              icoPos='bottom: 0; left: 0; transform: translate(13px, -11px) rotate(45deg)';
              icoClass += 'fas fa-box fa-3x p-2';
              icoStyle += "transform: translateX(0px) rotate(45deg);";
            } else if (elem.ship === 'transporter') {
              icoPos='bottom: 0; left: 0; transform: translate(16px, -9px) rotate(45deg);';
              icoClass += 'fas fa-brush fa-4x p-0';
              icoStyle += "transform: translateX(15px) rotate(-135deg);";
            } else {
              dText.container('pad', 'div').up();
              continue;
            }
            dText
              .container('pad', 'div')
              .container(icoClass, 'div', icoStyle)
              .up()
              .container('pad-house', 'div', icoPos)
                .addJqEl(house ? gam2.model.reputation.getHouseIco(house,20,1) : '')
              .up()
              .up();

          } else if (elem.type === 'text') {
            dText.addText(elem.text).br();
          } else if (elem.type === 'br') {
            dText.br(('count' in elem) ? elem.count : 1);
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
        buttons = Object.assign({}, {'clr': 0, 'addSpacer': 0, 'upd': {}, 'add': []}, buttons);

        let btn = r(this.cardBox[id]).in('.btns');

        rep(buttons, btn);
      }

      if (buttons2) {
        buttons2 = Object.assign({}, {'clr': 0, 'addSpacer': 0, 'upd': {}, 'add': []}, buttons2);

        let btn = r(this.cardBox[id]).in('.btns');

        rep(buttons2, r(this.cardBox[id]).in('.btns', 1))
      }

      let tick = r(this.cardBox[id]).in('.tik').clear();

      if (tikUp === false) {
        tick.el.attr('style', 'animation:none');
      } else if (tikUp === true && tikSec > 0) {
        style = 'animation-duration:' + tikSec + 's';
        if (tikDelay) {
          style += ';animation-delay: ' + tikDelay + 's';
        }
        tick.el.attr('style', 'animation:none');
        tick.el.get(0).offsetWidth;
        tick.el.attr('style', style);
        //gam2.view.paintBox('b2', {'lvl': 3, 'tikSec': 5, 'tikUp': true, 'tikDelay': -1})
      }
    },
    'getLocPs': function (box) {
      return [box.pos, 0, 0, 0];
    },
    'genLocs': function (lvl, p0 = 0, p1 = 0, p2 = 0, p3 = 0, forceAtPos = 0, mergeLocsP = 0) {
      let rd = this.model.rand.rd;
      let pmap = gam2.model.loc.pmap;
      let seedLoc = this.model.rand.seed['loc' + lvl];
      let seedLocId = rd.hashCode(seedLoc + p0 + '.' + p1 + '.' + p2 + '.' + p3, lvl);
      // console.log(seedLocId);
      let rdChr = this.model.rand.rdChr.bind(this.model.rand);
      let rdNam = this.model.rand.rdNam.bind(this.model.rand);
      let cstr = this.model.constr;
      rd.restartSeed(seedLocId);

      var pkeys;
      //console.log('bf pk',p0,p1,p2,p3);
      if (p0 === 0) {
        pkeys = [0];
      } else if (p0 > 0 && p1 === 0) {
        pkeys = [p0];
      } else if (p1 > 0 && p2 === 0) {
        pkeys = [p0, p1];
      } else if (p2 > 0 && p3 === 0) {
        pkeys = [p0, p1, p2];
      } else {
        pkeys = [p0, p1, p2, p3];
      }

      var pkey = pkeys.join('.');
      //  console.log('pkey '+pkey);
      if (pkey in pmap) {
        //console.log('pmp ',pmap[pkey]);
        mergeLocsP = pmap[pkey];
      }

      const maxPos = lvl === 3 ? 5 : 10;
      let cob, ccr;
      let types = [
        ['sun'],
        ['planet', 'asteroid-belt', 'asteroid-belt', 'asteroid-belt', 'gas-planet', 'ice-planet', 'arid-planet'],
        ['region', 'asteroid', 'moon'],
        ['city', 'asteroid-st', 'research-st', 'trade-st', 'storage-st']
      ];
      let type, posch = [], pops = [80, 90, 40, 40];
      if (forceAtPos) {
        posch.push(forceAtPos);
      }
      let pop = Math.round(maxPos * pops[lvl] / 100)
      if (1) {
        var q = 1, p = 0;
        for (let i = 0; i < pop; i++) {
          p = ((q +
            rd.rand(1, maxPos - i - 1, seedLocId))
            % maxPos) + 1;

          posch.push(p);
          q = p % maxPos;
        }
      }
      let house = 0;
      for (let pos = 1; pos <= maxPos; pos++) {
        if (lvl === 3 && 1) {
          house = rd.rand(2, gam2.model.reputation.house.length, seedLocId);
        } else {
          house = 0;
        }
        type = 'empty';
        if (posch.includes(pos)) {
          type = types[lvl][rd.rand(0, types[lvl].length - 1, seedLocId)];
        }

        cob = this.model.constr.addLoc(
          cstr.locProps(
            pos, type, lvl,
            type === 'empty' ? '' : (
              (lvl === 3) ?
                (
                  type === 'city' ? rdNam(seedLocId) :
                    rdChr(seedLocId, 1, 0).toUpperCase() + rdChr(seedLocId, 0, 1)
                )
                : (type === 'asteroid-belt' ? 'Cloud ' : '') + rdNam(seedLocId)

            )
            , '', house)
        );
        if (mergeLocsP && (pos in mergeLocsP)) {
          cob.p = mergeLocsP[pos];
        }
        if (!ccr) {
          ccr = cob;
          continue;
        }
        ccr = ccr.nextObj(cob);
      }
      return ccr.first;
    },
    'deleteEls': function (els) {
      for (const i in els) {
        if (!els.hasOwnProperty(i)) {
          continue;
        }
        r(els[i]).remove();
        delete els[i];
      }
    },
    'showLocOptions': function (p, p0, p1, p2, p3) {
      //console.log('showLocOptions '+ p0,p1,p2,p3);
      gam2.view.deleteEls(gam2.view.cardOpt);
      var containerDiv;
      var el;
      let i=0;

     for (const i in p) {
  
        if (!p.hasOwnProperty(i)) {
          continue;
        }
   
        if (p[i].type === 'empty') {
          if(p[i].lvl===3) {
            el = this.drawCard('opt' + i, p[i], null, 1);
          }
          continue;
        }
        p[i].locWithBuilds = this.findLocWithBuilds(i, p[i], p0, p1, p2, p3);

        el = this.drawCard('opt' + i, p[i], null, 1);

        el.click((function (i, p, p0, p1, p2, p3) {
          return function () {
            gam2.action.loc.selectLoc(i, p, p0, p1, p2, p3);
          }
        })(i, p, p0, p1, p2, p3));
      }
    },
    'findLocWithBuilds': function (i, loc, p0, p1, p2, p3) {
      var lvl = loc.lvl;
      if (lvl === 0) {
        p0 = loc.pos;
      } else if (lvl === 1) {
        p1 = loc.pos;
      } else if (lvl === 2) {
        p2 = loc.pos;
      } else if (lvl === 3) {
        p3 = loc.pos;
      }
      ;
      var ps = [p0];
      if (p1 !== 0) {
        ps.push(p1);
      }
      if (p2 !== 0) {
        ps.push(p2);
      }
      if (p3 !== 0) {
        ps.push(p3);
      }
      var bl = gam2.model.box.list;
      var c = ps.join('.');
      var bkeys = Object.keys(bl);
      const found = bkeys.find(el => {
        if (el.includes(c)) {
          return true;
        }

      });
      return (found !== undefined);
    },
  },
  'model': {
    'flags': {
      'loading': 0,
      'calcIdle': 0,
    },
    'cards': {
      'sun': {
        'icon': 'sun',
        'bg': 'empty',
        'dashed': 1,
      },
      'asteroid-belt': {
        'icon': 'braille',
        'bg': 'empty',
        'dashed': 1,
      },
      'asteroid': {
        'icon': 'cookie-bite fa-sml',
        'bg': 'empty',
        'dashed': 1
      },
      'moon': {
        'icon': 'moon fa-med',
        'bg': 'empty',
        'dashed': 1,
      },
      'planet': {
        'icon': 'adjust',
        'bg': 'empty',
        'dashed': 1,
      },
      'region': {
        'icon': 'map',
        'bg': 'empty',
        'dashed': 1,
      },
      'city': {
        'icon': 'city',
        'bg': 'empty',
        'dashed': 1,
      },
      'gas-planet': {
        'icon': 'moon',
        'bg': 'empty',
        'dashed': 1,
      },
      'ice-planet': {
        'icon': 'bowling-ball',
        'bg': 'empty',
        'dashed': 1,
      },
      'arid-planet': {
        'icon': 'cookie',
        'bg': 'empty',
        'dashed': 1,
      },
      'empty': {
        'icon': 'plus',
        'bg': 'cnstr',
        'dashed': 1,
      },
      'asteroid-st': {
        'icon': 'toggle-on',
        'bg': 'empty',
        'dashed': 1,
      },
      'research-st': {
        'icon': 'ring fa-med',
        'bg': 'empty',
        'dashed': 1,
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
        'bg': 'dark',
        'dashed': 0,
      },
      'laboratory': {
        'icon': 'cubes',
        'bg': 'crafter',
        'dashed': 0,
      },
      'R&D-center': {
        'icon': 'cubes',
        'bg': 'silo',
        'dashed': 0,
      },
      'dwellings': {
        'icon': 'cubes',
        'bg': 'power',
        'dashed': 0,
      },
      'assembler': {
        'icon': 'play',
        'bg': 'silo',
        'dashed': 0,
      },
      'warehouse': {
        'icon': 'play',
        'bg': 'gray',
        'dashed': 0,
      },
      'spaceport': {
        'icon': 'play',
        'bg': 'silo',
        'dashed': 0,
      },
      'trader': {
        'icon': 'play',
        'bg': 'silo',
        'dashed': 0,
      },
      'storage': {
        'icon': 'play',
        'bg': 'orange',
        'dashed': 0,
      },
      'bank': {
        'icon': 'money-bill-wave',
        'bg': 'dark',
        'dashed': 0,
      },
      'defences': {
        'icon': 'pallet',
        'bg': 'dark',
        'dashed': 0,
      },
      'power': {
        'icon': 'plug',
        'bg': 'power',
        'dashed': 0,
      },
      'belts': {
        'icon': 'pallet',
        'bg': 'darkcyan',
        'dashed': 0,
      },
      'launch-pad': {
        'icon': 'play',
        'bg': 'dark',
        'dashed': 0,
      },
      'builder': {
        'icon': 'plus',
        'bg': 'empty',
        'dashed': 1,
      },
      'docker': {
        'icon': 'play',
        'bg': 'dark',
        'dashed': 0,
      },
      'seller': {
        'icon': 'play',
        'bg': 'dark',
        'dashed': 0,
      },
      'transport': {
        'icon': 'location-arrow',
        'bg': 'crafter',
        'dashed': 0
      },
      'cargo': {
        'icon': 'location-arrow',
        'bg': 'empty',
        'dashed': 1,
      },
      'airliner': {
        'icon': 'square',
        'bg': 'crafter',
        'dashed': 0,
      },
      'crafter': {
        'icon': '',
        'bg': 'smelter',
        'dashed': 1,
      }
    },
    'loc': {
      'list': null,
      'current': null,
      'currentPos': '0.0.0.0',
      'maxBoxes': {
        'city': 50,
        'storage-st': 30,
        'research-st': 25,
        'asteroid-st': 20,
        'trade-st': 15,
      }
    },
    'slot': {
      'addItemToSlots': function (box, item, amount, unitValue) {
        var slots = gam2.model.constr.getPropList(box.slot)
        if (!slots.length) {
          //console.log('nosl');
          return false;
        }
        let slotItem = this.findSlotNonFullWithItem(slots, box, item);
        if (!slotItem) {
          slotItem = this.findNextEmptySlot(slots);
        }
        if (!slotItem) {
          //console.log('nofd');
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

        //console.log('allgd')

        return 1;
      },
      'subItemFromSlots': function (box, item, amount) {
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
      'amountExistsInSlots': function (box, item, amount) {
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
      'emptyAmountExistsInSlots': function (box, item, amount) {
        var slots = gam2.model.constr.getPropList(box.slot)
        if (!slots.length) {
          return false;
        }
        let sum = 0;
        for (let i in slots) {
          if (slots[i].item === item && slots[i].amount < box.maxAmount) {
            sum += box.maxAmount - slots[i].amount;
          } else if (slots[i].item === 0)
            sum = box.maxAmount;
        }
        return (amount > sum) ? 0 : 1;
      },
      'findSlotNonFullWithItem': function (slots, box, item) {
        for (let i in slots) {
          if (slots[i].item === item && slots[i].amount < box.maxAmount) {
            return slots[i];
          }
        }
        return 0;
      },
      'findNextEmptySlot': function (slots) {
        for (let i in slots) {
          if (slots[i].item === 0) {
            return slots[i];
          }
        }
        return 0;
      },
    },
    'box': {
      'findBoxByRef': function (cpos, pos) {
        var p = gam2.model.constr.getPropList(gam2.model.box.list[cpos]);
        if (!p.length) {
          return 0;
        }
        for (let i in p) {
          if (!p.hasOwnProperty(i)) {
            continue;
          }
          if (p[i].pos == pos) {
            return p[i];
          }
        }
        return 0;
      },
      'addSlotsFor': function (box) {
        if (!('slot' in box)) {
          return;
        }
        box.slot = gam2.model.constr.addSlot({'posi': 0});

        let slots = box.slots | 1;
        if (slots > 1) {
          let sl = box.slot;
          // console.log(pub.p);
          for (let i = 0; i < slots - 2; i++) {
            sl = sl.nextObj(
              gam2.model.constr.addSlot({'posi': i + 1})
            )
          }
        }
      },
      'addSlotOutsFor': function (box) {
        if (!('slotOut' in box)) {
          return;
        }

        box.slotOut = gam2.model.constr.addSlot({'poso': 0});
        let slotsOut = box.slotsOut | 1;
        if (slotsOut > 1) {
          let sl = box.slotOut;
          for (let i = 0; i < slotsOut - 2; i++) {
            sl = sl.nextObj(
              gam2.model.constr.addSlot({'poso': i + 1})
            )
          }
        }
      },
      'addBeltsFor': function(box) {
        if (!('belts' in box)) {
          return;
        }
        box.belt = gam2.model.constr.addBelt({'pos': 0});

        let belts = box.belts | 1;
        if (belts > 1) {
          let bl = box.belt;
          for (let i = 0; i < bl - 2; i++) {
            bl = bl.nextObj(
              gam2.model.constr.addBelt({'pos': i + 1})
            )
          }
        }
      },
      'addPadsFor': function (box) {
        if (!('pad' in box)) {
          return;
        }
        box.pad = gam2.model.constr.addPad({'pos': 0});

        let pads = box.pads | 1;
        if (pads > 1) {
          let pd = box.pad;
          // console.log(pub.p);
          for (let i = 0; i < pads - 2; i++) {
            pd = pd.nextObj(
              gam2.model.constr.addPad({'pos': i + 1})
            )
          }
        }
      },
      'fromObj': function (pub) {
        let box = {};
        for (let b in pub) {
          if (!pub.hasOwnProperty(b)) {
            continue;
          }
          if (Array.isArray(pub[b])) {
            if (!pub[b].length) {
              continue;
            }
            let first = pub[b][0];
            if (typeof first !== 'object' || !('is' in first)) {
              box[b] = pub[b];
              continue;
            }
            let chain = null;
            let idx = 0;
            for (let f in pub[b]) {
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
              if (first.is === 'pad') {
                if (idx === 0) {
                  chain = gam2.model.constr.addPad(pub[b][f]);
                } else {
                  chain = chain.nextObj(
                    gam2.model.constr.addPad(pub[b][f])
                  );
                }
              }
              if (first.is === 'belt') {
                if (idx === 0) {
                  chain = gam2.model.constr.addBelt(pub[b][f]);
                } else {
                  chain = chain.nextObj(
                    gam2.model.constr.addBelt(pub[b][f])
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
        if (typeof box === 'object' && (box !== null) && ('p' in box)) {
          return gam2.model.constr.getPropList(box.first, 1, 0);
        }
        for (let b in box) {
          if (!box.hasOwnProperty(b)) {
            continue;
          }
          if (typeof box[b] === 'object' && (box[b] !== null) && ('p' in box[b])) {
            pub[b] = gam2.model.constr.getPropList(box[b].first, 1, 0);
          } else {
            pub[b] = box[b];
          }
        }

        return pub;
      },
      'list': null,
      'coins': {},
      'coin': {
        'units': ['', 'K', 'M', 'G', 'T', 'R', 'S'],
        'add': function (a, b) {
          var r = {};
          if (b.u === a.u) {
            r = {...a};
            r.n = a.n + b.n;
          } else {
            r.u = this.biggestU(a.u, b.u);
            r.n = a.u ? a.n : b.n;
          }
          return r;
        },
        'sub': function (a, b) {
          var r = {};
          if (b.u === a.u) {
            r = {...a};
            r.n = a.n - b.n;
          } else {
            r.u = this.biggestU(a.u, b.u);
            r.n = a.u ? a.n : b.n;
          }
          return r;
        },
        'biggestU': function (a, b) {
          return this.units.indexOf(a) > this.units.indexOf(b) ? a : b;
        },
        'lastU': function (u, n) {
          var r = [];
          var i = this.units.indexOf(u);
          do {
            r.push(this.units[i]);
            i--;
          } while (i >= 0);
          return r;
        }
      }
    },
    'reputation': {
      'house': [],
      'icoList': ['paw', 'piggy-bank', 'poo-storm', 'sink', 'square-root-alt', 'superscript', 'university', 'utensils'],
      'colorList': ['cyan', 'pink', 'yellow', 'white', 'seagreen', 'salmon', 'lightgreen', 'lawngreen', 'orange', 'deepskyblue', 'firebrick', 'mediumvioletred', 'mediumpurple'],
      'colorUni': {},
      'init': function () {
        this.add('self', 'crown', 'yellow');
      },
      'add': function (name, ico = 0, color = 'light') {
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
        var icoList = [], colorList = [];
        for (let i = 0; i < num; i++) {
          if (!icoList.length) {
            icoList = [...this.icoList];
          }
          ico = rd.pickOneFrom(icoList, 1, seed);
          if (ico in this.colorUni && !this.colorUni[ico].length) {
            ico = rd.pickOneFrom(icoList, 1, seed);
          }
          suf = rd.randomBytes(1, 1) + rd.pickOneFrom(['um', 'um', 'is', 'ix', 'us', 'ad', 'am'], 0, seed);
          name = rd.randomName(rd.rand(2, 4), 0, suf, 0, seed);
          if (!(ico in this.colorUni)) {
            this.colorUni[ico] = [...this.colorList];
          }
          /*if (!colorList.length) {
                      colorList = [...this.colorUni[ico]];
                    }*/

          color = rd.pickOneFrom(this.colorUni[ico], 1, seed);
          this.add(name, ico, color);

          const idx = this.colorUni[ico].indexOf(color);

          /*if (idx > -1) {
                      this.colorUni[ico].splice(idx, 1);
                    }*/
          if (!this.colorUni[ico].length) {
            console.log('no for ' + ico)
          }
        }
        //console.log(this.reg)
      },
      'getHouseIco': function (id, size=24, noColor=0) {
        var house = this.house[id % this.house.length];
        // console.log(res, this.reg[id+1])
        return $('<i>').addClass('fas')
          .addClass('fa-' + house.ico)
          .attr('style', 'font-size: '+size+'px;'+(noColor?'color:white;':('color:' + house.color)));//.html(house.ico);
      },
    },
    'res': {
      'icoList': ['atom', 'adjust', 'cheese', 'bars', 'circle-notch', 'clone', 'cubes', 'cube', 'columns', 'glass-whiskey', 'database', 'dice-d6', 'dice-d20', 'dot-circle', 'egg', 'eject', 'equals', 'fire', 'fire-alt', 'flask', 'hockey-puck', 'grip-vertical', 'gem', 'radiation-alt', 'neuter', 'icicles', 'mountain', 'ring', 'shapes', 'share-alt-square', 'square', 'stop-circle', 'sun', 'tint', 'th-large', 'th', 'water', 'wave-square', 'window-restore', 'bong', 'flask', 'boxes'],
      'colorList': ["aliceblue", "antiquewhite", "aqua", "aquamarine", "biege", "bisque", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "coral", "cornflowerblue", "cyan", "darkcyan", "darkgreen", "darkorchid", "darkred", "deeppink", "deepskyblue", "darkslategray", "darkslateblue", "gold", "goldenrod", "gray", "greenyellow", "hotpink", "indianred", "lavender", "lemonchiffon", "lightblue", "lightcyan", "lightcoral", "lightseagreen", "lightskyblue", "lightsteelblue", "lime", "linen", "mediumaquamarine", "mediumseagreen", "mediumcoral", "mediumturquoise", "mediumvioletred", "mistyrose", "olive", "orangered", "orange", "palegoldenrod", "purple", "plum", "pink", "powderblue", "red", "rosybrown", "royalblue", "salmon", "sandybrown", "seagreen", "silver", "seashell", "springgreen", "steelblue", "teal", "tan", "thistle", "turquoise", "violet", "wheat", "white", "yellow", "yellowgreen"],
      'colorList2': ['cyan', 'pink', 'yellow', 'white', 'seagreen', 'salmon', 'lightgreen', 'lawngreen', 'orange', 'deepskyblue', 'firebrick', 'mediumvioletred', 'mediumpurple'],
      'colorList3': ['grape', 'grape'],
      'bioIconList': ['leaf', 'seedling', 'spa'],
      'itemIcoList': ['draw-polygon', 'stroopwafel', 'credit-card', 'money-check', 'ring', 'border-none', 'newspaper', 'minus-square', 'cogs', 'box-open', 'columns', 'dice-one'],
      'itemTypes': {
        'platform': {
          'over': 13,
          'low': 2,
          'big': 22
        },
        'station': {
          'asteroid': ['ship.construct', 'box.builder', 'platform.low'],
          'research': ['ship.construct', 'box.builder', 'platform.over'],
          'trade': ['ship.construct', 'box.builder', 'platform.big']
        },
        'box': {
          'miner': ['case.frame', 'platform.low', 'slot.low'],
          'crafter': ['case.frame', 'platform.low', 'slot.human'],
          'laboratory': ['case.frame', 'platform.low', 'slot.human'],
          'R&D-center': ['case.cube', 'platform.over', 'slot.big'],
          'seller': ['case.frame', 'platform.over', 'slot.low'],
          'dwellings': ['case.frame', 'platform.over', 'slot.human'],
          'platform': ['case.cube', 'platform.big', 14],
          'shipyard': ['case.cube', 'platform.over', 'slot.big'],
          'trader': ['case.frame', 'platform.low', 6],
          'power': ['case.frame', 'platform.over', 'slot.power'],
          'storage': ['case.frame', 'platform.over', 'engine.laser'],
          'launch-pad': ['case.frame', 'platform.low', 8],
          'belts': ['case.frame', 'platform.over', 'engine.inter'],
          'bank': ['case.frame', 'platform.over', 18],
          'builder': ['case.frame', 'platform.low', 4],
        },
        'case': {'hull': 21, 'cube': 12, 'frame': 1},
        'ship': {
          'airliner': ['case.hull', 'slot.human', 'engine.ion'],
          'cargo': ['case.hull', 'slot.big', 'engine.inter'],
          'transporter': ['case.hull', 'slot.low', 'engine.plasma'],
          'construct': ['case.hull', 'slot.big', 'engine.photon'],
        },
        'slot': {
          'low': ['case.frame', 3],
          'human': ['case.cube', 9],
          'big': ['case.cube', 15],
          'power': ['case.cube', 23]
        },
        'power': {
          'ion': ['case.cube', 5],
          'plasma': ['case.cube', 10],
          'laser': ['case.cube', 16],
          'inter': ['case.cube', 19],
          'photon': ['case.cube', 24]
        },
        'engine': {
          'ion': ['case.cube', 7],
          'plasma': ['case.frame', 'case.cube', 11],
          'laser': ['case.cube', 17],
          'inter': ['case.frame', 'case.cube', 20],
          'photon': ['case.frame', 'case.cube', 25]
        }
        //  {'ion':, 'plasma':1, 'laser':2, 'inter':2, 'photon':3}},
      },
      'colorUni': {},
      'mineIcoList': ['tint', 'shapes', 'tablets', 'soap', 'icicles', 'genderless', 'air-freshener', 'glass-whiskey', 'water'],
      'reg': [],
      'recepies': {},
      'init': function () {
        this.add('money', 'donate', 'white');
        this.add('moneyK', 'donate', 'yellow');
        this.add('moneyM', 'donate', 'greenyellow');
        this.add('moneyG', 'donate', 'aquamarine');
        this.add('moneyT', 'donate', 'lightblue');
        this.add('moneyR', 'donate', 'lightviolet');
        this.add('moneyS', 'donate', 'pink');

        this.add('power', 'battery-full', 'greenyellow');
        this.add('child', 'child', 'lightgreen');
      },
      'genItems': function () {
        let it = this.itemTypes;
        let rt = this.traverse(it, {});
        let map = {};
        let recp = this.recepies;
        let rd = gam2.model.rand.rd;
        let seed = gam2.model.rand.seed.res;
        let rl = Object.keys(recp).length;
        let rlmin = rl - 26;

        let itemIco = {}, itemColor = {}, itemColorList = {};
        window.itemIco = itemIco;

        let icoFn = function (r) {
          let pr = r.split('.');

          if (!(pr[0] in itemIco)) {
            itemIco[pr[0]] = rd.pickOneFrom(this.itemIcoList, 1, seed);
          }

          if (!(pr[0] in itemColorList)) {
            itemColorList[pr[0]] = [...this.colorList2];
          }

          if (!(pr[1] in itemColor)) {
            if (!itemColorList[pr[0]].length) {
              console.log('no more colors for ' + pr[0]);
            }
            itemColor[pr[1]] =
              rd.pickOneFrom(itemColorList[pr[0]], 1, seed);
          }

          return [itemIco[pr[0]], itemColor[pr[1]]];
        }

        for (let r in rt) {
          if (!rt.hasOwnProperty(r)) {
            continue;
          }
          map[r] = this.resolveItem(rlmin, r, rt, map, {}, 0, icoFn);
        }

        let rId;
        for (let r in map) {
          if (Array.isArray(map[r])) {
            if (this.isIntArr(map[r])) {
              map[r] = this.addItemRecepie(r, map, itemIco, itemColor, itemColorList);
            }
          }
        }
        for (let r in map) {
          if (Array.isArray(map[r])) {
            if (!this.isIntArr(map[r])) {
              map[r] = this.resolveItem(rlmin, r, rt, map, {}, 1, icoFn);
              if (this.isIntArr(map[r])) {
                map[r] = this.addItemRecepie(r, map, itemIco, itemColor, itemColorList);
              }
            }
          }
        }
        for (let r in map) {
          if (Array.isArray(map[r])) {
            if (!this.isIntArr(map[r])) {
              map[r] = this.resolveItem(rlmin, r, rt, map, {}, 1, icoFn);
              if (this.isIntArr(map[r])) {
                map[r] = this.addItemRecepie(r, map, itemIco, itemColor, itemColorList);
              }
            }
          }
        }
        //console.log(map, recp, this.reg)
      },
      'addItemRecepie': function (r, map, itemIco, itemColor, itemColorList) {
        let recp = this.recepies;
        let rd = gam2.model.rand.rd;
        let seed = gam2.model.rand.seed.res;

        let pr = r.split('.');
        if (!(pr[0] in itemIco)) {
          itemIco[pr[0]] = rd.pickOneFrom(this.itemIcoList, 1, seed);
        }

        if (!(pr[0] in itemColorList)) {
          itemColorList[pr[0]] = [...this.colorList2];
        }

        if (!(pr[1] in itemColor)) {
          if (!itemColorList[pr[0]].length) {
            console.log('no more colors for ' + pr[0]);
          }
          itemColor[pr[1]] =
            rd.pickOneFrom(itemColorList[pr[0]], 1, seed);
        }

        let newRecp = this.genRecepieFor(2, 123, 0, 5, {items: map[r], amount: 1});

        let rId = this.add(r, itemIco[pr[0]], itemColor[pr[1]], newRecp.unitValue);
        newRecp.out = rId;
        recp[rId + ':' + map[r].join('.')] = newRecp;

        return rId;
      },
      'resolveItem': function (rlmin, r, rt, map, ur = {}, subItems = 0, icoFn = 0) {
        if (this.isInt(rt[r])) {
          this.reg[rlmin - 1 + rt[r]].name = r;
          if (icoFn) {
            let ico, color;
            [ico, color] = icoFn.apply(this, [r]);
            this.reg[rlmin - 1 + rt[r]].ico = ico;
            this.reg[rlmin - 1 + rt[r]].color = color;
          }

          return rlmin - 1 + rt[r];
        } else if (Array.isArray(rt[r])) {
          let mapv = [];
          for (let t in rt[r]) {
            let q = rt[r][t];
            if (this.isInt(q)) {
              //this.reg[rlmin - 1 + q].name = r;

              mapv.push(rlmin - 1 + q);
            } else {
              if (q in map) {
                if (subItems && !this.isInt(map[q])) {
                  mapv.push(q);
                } else {
                  mapv.push(map[q]);
                }
              } else {
                if (q in ur) {
                  console.log(ur[q], rt[r]);
                  throw Error('Trying to resolve ' + q + ' second time.');
                }
                ur[q] = rt[r];


                mapv.push(q);
                this.resolveItem(rlmin, q, rt, map, ur, 0, icoFn)


                delete (ur[q])
              }

            }
          }
          return mapv;
        }
      },
      'isInt': function (value) {
        var x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
      },
      'isIntArr': function (arr) {
        return arr.every(element => {
          return typeof element === 'number';
        });
      },
      'traverse': function (obj, reduceArr, key = 0) {
        let v;
        for (let i in obj) {
          v = obj[i];
          if (Array.isArray(obj[i]) || (typeof obj[i] === 'number')) {
            reduceArr[key ? key + '.' + i : i] = obj[i];
            continue;
          }

          this.traverse(obj[i], reduceArr, key ? key + '.' + i : i);
        }
        return reduceArr;
      },
      'add': function (name, ico = 0, color = 'light', unitValue = 0) {
        var id = this.reg.length;
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
        var icoList = [], colorList = [];
        var unitValue = 0;
        for (let i = 0; i < num; i++) {
          if (i >= 0 && i <= 5) {
            unitValue = i + 4;
          }
          if (!icoList.length) {
            icoList = [...this.icoList];
          }
          ico = rd.pickOneFrom(icoList, 1, seed);
          if (ico in this.colorUni && !this.colorUni[ico].length) {
            ico = rd.pickOneFrom(icoList, 1, seed);
          }
          suf = rd.randomBytes(1, 1) + rd.pickOneFrom(['um', 'um', 'is', 'ix', 'us', 'ad', 'am'], 0, seed);
          name = rd.randomName(rd.rand(2, 4), 0, suf, 0, seed);
          if (!(ico in this.colorUni)) {
            this.colorUni[ico] = [...this.colorList2];
          }
          /*if (!colorList.length) {
                      colorList = [...this.colorUni[ico]];
                    }*/

          color = rd.pickOneFrom(this.colorUni[ico], 1, seed);
          this.add(name, ico, color, unitValue);

          const idx = this.colorUni[ico].indexOf(color);

          /*if (idx > -1) {
                      this.colorUni[ico].splice(idx, 1);
                    }*/
          if (!this.colorUni[ico].length) {
            console.log('no for ' + ico)
          }
        }
        //console.log(this.reg)
      },
      'getResIco': function (id) {
        var res = this.reg[id % this.reg.length];
        // console.log(res, this.reg[id+1])
        return $('<i>').addClass('fas')
          .addClass('fa-' + res.ico)
          .attr('style', 'font-size: 24px;color:' + res.color);
      },
      'genRecepies': function () {
        let seed = gam2.model.rand.seed.res;
        let resLength = this.reg.length;
        let numItems = 1;
        let recp, key, style = 0;
        for (let i = 15; i < resLength; i++) {
          numItems = 1;
          if (i > 20) {
            style++;
            style = style % 2;
          }
          if (i > 20 + Math.floor(15 * resLength / 100)) {
            numItems++;
          }
          if (i > 20 + Math.floor(45 * resLength / 100)) {
            numItems++;
          }
          if (i > 20 + Math.floor(75 * resLength / 100)) {


            numItems++;
          }

          if (i > Math.floor(88 * resLength / 100)) {
            //       numItems++;
          }

          if (numItems > 1 && rd.rand(1, 3, seed) > 1) {
            numItems = rd.rand(1, rd.rand(2, 3, seed), seed);
          }

          // if(style>0) {
          // for(let rr=0; rr<rd.rand(1,6, seed); rr++) {
          recp =
            this.genRecepieFor(style, i, numItems, i - numItems - 4)

          key = recp.out + ':' + Object.keys(recp.inp).sort().join('.');

          if (!(key in this.recepies)) {
            this.recepies[key] = recp;
            this.reg[recp.out].unitValue = recp.unitValue;
          }

          //  }
          // }

        }
      },

      'genRecepieFor': function (style = 0, item, numItems, minId = 5, opt = {}) {
        let seed = gam2.model.rand.seed.res;
        let reg = gam2.model.res.reg;
        let inp = {};
        let rd = gam2.model.rand.rd;
        let unitValue = 0;
        let amount = 1;
        //console.log(minId+': '+ reg[minId].unitValue)

        if (style === 0) {
          for (let i = minId; i < minId + numItems; i++) {
            let nItem = i; //rd.rand(minId, maxId, seed);
            inp[nItem] = rd.rand(5, 10, seed) * Math.pow(10, rd.rand(0, 1, seed));
            unitValue += inp[nItem] * reg[nItem].unitValue * (11) / (9);
            amount = 1;
          }
        } else if (style === 2) {
          for (let i in opt.items) {
            let nItem = opt.items[i];
            inp[nItem] = rd.rand(1, 5, seed) * Math.pow(10, rd.rand(0, 1, seed));
            unitValue += inp[nItem] * reg[nItem].unitValue * (11) / (9);
            amount = opt.amount;
          }
        } else if (style === 1) {
          let bmin = 10;
          if (numItems === 1) {
            let nItem = rd.rand(minId, minId + numItems, seed);
            inp[nItem] = rd.rand(2, 10, seed) * Math.pow(10, rd.rand(0, 1, seed));
            amount = rd.rand(1, 10, seed);
            unitValue = Math.ceil((inp[nItem] * reg[nItem].unitValue * (11) / (9)) / amount);
          } else {
            for (let i = minId; i < minId + numItems; i++) {
              let nItem = rd.rand(Math.min(bmin, minId - numItems * 2), minId + numItems, seed);
              inp[nItem] = rd.rand(2, 10, seed) * Math.pow(10, rd.rand(0, 1, seed));
              amount = rd.rand(1, 10, seed);
              unitValue += Math.ceil((inp[nItem] * reg[nItem].unitValue * (11) / (9)) / amount);
            }
          }

        }

        // reg[item].unitValue = unitValue;

        return {
          inp: inp,
          out: item,
          outAmount: amount,
          unitValue: Math.ceil(unitValue)
        }
      },
      'hexToHsl': function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);

        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
          h = s = 0; // achromatic
        } else {
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4;
              break;
          }
          h /= 6;
        }

        s = s * 100;
        s = Math.round(s);
        l = l * 100;
        l = Math.round(l);

        var colorInHSL = 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
      }
    },
    'rand': {
      'rd': null,
      'rdChr': function (seed, letter = 1, number = 1) {
        return gam2.model.rand.rd.randomBytes(1, letter ? 3 : 0, number, 0, '', seed);
      },
      'rdNam': function (seed) {
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
      'getAddFunc': function (defaultProp, callback = 0) {
        var defaults = JSON.parse(JSON.stringify(defaultProp));

        return (function (callback) {
          return function (prop) {
            var pub = {
              'p': {...defaults, ...prop},
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
              'setParentObj': function (obj) {
                this.parent = obj;
                obj.child = this.first;
                var n = this;
                while (n = n.next) {
                  n.parent = obj;
                }
              },
              'getBy': function (prop, val) {
                var c = this.first;
                var i = 1;
                while (!(prop in c.p && c.p[prop] === val)) {
                  c = c.next;
                  if (!c) {
                    return 0;
                  }
                }
                return c;
              },
              'get': function (num) {
                var c = this.first;
                var i = 1;
                while (i < num) {
                  c = c.next;
                  i++;
                }
                return c;
              },
              'last': function () {
                var c = this;
                let i = 0, imax = 1000;
                while ((c.next) && (i < 1000)) {
                  c = c.next;
                  i++;
                }
                return c;
              }
            };
            pub.first = pub;
            pub.firstParent = pub;
            if (typeof callback === 'function') {
              callback.apply(null, [pub]);
            }
            return pub;
          }
        })(callback);
      },
      'init': function () {
        this.addLoc = this.getAddFunc({
          'name': '',
          'type': '',
          'lvl': 0,
          'pos': 0,
          'card': 'empty',
          'is': 'loc',
        });

        this.addSlot = this.getAddFunc({
          'posi': -1,
          'poso': -1,
          'item': 0,
          'amount': 0,
          'unitValue': 0,
          'form': '',
          'type': 'slot',
          'is': 'slot',
          'requireAmount': 0,
        }, function (pub) {
          if (pub.p.item > 0) {
            pub.p.unitValue = gam2.model.res.reg[pub.p.item] ? gam2.model.res.reg[pub.p.item].unitValue : 0;
          }
        });

        this.addBelt = this.getAddFunc({
          'pos': -1,
          'conveyorId': 0,
          'is': 'belt',
        }, function (pub) {
          if (!pub.p.conveyorId) {
            let conveyor = gam2.action.box.belts.addConveyor();
            pub.p.conveyorId = conveyor.id;
          }
        });
        this.addPad = this.getAddFunc({
          'pos': -1,
          'shipId': 0,
          'plan': 0,
          'is': 'pad',
        });

        this.addBox = this.getAddFunc({
          'type': 0,
          'pos': 1,
          'level': 0,
          'levelCost': 0,
          'levelCostFloat': 0,
          'moneyCost': 0,
          'peopleCost': 0,
          'powerCost': 0,
          'is': 'box',
          'rot': 0,
          'repaint': 1,
          'timer': 0,
        }, function (pub) {
          pub.p.levelCostFloat = pub.p.levelCost;
          if (gam2.model.flags.loading) {
            return;
          }
          gam2.model.box.addSlotsFor(pub.p);
          gam2.model.box.addSlotOutsFor(pub.p);
          gam2.model.box.addPadsFor(pub.p);
          gam2.model.box.addBeltsFor(pub.p);
        });
      },
      'locProps': function (pos, type, lvl, name, crkey = '', house = 0) {
        let maxBoxes = (type in gam2.model.loc.maxBoxes) ? gam2.model.loc.maxBoxes[type] : 5;
        return {
          card: 'empty',
          is: 'loc',
          pos: pos,
          type: type,
          lvl: lvl,
          name: name,
          loc: 'L' + lvl + ':' + ((pos < 10) ? '0' : '') + pos,
          crkey: crkey + '.' + pos,
          house: house,
          maxBoxes: maxBoxes,
        };
      },
      'addLoc': function (prop) {
      },
      'addSlot': function (prop) {
      },
      'addPad': function (prop) {
      },
      'addBelt': function (prop) {
      },
      'addBox': function (prop) {
      },
      'walkList': function (obj, walkerCb, parentWalkInstead = 0) {
        if (typeof walkerCb !== 'function') {
          throw "walker is not a function!";
        }
        let s;
        if (typeof obj != 'object' || !('first' in obj)) {
          return [];
        }
        if (parentWalkInstead) {
          s = obj;
        } else {
          s = obj.first;
        }
        let exit = false;
        let i = 0;
        var rr = 0;
        do {
          rr = walkerCb(s, rr);
          if (++i >= 10000) break;
          if (parentWalkInstead) {
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
        this.walkList(obj, function (obj) {
          console.log(obj.p);
          return 1
        })
      },
      'getPropList': function (obj, detachResult = 0, parentWalkInstead = 0) {
        return this.walkList(obj, (detachResult) ?
          function (obj, rr) {
            if (!rr) {
              rr = [];
            }
            rr.push({...obj.p});
            return rr;
          } :
          function (obj, rr) {
            if (!rr) {
              rr = [];
            }
            rr.push(obj.p);
            return rr;
          },
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
      'put': function (name, hdl, ctx) {
        let L = this.list;
        if (!(name in L)) {
          L[name] = [];
        }
        L[name].push(hdl.bind(ctx));
      },
      'do': function (name, obj = {}) {
        let L = this.list;

        if (!(name in L) || !L[name].length) {
          return;
        }
        for (let t in L[name]) {
          L[name[t]].call(obj);
        }
      }
    },
    'slotSelectType': 'item',
    'slotSelectAfterFn':0,
    'slotSelectHalf': 0,
    'slotSelectedObj': 0,
    'slotFilterClick': function (el, ress, popupEl, onClose, box) {
      // console.log(el, ress, popupEl);

      let c = r(popupEl).clear();

      gam2.action.recepiesViewContent(c, onClose, box, ress);
    },
    'slotClick': function (el, obj, isOut = 0) {
      let oldObj = 0;
      let cpos = gam2.model.loc.currentPos;
      
      
      if (this.slotSelectType!=='item') {
        if(obj.slot.type!=='slot') {
          return;
        }
        obj.slot.selected = 3;
        
        if (this.slotSelectedObj) {
          oldObj = this.slotSelectedObj;
          this.slotSelectedObj = 0;
        
            oldObj.slot.selected = 0;
            oldObj.box.repaint = 1;
            gam2.view.drawBox(oldObj.box, 0);
        }
        this.slotSelectedObj = obj;
        
        if (this.slotSelectAfterFn) {
          let res = this.slotSelectAfterFn(cpos, obj.box.pos, obj.slot);
          if(res===1) {
            this.slotSelectedObj = 0;
            obj.slot.selected = 0;
          }
        }
        if (obj.box) {
          obj.box.repaint = 1;
          gam2.view.drawBox(obj.box, 0);
        }
        return;
      }
      if (this.slotSelectedObj && this.slotSelectedObj.cpos !== cpos) {
        this.slotSelectedObj.slot.selected = 0;
        this.slotSelectedObj.box.repaint = 1;
        this.slotSelectedObj=0;
        this.slotSelectHalf=0;
      }
      
      if (this.slotSelectedObj) {
        oldObj = this.slotSelectedObj;
        
        let returnAfter = 0;
        if (obj.slot === this.slotSelectedObj.slot) {
          this.slotSelectHalf = (this.slotSelectHalf + 1) % 2;
          if (this.slotSelectHalf) {
            oldObj.slot.selected = 2;

            oldObj.box.repaint = 1;
            gam2.view.drawBox(oldObj.box, 0);
            return;
          }
          returnAfter = 1;
        }


        this.slotSelectedObj = 0;

        if (returnAfter) {

          oldObj.slot.selected = 0;
          oldObj.box.repaint = 1;
          gam2.view.drawBox(oldObj.box, 0);

          console.log('retAfter');
          return;
        }
      }

      let moved = 0;
      if (oldObj && oldObj.slot.item > 0) {
        if (obj.slot.item !== oldObj.slot.item) {
          
          obj.slot.item = oldObj.slot.item;
          obj.slot.amount = 0;

        }
        let amount = oldObj.slot.amount;
        if (this.slotSelectHalf) {
          amount = Math.round(amount / 2);
        }
        
        obj.slot.amount += amount;
        obj.slot.unitValue = oldObj.slot.unitValue;
        if(amount===0) {
          obj.slot.item=0;
        }

        oldObj.slot.amount -= amount;
        if (oldObj.slot.amount <= 0) {
          if (oldObj.slot.posi != -1) {
            oldObj.slot.item = 0;
          }
          oldObj.slot.unitValue = 0;
        }
        
        
        if (oldObj.slot.type === 'bank' && obj.slot.type==='slot') {
          let coins = gam2.action.getCoins();
          let u = gam2.action.box.bank.u;
            
          let unit = u[oldObj.slot.item-1];
          coins.money -= amount* unit;
          gam2.view.paintTopBar(coins);
        } else if(obj.slot.type === 'bank' && oldObj.slot.type === 'slot') {
          let coins = gam2.action.getCoins();
          let u = gam2.action.box.bank.u;
        
          let unit = u[obj.slot.item - 1];
          coins.money += amount * unit;
          gam2.view.paintTopBar(coins);
        }

        //
        moved = 1;
      }

      if (oldObj) {
        oldObj.slot.selected = 0;
        oldObj.box.repaint = 1;
        gam2.view.drawBox(oldObj.box, 0);
      }

      if (!moved) {
        obj.slot.selected = this.slotSelectHalf ? 2 : 1;
        this.slotSelectedObj = obj;
        if(this.slotSelectAfterFn) {
          this.slotSelectAfterFn(cpos, obj.box.pos, obj.slot);
        }
      } else {
        this.slotSelectHalf = 0;

        obj.slot.selected = 0;
        this.slotSelectedObj = 0;
      }
      //console.log(el);


      if (obj.box) {
        obj.box.repaint = 1;
        gam2.view.drawBox(obj.box, 0);
      }

      //console.log('now', obj.slot);
      //console.log('old',oldObj.slot)
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
        'tick': function (box) {
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
          } else if (box.maxAmount - slot.amount > box.tickAmount) {
            slot.amount += box.tickAmount;
          } else {
            slot.amount = box.maxAmount;
          }
        },
        'defaults': function (box) {
          box.type = 'miner';
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
          box.maxAmount += 500;

          box.repaint = 1;
          //let coins = gam2.action.getCoins();
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'stopMine': function (box) {
          let bonusAmount = [2, 1, 1, 0, 0];
          box.tickAmount -= bonusAmount[(box.outputId - 10)];
          box.outputId = 0;
          box.everySec = 0;
          box.clearTik = -1;

          box.repaint = 1;
          gam2.view.drawBox(box, 0);
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
          gam2.view.drawBox(box, 0);
        },
        'prospect': function (box) {
          box.outputId = 10;
          let bonusAmount = [2, 1, 1, 0, 0];
          box.tickAmount += bonusAmount[(box.outputId - 10)];

          let slot = box.slotOut.p;
          if (slot.item === 0) {
            slot.item = box.outputId;
            slot.unitValue = box.outputId - 5;
            slot.amount = 0;
          }
          box.everySec = 5;
          box.clearTik = 1;

          box.repaint = 1;
          gam2.view.drawBox(box, 0);
        },
        'connectTo': function (box) {
          let ev = gam2.action.event;
          var cpos = gam2.model.loc.currentPos;

          if (!box.to) {
            gam2.view.box.miner.popupTo(box);
            //box.to = [cpos, 8];
            //ev.put('b'+box.pos);
          } else {
            box.to = 0;
          }

          box.repaint = 1;
          gam2.view.drawBox(box, 0);
        },
        'selectTo': function (box, cpos, pos) {
          box.to = [cpos, pos];

          box.repaint = 1;
          gam2.view.drawBox(box, 0);
        },
        'sendTo': function (box) {
          if (!box.to) {
            return;
          }
          let to, pos;
          [pos, to] = box.to;

          var cpos = gam2.model.loc.currentPos;
          let slot = box.slotOut.p;

          var p = gam2.model.constr.getPropList(gam2.model.box.list[pos])
          if (!p.length) {
            return;
          }
          let ev = gam2.action.event;

          for (let i in p) {
            if (p[i].pos === to) {
              let avl = Math.min(slot.amount, box.tickAmount);
              if (!avl) {

                return;
              }
              slot.amount -= avl;
              gam2.model.slot.addItemToSlots(p[i], slot.item, avl, slot.unitValue);

              /*
                slot.amount -= box.tickAmount;
                gam2.model.slot.addItemToSlots(p[i], slot.item, box.tickAmount, slot.unitValue);
*/
              //ev.do('b'+box.pos+'.miner.sendTo', box);

              if (cpos === pos) {
                //   console.log(p[i].slot.first.p);
                p[i].repaint = 1;

                gam2.view.drawBox(p[i], 0);
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
          gam2.view.drawBox(box, 0);
        },
        'state': function (box) {
          let state = {};
          let slot = box.slotOut.p;

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.tickAmount < box.maxTickAmount) {
              acts.push(['Lvl up', (function (box) {
                return function () {
                  gam2.action.box.miner.lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }

            if (!box.outputId) {
              acts.push(['Search', (function (box) {
                return function () {
                  gam2.action.box.miner.prospect(box)
                }
              })(box), 'btn-info']);
            }
            if (!box.outputId) {
              acts.push(['To', (function (box) {
                return function () {
                  gam2.action.box.miner.connectTo(box)
                }
              })(box), box.to ? 'btn-warning' : 'btn-success']);
            }

            if (box.outputId) {
              acts.push(['>', (function (box) {
                return function () {
                  gam2.action.box.miner.change(box)
                }
              })(box), 'btn-success']);
              acts.push(['Stop', (function (box) {
                return function () {
                  gam2.action.box.miner.stopMine(box)
                }
              })(box), 'btn-danger']);
            }
            if (slot.amount) {
              acts.push(['Sell*', (function (box) {
                return function () {
                  gam2.action.box.miner.sellAll(box)
                }
              })(box), 'btn-warning']);
            }

            acts.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);


            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);

            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let conts;
            let cpos = gam2.model.loc.currentPos;
            conts = [
              {
                type: 'slot-out',
                slotRefs: {slot: slot, box: box, cpos: cpos},
                selected: slot.selected,
                res: slot.item,
                amount: slot.amount,
                missing: (slot.item > 0 ? 0 : 1)
              }, {type: 'br'},
            ];

            if (slot.item > 0) {
              let res = gam2.model.res.reg[slot.item];
              conts.push({type: 'text', text: 'Res: ' + res.name + ' $' + slot.amount * slot.unitValue});
            }

            if (box.level < 50) {
              conts.push({type: 'text', text: 'Next Lvl: $' + box.levelCost});
            }

            conts.push({type: 'text', text: 'Mine +' + box.tickAmount + ' $' + box.tickAmount * slot.unitValue});

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
        'tick': function (box) {
          box.level++;
          box.repaint = 1;
        },
      },
      'laboratory': {
        'tick': function (box) {
          box.level++;
          box.repaint = 1;
        },
      },
      'R&D-center': {
        'tick': function (box) {
          box.level++;
          box.repaint = 1;
        },
      },
      'crafter': {
        'tick': function (box) {
          if (box.recepie) {
            gam2.action.box.crafter.craft(box);
          }
          if (box.to) {
            gam2.action.box.crafter.sendTo(box);
          }
          box.clearTik = 1;
          box.repaint = 1;
        },
        'craft': function (box) {
          if (!box.recepie) {
            return;
          }

          var slots = gam2.model.constr.getPropList(box.slot)

          let slotOut = box.slotOut.p;
          let rinp = box.recepie.inp;
          //console.log(box.recepie, slotOut);
          let step, t = 0;

          for (t = 0; t < box.tickAmount; t++) {
            step = 1;
            for (let r in rinp) {
              step &= gam2.model.slot.amountExistsInSlots(box, parseInt(r), rinp[r])
            }

            if (!step) {
              break;
            }

            for (let r in rinp) {
              gam2.model.slot.subItemFromSlots(box, parseInt(r), rinp[r])
            }
          }

          if (t === 0) {
            return;
          }
          t = t * box.recepie.outAmount;

          if (slotOut.amount > box.maxAmount) {
            //nothing to do, all is done
          } else if (box.maxAmount - slotOut.amount > t) {
            slotOut.amount += t;
          } else {
            slotOut.amount = box.maxAmount;
          }
        },
        'stopCraft': function (box) {
          gam2.action.selectRecepie(box, 0);
        },
        'defaults': function (box) {
          box.type = 'crafter';
          box.level = 1;
          box.levelCost = 10;
          box.levelCostFloat = 10;
          box.slots = 1;
          box.slot = {};
          box.slotsOut = 1;
          box.tickAmount = 1;
          box.maxTickAmount = 50;
          box.maxAmount = 100;
          box.slotOut = {};
          box.from = 1;
          box.to = 0;
          box.everySec = 0;
          box.clearTik = 0;

          box.recepie = 0;
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
          box.maxAmount += 500;
          if (box.level % 10 === 0 && box.level !== 50) {
            box.slots++;
            let last = box.slot.last();
            last.nextObj(
              gam2.model.constr.addSlot({'posi': last.p.posi + 1})
            )

          }


          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'sellAll': function (box) {
          let slotOut = box.slotOut.p;
          if (!slotOut.amount) {
            return;
          }
          let coins = gam2.action.getCoins();
          coins.money += slotOut.amount * slotOut.unitValue;

          slotOut.amount = 0;

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'connectTo': function (box) {
          let ev = gam2.action.event;
          var cpos = gam2.model.loc.currentPos;

          if (!box.to) {
            gam2.view.box.miner.popupTo(box);
          } else {
            box.to = 0;
          }

          box.repaint = 1;
          gam2.view.drawBox(box, 0);
        },
        'selectTo': function (box, cpos, pos) {
          box.to = [cpos, pos];

          box.repaint = 1;
          gam2.view.drawBox(box, 0);
        },
        'sendTo': function (box) {
          if (!box.to) {
            return;
          }

          let to, pos;
          [pos, to] = box.to;

          var cpos = gam2.model.loc.currentPos;
          let slot = box.slotOut.p;

          var p = gam2.model.constr.getPropList(gam2.model.box.list[pos])
          if (!p.length) {
            return;
          }
          let ev = gam2.action.event;

          for (let i in p) {
            if (p[i].pos === to) {
              let avl = Math.min(slot.amount, box.tickAmount);
              if (!avl) {
                return;
              }
              slot.amount -= avl;
              gam2.model.slot.addItemToSlots(p[i], slot.item, avl, slot.unitValue);

              //ev.do('b'+box.pos+'.crafter.sendTo', box);

              if (cpos === pos) {
                //console.log(p[i]);
                p[i].repaint = 1;

                gam2.view.drawBox(p[i], 0);
              }
              return;
            }
          }
        },
        'state': function (box) {
          let state = {};
          var slots = gam2.model.constr.getPropList(box.slot)
          let slot = box.slotOut.p;

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.tickAmount < box.maxTickAmount) {
              acts.push(['Lvl', (function (box) {
                return function () {
                  gam2.action.box.crafter.lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }

            acts.push(
              ['Recp', (function (box) {
                return function () {
                  gam2.action.recepies(box)
                }
              })(box), (!box.recepie ? 'btn-light' : 'btn-info')]
            );

            if (!box.recepie) {
              acts.push(['To', (function (box) {
                return function () {
                  gam2.action.box.crafter.connectTo(box)
                }
              })(box), box.to ? 'btn-warning' : 'btn-success']);
            }

            if (box.recepie) {
              acts.push(['Stop', (function (box) {
                return function () {
                  gam2.action.box.crafter.stopCraft(box)
                }
              })(box), 'btn-danger']);
            }
            if (slot.amount) {
              acts.push(['S', (function (box) {
                return function () {
                  gam2.action.box.crafter.sellAll(box)
                }
              })(box), 'btn-warning']);
            }
            acts.push(['i', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);


            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);
            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let conts = [];
            let cpos = gam2.model.loc.currentPos;
            for (let i in slots) {
              conts.push(
                {
                  type: 'slot',
                  slotRefs: {slot: slots[i], box: box, cpos:cpos},
                  selected: slots[i].selected,
                  res: slots[i].item,
                  amount: slots[i].amount,
                  missing: (slots[0].item > 0 ? 0 : 1)
                }
              )
            }
            conts.push(
              {
                type: 'slot-out',
                slotRefs: {slot: slot, box: box, cpos:cpos},
                selected: slot.selected,
                res: slot.item,
                amount: slot.amount,
                missing: (slot.item > 0 ? 0 : 1)
              }
            );
            conts.push(
              {type: 'br'},
            );

            if (slot.item > 0) {
              let res = gam2.model.res.reg[slot.item];
              conts.push({type: 'text', text: 'Res: ' + res.name + ' $' + slot.amount * slot.unitValue});
            }

            if (box.level < 50) {
              conts.push({type: 'text', text: 'Next Lvl: $' + box.levelCost});
            }

            conts.push({
              type: 'text',
              text: 'Craft +' + box.tickAmount * (box.recepie ? box.recepie.outAmount : 1) + ' $' + box.tickAmount * (box.recepie ? box.recepie.outAmount : 1) * slot.unitValue
            });

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
      'trader': {
        'quests': {
          'id': 0,
        },
        'addQuest': function(level=1) {
          let id = ++this.quests.id;
          let resIn = {};
          let resOut = {};
          
          let quest = {
            level: level,
            resIn: resIn,
            resOut: resOut,
          };
          
          this.quests[id] = quest;
          return quest;
        },
         'defaults': function(box) {
          box.type = 'trader';
          box.level = 1;
          box.slots = 2;
          box.slot = {};
          box.slotsOut = 1;
          box.slotOut = {};
          box.quest = 1;

          box.levelCost = 1000;
          box.levelCostFloat = 1000;
          box.clearTik = 0;
          box.tick = 100;

          return box;
        },
        'tick': function (box) {
          
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

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'state': function (box) {
          let state = {};

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.level < 20) {
              acts.push(['Lvl up', (function (box) {
                return function () {
                  gam2.action.box.bank.lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }
            
            acts.push(['>>', (function (box) {
              return function () {
                box.quest = (++box.quest)> 5? 1:box.quest;
                box.repaint=1;
                
                gam2.view.drawBox(box, 0);
              }
            })(box), 'btn-success']);

            acts.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);

            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let slot = box.slot.p;
            let slot2 = box.slot.next.p;
            let slotOut = box.slotOut.p;
            let cpos = gam2.model.loc.currentPos;

            slotOut.type='trade';
            
            
            let conts = [
              {
                type: 'slot',
                slotRefs: {slot: slot, box: box, cpos:cpos},
                selected: slot.selected,
                res: slot.item,
                amount: slot.amount,
                missing: (slot.item > 0 ? 0 : 1)
              },
              {
                type: 'slot-out',
                slotRefs: {slot: slotOut, box: box, cpos:cpos},
                selected: slotOut.selected,
                res: slotOut.item,
                amount: slotOut.amount,
                missing: (slotOut.item > 0 ? 0 : 1)
              },
              {type:'br'},
              {type:'br'},
              {
                type: 'slot',
                slotRefs: {slot: slot2, box: box, cpos:cpos},
                selected: slot2.selected,
                res: slot2.item,
                amount: slot2.amount,
                missing: (slot2.item > 0 ? 0 : 1)
              },
              {type:'br'},
            ];

            if (box.level < 20) {
              conts.push({type: 'text', text: 'Next Lvl: $' + box.levelCost});
            }

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
        },
      },
      'bank': {
        'u':[
          5,
          5000,
          5000000, 
          5000000000, 
          5000000000000, 
          5000000000000000,
          5000000000000000000,
          ],
        'loans': {'id':1},
        'banks': {},
        'register': function(cpos, boxPos) {
          if(!(cpos in this.banks)) {
            this.banks[cpos] = {};
          }
          this.banks[cpos][boxPos] = boxPos;
        },
        'drop': function(cpos, boxPos) {
          if (!(cpos in this.banks)) {
            return;
          }
          if (!(boxPos in this.banks[cpos])) {
            return;
          }
          delete this.banks[cpos][boxPos];
        },
        'addLoan': function (loanAmount, interest, periods, periodInterval) {
          let id = this.loans.id;

          let loan = {
            'id': id,
            'loan': loanAmount,
            'interest': interest,
            'periods': periods,
            'periodInterval': periodInterval,
          }

          this.loans[id] = loan;

          this.loans.id++;
          return loan;
        },
        'defaults': function(box) {
          box.type = 'bank';
          box.level = 1;
          box.slots = 1;
          box.slot = {};
          box.slotsOut = 1;
          box.slotOut = {};

          box.loanMaxU = 3;
          box.interest = 25;
          box.maxPeriods = 100;
          box.periodInterval = 10;
          box.maxLoans = 10;
          box.canChangeLoan = 0;
          box.unit=0;

          box.levelCost = 100;
          box.levelCostFloat = 5;
          box.clearTik = 0;
          box.tickPaint = 1;

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

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'state': function (box) {
          let state = {};

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.level < 20) {
              acts.push(['Lvl up', (function (box) {
                return function () {
                  gam2.action.box.bank.lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }
            
            acts.push(['>>', (function (box) {
              return function () {
                box.unit = (++box.unit)> 5? 0:box.unit;
                box.repaint=1;
                
          gam2.view.drawBox(box, 0);
              }
            })(box), 'btn-success']);

            acts.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);

            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let slot = box.slot.p;
            let slotOut = box.slotOut.p;
            let coins = gam2.action.getCoins();
            let u = gam2.action.box.bank.u;
            let cpos = gam2.model.loc.currentPos;

            slotOut.item = 1 + box.unit;
            slotOut.type='bank';
            
            slotOut.amount = Math.floor(coins.money / u[box.unit]);
            slotOut.amount = slotOut.amount > 10000? 10000: slotOut.amount;

            let conts = [
              {
                type: 'slot-out',
                slotRefs: {slot: slotOut, box: box, cpos:cpos},
                selected: slotOut.selected,
                res: slotOut.item,
                amount: slotOut.amount,
                missing: (slotOut.item > 0 ? 0 : 1)
              },
              /*{type: 'btn', text: '<', click: false, color:'info'},
              {type: 'btn', text: '>', click: false, color:'info'},*/
              {type: 'br'},
              {type: 'br'},
              {
                type: 'slot',
                slotRefs: {slot: slot, box: box, cpos:cpos},
                selected: slot.selected,
                res: slot.item,
                amount: slot.amount,
                missing: (slot.item > 0 ? 0 : 1)
              }
            ];

            if (slot.item > 0 && slot.item < 7) {
              let res = gam2.model.res.reg[slot.item];
              conts.push({type: 'text', text:'= $'+ slot.amount* u[slot.item-1] });
            } else {
      
              conts.push({type: 'br'});
            }


            if (box.level < 20) {
              conts.push({type: 'text', text: 'Next Lvl: $' + box.levelCost});

            }

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
        },
      },
      'belts': {
        'conveyor': {'id': 1},
        'addConveyor': function (from = 0, to = 0) {
          let id = this.conveyor.id;

          let conveyor = {
            'id': id,
            'from': from,
            'to': to,
            'timer': 0,
          };

          this.conveyor[id] = conveyor;

          this.conveyor.id++;

          return conveyor;
        },
        'defaults': function (box) {
          box.type = 'belts';
          box.level = 1;
          box.belts = 1;
          box.belt = {};
          box.conveyorId = 0;
          box.levelCost = 5;
          box.levelCostFloat = 5;
          box.clearTik = 0;
          box.tickPaint = 1;
          return box;
        },
        'lvlUp': function (box) {
          let coins = gam2.action.getCoins();

          if (coins.money < box.levelCost) {
            return;
          }
          coins.money -= box.levelCost;
          box.levelCostFloat *= 1.5;
          box.levelCost = Math.round(box.levelCostFloat);

          box.level++;

          if (((box.level - 1) % 6  === 0 && box.level !== 19) && box.level <= 20 || box.level === 20) {
            box.belts++;
            let last = box.belt.last();
            last.nextObj(
              gam2.model.constr.addBelt({'pos': last.p.pos + 1})
            )
          }

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'showFlow': function (box, belt) {
          let cpos = gam2.model.loc.currentPos;
          let conveyor = gam2.action.box.belts.conveyor[belt.conveyorId];

          if (!belt.conveyorId || !conveyor.from.length) {

          } else {
            let boxFrom = gam2.model.box.findBoxByRef(conveyor.from[0], conveyor.from[1]);
            let slotFrom = boxFrom.slot.get(conveyor.from[2]).p;
            let boxTo = gam2.model.box.findBoxByRef(conveyor.to[0], conveyor.to[1]);
            let slotTo = boxTo.slot.get(conveyor.to[2]).p;
            if (slotFrom.selected !== 3 && slotTo.selected !== 3) {
              slotFrom.selectedOld = slotFrom.selected;
              slotTo.selectedOld = slotTo.selected;
              slotFrom.selected = 3;
              slotTo.selected = 3;
            } else {
              slotFrom.selected = slotFrom.selectedOld;
              slotTo.selected = slotTo.selectedOld;
            }

            if (cpos === conveyor.from[0]) {
              boxFrom.repaint = 1;
              gam2.view.drawBox(boxFrom, 0);
            }

            if ((boxFrom.pos !== boxTo.pos) && (cpos === conveyor.to[0])) {
              boxTo.repaint = 1;
              gam2.view.drawBox(boxTo, 0);
            }
          }
        },
        'resetFlow': function(box, belt) {
          let conveyor = gam2.action.box.belts.conveyor[belt.conveyorId];
          conveyor.from = 0;
          conveyor.to = 0;
          box.repaint = 1;
          gam2.view.drawBox(box, 0);
        },
        'noFlow': function (box,belt) {
          if(gam2.action.slotSelectType==='item') {
             gam2.action.slotSelectType='belt.slotIn';
             
             let slotOutFn, slotIn, slotOut;
             let slotInFn = function (cpos, pos, slot) {
               gam2.action.slotSelectType='belt.slotOut';
               slotIn = slot;
               let slotPos = slot.posi<0? slot.poso+1: slot.posi+1;
               let conveyor = gam2.action.box.belts.conveyor[belt.conveyorId];
               conveyor.from = [cpos, pos, slotPos];
               
                 gam2.action.slotSelectAfterFn = slotOutFn;
             }
             
              slotOutFn = (function() {
                return function(cpos, pos, slot) {
                gam2.action.slotSelectType = 'item';
                gam2.action.slotSelectAfterFn = 0;
                if (slot === slotIn) {
                   conveyor.from = 0;
                   return 0;
                }
                let slotPos = slot.posi<0? slot.poso+1: slot.posi+1;
                let conveyor = gam2.action.box.belts.conveyor[belt.conveyorId];
                conveyor.to = [cpos, pos, slotPos];
                
          box.repaint = 1;
          gam2.view.drawBox(box, 0);
                return 1;
                }
              })(belt, slotIn, slotInFn, box);
              
              
             
            /* slotInFn = (function() {
               return function() {
                 slotOutFn();
                 gam2.action.slotSelectAfterFn = slotOutFn;
                           console.log(belt)

               }
             }) (belt, slotIn, slotOutFn);*/
             gam2.action.slotSelectAfterFn = slotInFn;
                 
          }
          /*
          gam2.action.popup(belt, function (c, onClose, belt) {
            
          });*/
      
        },
        'state': function (box) {
          let state = {};

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.belts < 4) {
              acts.push(['Lvl up', (function (box) {
                return function () {
                  gam2.action.box.belts.lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }

            acts.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);


            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);

            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let conts = [];

            let belts = gam2.model.constr.getPropList(box.belt);

            for (let i = 0; i < belts.length; i++) {
              let belt = belts[i];
              let refs = 0;
              let conveyor = gam2.action.box.belts.conveyor[belt.conveyorId];

              if (!belt.conveyorId || !conveyor.from.length) {
                refs = 0;
              } else {
                let boxFrom = gam2.model.box.findBoxByRef(conveyor.from[0], conveyor.from[1]);
                let slotFrom = boxFrom.slot.get(conveyor.from[2]).p;
                let boxTo = gam2.model.box.findBoxByRef(conveyor.to[0], conveyor.to[1]);
                let slotTo = boxTo.slot.get(conveyor.to[2]).p;

                refs = {
                  from: slotFrom,
                  to: slotTo,
                };
            }

              conts.push(
                {
                  type: 'belt',
                  refs: refs,
                  noFlowAction: (function (box, belt) {
                    return function () {
                      gam2.action.box.belts.noFlow(box, belt);
                    }
                  })(box, belt),
                  resetAction: (function (box, belt) {
                    return function () {
                      gam2.action.box.belts.resetFlow(box, belt);
                    }
                  })(box, belt),
                  showAction: (function (box, belt) {
                    return function () {
                      gam2.action.box.belts.showFlow(box, belt);
                    }
                  })(box, belt),
                },
              );
            }

            if (box.level < 50) {
              conts.push({type: 'br'});
              conts.push({type: 'text', text: 'Next Lvl: $' + box.levelCost});
            }

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
      'launch-pad': {
        'plans': {'id': 1},
        'ships': {'id': 1},
        'loans': {'id': 1},
        'shipLoan': function (type = 'cargo', cpos) {
          let id = this.loans.id;

          let loan = {
            'id': id,
            'loanTravels': 100,
            'loanPerTravel': 200,
          }

          let ship = this.addShip(1, cpos, type, loan.id);

          loan.shipId = ship.id;

          this.loans[id] = loan;

          this.loans.id++;
        },
        'addShip': function (slots = 1, cpos, type = 'cargo', loanId = 0) {
          let id = this.ships.id;

          let seedShip = gam2.model.rand.seed.ship;
          let seedShipId = rd.hashCode(seedShip + slots + cpos + type + loanId);

          let rdNam = gam2.model.rand.rdNam.bind(gam2.model.rand);

          let house = !loanId ? 1 : rd.rand(2, gam2.model.reputation.house.length, seedShipId);

          let ship = {
            'id': id,
            'name': rdNam(seedShipId),
            'house': house,
            'type': type,
            'landed': 0,
            'travels': 0,
            'slots': slots,
            'slot': {},
            'cpos': cpos,
            'pos': 0,
            'loanId': loanId,
            'plan': 0,
          }

          gam2.model.box.addSlotsFor(ship);

          this.ships[id] = ship;

          this.ships.id++;

          return ship;
        },
        'addPlan': function (shipId, from = [], to = [], travelTime = 10) {
          let id = this.plans.id;

          let plan = {
            'id': id,
            'shipId': shipId,
            'from': from,
            'to': to,
            'timer': 0,
            'travels': 0,
            'travelTime': travelTime,
            'landed': 0,
            'cpos': 0,
            'boxId': 0,
          };
          this.plans[id] = plan;

          this.plans.id++;

          return plan;
        },
        'defaults': function (box) {
          box.type = 'launch-pad';
          box.level = 1;
          box.pads = 1;
          box.pad = {};
          box.slots = 1;
          box.slot = {};
          box.levelCost = 5;
          box.levelCostFloat = 5;
          box.from = 1;
          box.to = 0;
          box.clearTik = 0;
          box.tickPaint = 1;
          return box;
        },
        'rot3': function (box) {
          let el = gam2.view.cardBox['b' + box.pos];
          if (!box.rot) {
            el.toggleClass('rot3');
          } else {
            el.toggleClass('rot3');
            box.rot = -1;
          }
          box.rot++;
        },
        'landPlane': function (plan) {
          let tmp = plan.to;

          let ship = this.ships[plan.shipId];
          ship.travels++;

          let lpos = tmp[0];
          let pos = tmp[1];
          let cpos = gam2.model.loc.currentPos;

          let box = gam2.model.box.findBoxByRef(lpos, pos);
          if (!box) {
            return 0;
          }
          if (box.type !== 'launch-pad') {
            return 0;
          }

          var pd = gam2.model.constr.getPropList(box.pad);
          if (!pd.length) {
            return 0;
          }
          let landed = 0;
          for (let d in pd) {
            if (!pd[d].shipId || pd[d].shipId === ship.id) {
              pd[d].shipId = ship.id;
              plan.boxPos = box.pos;
              plan.cpos = lpos;
              ship.cpos = lpos;
              ship.pos = box.pos;
              landed = 1;
            }
          }

          if (!landed) {
            plan.landed = 0;
            ship.landed = 0;
            ship.cpos = 0;
            ship.pos = 0;
            plan.timer--;
            return 0;
          } else {
            plan.landed = 1;
            ship.landed = 1;
            plan.to = plan.from;
            plan.from = tmp;
          }

          var sSlots = gam2.model.constr.getPropList(ship.slot)
          for (let s in sSlots) {
            if (!sSlots.hasOwnProperty(s)) {
              continue;
            }
            let slot = sSlots[s];
            let mvd = gam2.model.slot.addItemToSlots(box, slot.item, slot.amount, slot.unitValue);
            if (!mvd) {
              continue;
            }
            slot.amount = 0;
            slot.item = 0;
            slot.unitValue = 0;
          }

          if (cpos === lpos) {
            box.repaint = 1;
            gam2.view.drawBox(box, 0);
          }

          return 1;
        },
        'takeOffPlane': function (plan) {
          plan.landed = 0;
          let box = gam2.model.box.findBoxByRef(plan.cpos, plan.boxPos);
          plan.boxPos = 0;
          plan.cpos = 0;
          let ship = this.ships[plan.shipId];
          ship.landed = 0;
          ship.cpos = 0;
          ship.pos = 0;

          let lpos = plan.from[0];
          let cpos = gam2.model.loc.currentPos;

          var bPads = gam2.model.constr.getPropList(box.pad)
          for (let p in bPads) {
            if (!bPads.hasOwnProperty(p)) {
              continue;
            }
            let pad = bPads[p];
            if (pad.shipId === plan.shipId) {
              pad.shipId = 0;
            }
          }

          var bSlots = gam2.model.constr.getPropList(box.slot)
          for (let s in bSlots) {
            if (!bSlots.hasOwnProperty(s)) {
              continue;
            }
            let slot = bSlots[s];
            let mvd = gam2.model.slot.addItemToSlots(ship, slot.item, slot.amount, slot.unitValue);
            if (!mvd) {
              continue;
            }
            slot.amount = 0;
            slot.item = 0;
            slot.unitValue = 0;
          }
          if (cpos === lpos && box) {
            box.repaint = 1;
            gam2.view.drawBox(box, 0);
          }
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
          if (box.level === 10) {
            box.pads++;
          }
          if (box.level % 5 === 0 && box.level < 16) {
            box.slots++;
            let last = box.slot.last();
            last.nextObj(
              gam2.model.constr.addSlot({'posi': last.p.posi + 1})
            )
          }

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'selectShip': function (c, onClose, box) {
          let is = 0;
          if (Object.keys(this.ships).length > 1) {
            for (const i in this.ships) {
              if (!this.ships.hasOwnProperty(i)) {
                continue;
              }
              if (i === 'id') {
                continue;
              }
              let ship = this.ships[i];
              if (ship.planId) {
                continue;
              }
              is++;

              c = c.br()
                .addButton('select', (function (ship) {
                  return function () {
                    let that = gam2.action.box['launch-pad'];
                    c.clear();
                    that.selectLPad('from', c, onClose, box, 0, ship);
                  }
                })(ship), 'button btn-success', {'style': 'float: left'})
                .container('', 'div', 'color:white')
                .addText(is + '. Ship: ' + ship.name + ' ' + (!ship.loan ? '' : '(loaned)'))
                .br()
                .addText('Type ' + ship.type + ' ' + ship.cpos)
                .up()
                .br()
            }
          }
          if (!is) {
            c = c.container('err', 'div', 'color:red')
              .addText('No ships available. Maybe loan one?')
              .up();
          }

          c.addButton('Loan a ship', (function (c, onClose, box) {
            return function () {
              let that = gam2.action.box['launch-pad'];
              let cpos = gam2.model.loc.currentPos;
              c.clear();


              that.shipLoan('cargo', cpos);

              that.selectShip(c, onClose, box);

            }
          })(c, onClose, box), 'btn-success button');

        },
        'selectLPad': function (forw, c, onClose, box, src = 0, ship = 0) {
          var cpos = gam2.model.loc.currentPos;

          let blist = gam2.model.box.list;
          let ii = 0;

          if (forw === 'from' && ship && ship.landed) {
            let sel = [ship.cpos, ship.pos];
            let that = gam2.action.box['launch-pad'];

            c.clear();
            that.selectLPad('to', c, onClose, box, sel, ship);
            return;
          }

          c.addText('Chose ' + forw + ': ').br();
          for (const ip in blist) {
            if (!blist.hasOwnProperty(ip)) {
              continue;
            }

            let p = gam2.model.constr.getPropList(blist[ip])
            if (!p.length) {
              return;
            }

            for (const i in p) {
              if (!p.hasOwnProperty(i)) {
                continue;
              }
              if (!(p[i].type === 'launch-pad')) {
                continue;
              }
              if (forw !== 'from' && p[i].pos === src[1] && ip === src[0]) {
                continue;
              }

              ii++;

              c = c.br()
                .addButton('select', (function (box, cpos, pos, ship) {
                  return function () {
                    let sel = [cpos, pos];
                    let that = gam2.action.box['launch-pad'];

                    if (forw === 'from') {
                      c.clear();
                      that.selectLPad('to', c, onClose, box, sel, ship);
                    } else {
                      let plan = that.addPlan(ship.id, src, sel);
                      ship.planId = plan.id;
                      if (ship.landed) {
                        plan.timer = 0;
                        that.takeOffPlane(plan);
                      }
                      onClose();
                      console.log(that.plans);
                      that.plan(box);
                    }
                    //     gam2.action.box.miner.selectTo(box, cpos, pos);
                    // onClose();
                  }
                })(box, ip, p[i].pos, ship), 'button btn-success', {'style': 'float: left'})

                .container('', 'div', 'color:white')
                .addText('Loc: ' + ip)
                .br()
                .addText(' ' + p[i].type + ' (' + p[i].level + ') p' + p[i].pos)
                .up()
                .br()
            }
          }
          if (!ii) {
            c.container('err', 'div', 'color:red')
              .addText('Need at least two launch-pads.');
            return;
          }


          c.addButton('Loan a ship', (function (c, onClose, box) {
            return function () {
              let that = gam2.action.box['launch-pad'];
              var cpos = gam2.model.loc.currentPos;

              that.shipLoan(cpos);
              c.clear();
              that.selectShip(c, onClose, box);

            }
          })(c, onClose, box), 'btn-success button');
        },
        'plan': function (box) {
          let that = this;
          gam2.action.popup(box, function (c, onClose, box) {
              // plans
              // 1.
              // remove

              // 2.
              // remove

              // add plan / remove all

              // add plan:
              // chose ship
              // chose source
              // chose destination

              var cpos = gam2.model.loc.currentPos;

              let jj = 0;

              c = c.addText('Plans:').br()
                .container('boxarea plans', 'div', 'max-height:350px');
              let that = gam2.action.box['launch-pad'];

              if (Object.keys(that.plans).length === 1) {
                c.addText('No plans.').br(2);
              } else {
                for (let i in that.plans) {
                  if (!that.plans.hasOwnProperty(i)) {
                    continue;
                  }
                  if (i === 'id') {
                    continue;
                  }
                  let plan = that.plans[i];
                  let ship = that.ships[plan.shipId];

                  if (!(plan.from[0] === cpos || plan.to[0] === cpos)) {
                    //continue;
                  }
                  if (!plan.shipId || !ship) {
                    throw(exp(plan))

                  }
                  jj++;
                  c.container('plan-' + (plan.id))
                    .addText((parseInt(i) + 1) + '.').br()
                    .addText('From: ' + plan.from.join(' / ')).br()
                    .addText('To: ' + plan.to.join(' / ')).br()
                    .addText('Ship: ' + ship.name + ' Type: ' + ship.type)
                    .container('tik', 'div', !plan.travelTime ? 'animation:none' : 'animation-duration:' + plan.travelTime + 's; animation-delay:' + plan.timer + 's')
                    .up()
                    .container('timer', 'div', 'line-height: 14px')
                    .addText((plan.travelTime - plan.timer) + 's')
                    .up()
                    .up()
                    .br();

                  c.addButton('remove', (function (plan, plans, onClose, that, box) {
                    return function () {
                      delete (plans[plan.id]);

                      onClose();
                      that.plan(box);
                    }
                  })(plan, that.plans, onClose, that, box), 'btn-danger button').br(2)


                }
              }

              c = c.up();
              c.addButton('add plan', (function (that, c, onClose, box) {
                return function () {
                  that.popAddPlan(c, onClose, box);
                }
              })(that, c, onClose, box), 'btn-success button');

              if (jj) {
                c.addButton('remove all', (function () {
                  return function () {
                    that.plans = {id: that.plans.id};
                  }
                })(that), 'btn-danger button').br(2);
              }

              c = c.up();
            }
          );
        },
        'popAddPlan': function (c, onClose, box) {
          c.clear();

          this.selectShip(c, onClose, box);

        },
        'state': function (box) {
          let state = {};

          var slots = gam2.model.constr.getPropList(box.slot)

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.level < 50) {
              acts.push(['Lvl up', (function (box) {
                return function () {
                  gam2.action.box['launch-pad'].lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }

            acts.push(['Plan', (function (box) {
              return function () {
                gam2.action.box['launch-pad'].plan(box)
              }
            })(box), 'btn-warning']);
            acts.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);
            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let conts = [];
            let ships = gam2.action.box['launch-pad'].ships;
            let cpos = gam2.model.loc.currentPos;

            //  if (box.level < 50) {
            for (let i = 0; i < box.pads; i++) {
              let pad = box.pad.get(i).p;
              let shipType = !pad.shipId ? 0 : ((pad.shipId in ships) ? ships[pad.shipId].type : 0);
              if (!shipType) {
                pad.shipId = 0;
              }
              let shipColor = !pad.shipId ? 0: ((pad.shipId in ships) ? ships[pad.shipId].house : 0);
              conts.push({type: 'pad', ship: shipType, color: shipColor});
            }

            for (let i = 0; i < slots.length; i++) {
              let slot = slots[i];
              conts.push(
                {
                  type: 'slot',
                  slotRefs: {slot: slot, box: box, cpos:cpos},
                  selected: slot.selected,
                  res: slot.item,
                  amount: slot.amount,
                  missing: (slot.item > 0 ? 0 : 1)
                },
              );
            }

            //}

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
      'storage': {
        'defaults': function (box) {
          box.type = 'storage';
          box.level = 1;
          box.levelCost = 3;
          box.levelCostFloat = 3;
          box.slots = 4;
          box.maxAmount = 250;
          box.slot = {};
          box.from = 1;
          box.clearTik = 0;
          box.tickPaint = 1;
          return box;
        },
        'tick': function (box) {
        },
        'sellAll': function (box) {
          var slots = gam2.model.constr.getPropList(box.slot)

          let coins = gam2.action.getCoins();

          let sold = 0;
          if (gam2.action.slotSelectedObj.slot) {
            for (let i in slots) {
              if (!slots.hasOwnProperty(i)) {
                continue;
              }
              let sl = slots[i];
              if (gam2.action.slotSelectedObj.slot === sl) {
                if (!sl.item || !sl.amount) {
                  continue;
                }
                let amount = gam2.action.slotSelectHalf ? Math.round(sl.amount / 2) : sl.amount;
                coins.money += amount * sl.unitValue;
                sold = 1;

                sl.amount -= amount;
                if (sl.amount <= 0) {
                  sl.amount = 0;
                  sl.item = 0;
                }
              }
            }
          }

          if (!sold) {
            for (let i in slots) {
              if (!slots.hasOwnProperty(i)) {
                continue;
              }
              let sl = slots[i];

              if (!sl.item || !sl.amount) {
                continue;
              }
              coins.money += sl.amount * sl.unitValue;

              sl.amount = 0;
              sl.item = 0;
            }
          }

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
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
          if (box.level % 10 === 0 && box.level !== 50) {
            box.slots++;
            let last = box.slot.last();
            last.nextObj(
              gam2.model.constr.addSlot({'posi': last.p.posi + 1})
            )
          } else {
            box.maxAmount += 250;
          }

          box.repaint = 1;
          gam2.view.paintTopBar(coins);
          gam2.view.drawBox(box, 0);
        },
        'rot3': function (box) {
          let el = gam2.view.cardBox['b' + box.pos];
          if (!box.rot) {
            el.toggleClass('rot3');
          } else {
            el.toggleClass('rot3');
            box.rot = -1;
          }
          box.rot++;
        },
        'state': function (box) {
          let state = {};

          state.actions = function () {
            let acts = [];
            let coins = gam2.action.getCoins();

            if (box.level < 50) {
              acts.push(['Lvl up', (function (box) {
                return function () {
                  gam2.action.box.storage.lvlUp(box)
                }
              })(box), (coins.money >= box.levelCost) ? 'btn-success' : 'btn-danger']);
            }

            acts.push(['Sell*', (function (box) {
              return function () {
                gam2.action.box.storage.sellAll(box)
              }
            })(box), 'btn-warning']);
            acts.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts;
          }

          state.actions2 = function () {
            let acts2 = [];
            acts2.push(['Drop', (function (box) {
              return function () {
                gam2.action.dropBox(box)
              }
            })(box), 'btn-danger']);
            acts2.push(['inf', (function (box) {
              return function () {
                gam2.action.box.storage.rot3(box)
              }
            })(box), 'btn-light']);

            return acts2;
          }

          state.actionsUpdate = function () {
            return [];
          }

          state.content = function () {
            let conts = [];
            let cpos = gam2.model.loc.currentPos;

            var slots = gam2.model.constr.getPropList(box.slot);

            for (let i = 0; i < slots.length; i++) {
              let slot = slots[i];
              conts.push(
                {
                  type: 'slot',
                  slotRefs: {slot: slot, box: box, cpos:cpos},
                  selected: slot.selected,
                  res: slot.item,
                  amount: slot.amount,
                  missing: (slot.item > 0 ? 0 : 1)
                },
              );
            }

            /*  if (slot.item > 0) {
                let res = gam2.model.res.reg[slot.item];
                conts.push({ type: 'text', text: 'Res: ' + res.name + ' $' + slot.amount * slot.unitValue });
              }*/

            if (box.level < 50) {
              conts.push({type: 'br'});
              conts.push({type: 'text', text: 'Next Lvl: $' + box.levelCost});
              conts.push({type: 'text', text: 'Max: ' + box.maxAmount});

            }

            //  conts.push({ type: 'text', text: 'Mine +' + box.tickAmount + ' $' + box.tickAmount * slot.unitValue });

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
      }
    },
    'everySec': function (t = 0) {
      let cpos = gam2.model.loc.currentPos;
      let ds = 0, d = 0;

      for (let pos in gam2.model.box.list) {
        var p = gam2.model.constr.getPropList(gam2.model.box.list[pos]);

        if (!p.length) {
          return;
        }

        for (let u in p) {
          var box = p[u];
          d = 0;
          if (t && box.type === 'miner') {
            d = 1;
          }
          if (!box) {
            if (d) {
              console.log('c1')
            }
            continue;
          }

          if (box.tickPaint) {
            if (pos === cpos) {
              box.repaint = 0;
              gam2.view.paint('b' + box.pos, box, box.repaint);
            }
            if (d) {
              console.log('c2')
            }
            continue;
          }

          if (!box.everySec) {
            if (d) {
              console.log('c3')
            }
            continue;
          }

          if (!('timer' in box)) {
            box.timer = 0;
          }
          box.timer++;

          if (box.timer !== box.everySec) {
            if (pos === cpos) {
              box.repaint = 0;
              gam2.view.paint('b' + box.pos, box, box.repaint);
            }
            if (d) {
              console.log('c4' + box.timer + '/' + box.everySec)
            }
            continue;
          }
          box.timer = 0;

          if (box.type in gam2.action.box && ('tick' in gam2.action.box[box.type])) {
            gam2.action.box[box.type].tick(box);
            if (d) {
              ds++;
            }

          }
          if (pos === cpos && box.repaint) {
            gam2.view.paint('b' + box.pos, box, box.repaint);
          }
        }
      }
      let bbt = gam2.action.box.belts.conveyor;
      for (let i in bbt) {
        if (!bbt.hasOwnProperty(i)) {
          continue;
        }
        if (i === 'id') {
          continue;
        }
        
        
        let conveyor = bbt[i];
        conveyor.timer++;
        if(conveyor.timer < 5) {
          continue;
        }
        conveyor.timer=0;
        if (conveyor.from.length) {
          let boxFrom = gam2.model.box.findBoxByRef(conveyor.from[0], conveyor.from[1]);
          let slotFrom = boxFrom.slot.get(conveyor.from[2]).p;
          let boxTo = gam2.model.box.findBoxByRef(conveyor.to[0], conveyor.to[1]);
          let slotTo = boxTo.slot.get(conveyor.to[2]).p;
          
          if(slotFrom.item && slotFrom.amount>0 && (!slotTo.item || slotFrom.item === slotTo.item)) {
            let avl = Math.min(200, slotFrom.amount);
            slotFrom.amount -= avl;
            slotTo.amount += avl;
            slotTo.item = slotFrom.item;
            slotTo.unitValue = slotFrom.unitValue;

            if (cpos === conveyor.from[0]) {
              boxFrom.repaint = 1;
              gam2.view.drawBox(boxFrom, 0);
            }
            
            if((boxFrom.pos !== boxTo.pos) && (cpos === conveyor.to[0])) {
              boxTo.repaint = 1;
              gam2.view.drawBox(boxTo, 0);
            }
            
            //gam2.model.slot.addItemToSlots(slotTo, slotFrom.item, avl, slotFrom.unitValue);
          }
        }
      }
      
      let bbx = gam2.action.box['launch-pad'];

      let plans = bbx.plans;
      for (let i in plans) {
        if (!plans.hasOwnProperty(i)) {
          continue;
        }
        if (i === 'id') {
          continue;
        }
        let plan = plans[i];
        plan.timer++;
        if (!plan.landed && plan.timer === plan.travelTime) {
          if (bbx.landPlane(plan)) {
            plan.timer = 0;
          }
        } else if (plan.landed && plan.timer >= 5) {
          plan.timer = 0;
          bbx.takeOffPlane(plan);
        }
        let planJqEl = $('.plan-' + plan.id);
        if (planJqEl.length) {
          let animCss = '', txt = '';
          if (plan.landed) {
            txt = plan.timer;
            animCss = !plan.travelTime ? 'animation:none' : 'animation-duration:' + '5s; animation-delay: -' + plan.timer + 's;'
          } else {
            txt = plan.travelTime - plan.timer;
            animCss = !plan.travelTime ? 'animation:none' : 'animation-duration:' + plan.travelTime + 's; animation-delay: -' + plan.timer + 's;'
          }
          txt += 's';
          let ship = bbx.ships[plan.shipId];
          r(planJqEl)
            .clear()
            .addText((parseInt(i) + 1) + '.').br()
            .addText('From: ' + plan.from.join(' / ')).br()
            .addText('To: ' + plan.to.join(' / ')).br()
            .addText('Ship: ' + ship.name + ' Type: ' + ship.type)
            .container('tik', 'div', animCss)
            .up()
            .container('timer', 'div', 'line-height: 14px')
            .addText(txt)
            .up();
        }
      }

    },
    'selectRecepie': function (box, recepie) {
      box.recepie = recepie;
      if (!recepie) {
        box.everySec = 0;
        box.clearTik = -1;
      } else {
        box.everySec = 7;
        box.clearTik = -1;
      }

      var slots = gam2.model.constr.getPropList(box.slot)

      let slotOut = box.slotOut.p;
      //console.log(box.recepie, slotOut);

      if (box.recepie) {


        if (slotOut.item !== box.recepie.out) {
          let res = gam2.model.res.reg;
          slotOut.item = parseInt(box.recepie.out);
          slotOut.unitValue = box.recepie.unitValue;
          slotOut.amount = 0;

          let i = 0;
          for (let ritem in box.recepie.inp) {
            slots[i].item = parseInt(ritem);
            slots[i].unitValue = res[ritem].unitValue;
            slots[i].reqAmount = box.recepie.inp[ritem];
            i++;
          }
        }

      }


      box.repaint = 1;
      gam2.view.drawBox(box, 0);
    },
    'popup': function (params = 0, contentHdlr = 0, closeHdlr = 0) {
      //r(gam2.view.content).css('position: fixed; height:100%; overflow:hidden');

      let onClose = (function (closeHdlr) {
        return function () {
          r($('.popbox-over')).remove(0);
          r(gam2.view.pbox).remove(0);
          gam2.view.pbox = null;

          closeHdlr && closeHdlr(params);
        }
      })(closeHdlr);

      let c = r(gam2.view.main)
        .container('popbox-over', 'div')
        .up()
        .container('popcont', 'div')
        .container('popbox', 'div')
        .container('boxclose', 'div')
        .addButton('close', onClose, 'button btn-danger')
        .up()
        .container('boxcontent', 'div');

      contentHdlr && contentHdlr(c, onClose, params);


      c = c.up().up().el;
      gam2.view.pbox = c;
    },
    'recepiesViewContent': function (c, onClose, box, ress = 0) {
      let res = gam2.model.res;
      let recp = gam2.model.res.recepies;

      let popupEl = c.el;

      c = c
        .br(1)
        .addButton('select', (function (box, rec) {
          return function () {
            gam2.action.selectRecepie(box, rec);
            onClose();
          }
        })(box, 0), 'button btn-danger', {'style': 'float: left'})

        .container('', 'div', 'color:yellow')
        .addText('Empty')
        .up();


      for (let i in recp) {
        let reso = res.reg[recp[i].out];
        let rec = recp[i];

        if ((ress !== 0) && !(ress === parseInt(i) || (ress in rec.inp))) {
          continue;
        }

        let allowed = !(Object.keys(rec.inp).length > box.slots);

        c = c
          .br(1)
          .addButton('select', allowed ? (function (box, rec) {
            return function () {
              gam2.action.selectRecepie(box, rec);
              onClose();
            }
          })(box, rec) : false, 'button ' + (allowed ? 'btn-success' : 'btn-danger'), {'style': 'float: left'})

          .container('', 'div', 'color:white')
          .addText(reso.name + ' ' + rec.out)
          .up();

        c = c.container('slot ' + (ress == parseInt(i) ? 'slot-selected' : '') + ' slot-output', 'div');

        c.el.click(function (ress, popupEl, onClose, box) {
          return function () {
            gam2.action.slotFilterClick($(this), ress, popupEl, onClose, box);
          }
        }(parseInt(i) === ress ? 0 : parseInt(i), popupEl, onClose, box));

        c = c
          .addJqEl(res.getResIco(rec.out))
          .container('amount', 'div')
          .addText(rec.outAmount)
          .up()
          .up();


        c = c.container('slot-spc', 'div', 'width: 20px;')
          .up();

        for (let j in rec.inp) {
          c = c.container('slot ' + (ress == j ? 'slot-selected' : ''), 'div');

          c.el.click(function (ress, popupEl, onClose, box) {
            return function () {
              gam2.action.slotFilterClick($(this), ress, popupEl, onClose, box);
            }
          }(parseInt(j) === ress ? 0 : parseInt(j), popupEl, onClose, box));

          c = c
            .addJqEl(res.getResIco(j))
            .container('amount', 'div')
            .addText(rec.inp[j])
            .up()
            .up()
          //  .addText(j+' ');
        }

        c = c.br(1);
      }

    },
    'recepies': function (box) {
      this.popup(box, gam2.action.recepiesViewContent);

    },
    'dropBox': function (box) {
      var cpos = gam2.model.loc.currentPos;
      let coins = gam2.action.getCoins();
      coins.money += 1000;
      coins.money = Math.floor(coins.money);

      let blist = gam2.model.box.list[cpos];
      let op = blist.first.getBy('pos', box.pos);
      gam2.action.box.bank.drop(cpos, box.pos);

      let nx = op.next;
      let pv = op.prev;
      if (nx && pv) {
        pv.nextObj(nx);
      } else if (nx && !pv) {
        nx.prev = null;
        nx.first = nx;
        gam2.model.box.list[cpos] = nx;
      } else if (!nx && pv) {
        pv.next = null;
      } else if (!nx && !pv) {
        gam2.model.box.list[cpos] =
          gam2.model.constr.addBox({type: 'builder', level: '', levelCost: 10000, pos: 1});
      }
      
      gam2.view.paintTopBar(coins);

      gam2.view.deleteEls(gam2.view.cardBox);
      gam2.view.drawBoxes(1);

    },
    'prepareBox': function (pub) {
      pub.levelCostFloat = pub.levelCost;
      if (gam2.model.flags.loading) {
        return;
      }
      gam2.model.box.addSlotsFor(pub);
      gam2.model.box.addSlotOutsFor(pub);
    },
    'selectBuild': function (type, cost, box, cpos, pos) {
      let coins = gam2.action.getCoins();

      coins.money -= cost;

      if (!(cpos in gam2.model.box.list)) {
        // gam2.model.box.list[cpos] = ..
      }
      let blist = gam2.model.box.list[cpos];

      var builderbox = box;


      if (type === 'miner') {
        box = gam2.action.box.miner.defaults({type: 'miner', pos: parseInt(pos)});
      } else if (type === 'storage') {
        box = gam2.action.box.storage.defaults({type: 'storage', pos: pos});
      } else if (type === 'crafter') {
        box = gam2.action.box.crafter.defaults({type: 'crafter', pos: pos});
      } else if (type === 'dwellings') {
        box = {type: 'dwellings', everySec: 15, pos: pos, level: 1, levelCost: 100, capacity: 5, usage: 2};
      } else if (type === 'defences') {
        box = {type: 'defences', pads: 1, pad: {}, pos: pos, level: 1, levelCost: 10};
      } else if (type === 'power') {
        box = {type: 'power', pads: 1, pad: {}, pos: pos, level: 1, levelCost: 10};
      } else if (type === 'bank') {
        box = gam2.action.box.bank.defaults({type: 'bank', pos: pos});
        gam2.action.box.bank.register(cpos, box.pos);
      } else if (type === 'belts') {
        box = gam2.action.box.belts.defaults({type: 'belts', pos: pos});
      } else if (type === 'trader') {
        box = gam2.action.box.trader.defaults({type: 'trader', pos: pos});
      } else if (type === 'launch-pad') {
        box = gam2.action.box['launch-pad'].defaults({type: 'launch-pad', pos: pos});

        //{ type: 'launch-pad', pads: 2, pad: {}, pos: pos, level: 1, levelCost: 10 };
      } else if (type === 'laboratory') {
        box = {type: 'laboratory', everySec: 0, pos: pos, level: 1, levelCost: 200000, researchPoints: 10}
      } else if (type === 'R&D-center') {
        box = {type: 'R&D-center', everySec: 0, pos: pos, level: 1, levelCost: 200000, researchPoints: 5}
      }
      //this.prepareBox(box);

      builderbox.pos += 1;
      builderbox.repaint = 1;

      let last = blist.last();

      box.clearTik = 1;

      let boxn = gam2.model.constr.addBox(box);
      box = boxn.p;

      /*last = last.prev.nextObj(
          boxn
        );*/

      last.p = box;

      last.nextObj(
        gam2.model.constr.addBox(builderbox)
      )
      box.repaint = 1;
      gam2.view.paintTopBar(coins);

      r(gam2.view.cardBox['b' + pos]).remove();
      delete gam2.view.cardBox['b' + pos];

      gam2.view.drawBox(box, 1);
      gam2.view.drawBox(builderbox, 1);


    },
    'build': function (box) {
      var cpos = gam2.model.loc.currentPos;
      let coins = gam2.action.getCoins();
      let cposType = gam2.model.loc.current.p.type;

      gam2.action.popup(box, function (c, onClose, box) {
        let types = {
          'storage-st': {
            'storage': 1000,
            'dwellings': 1250,
            //     'defences': 5000,
            'launch-pad': 25,
            'power': 5000,
            'platform': 250000,
            'belts': 200,
            'bank': 500,
          },
          'asteroid-st': {
            'miner': 1000,
            'crafter': 1500,
            'storage': 2500,
            'dwellings': 1250,
            'seller': 2500,
            'belts': 200,
            'launch-pad': 25,
            //    'defences': 10000,
            'power': 5000,
            'platform': 250000,
            'bank': 500,
          },
          'research-st': {
            'laboratory': 100000,
            'R&D-center': 50000,
            'dwellings': 1250,
            //  'defences': 10000,
            'power': 5000,
            'belts': 200,
            'storage': 2500,
            'launch-pad': 25,
            'platform': 250000,
            'bank': 500,
          },
          'trade-st': {
            'shipyard': 200000,
            'trader': 5000,
            'seller': 2500,
            'storage': 2500,
            'launch-pad': 25,
            //    'defences': 10000,
            'power': 5000,
            'belts': 200,
            'platform': 250000,
            'bank': 500,
          },
          'city': {
            'dwellings': 1250,
            'platform': 250000,
            'shipyard': 200000,
            'trader': 5000,
            //    'defences': 10000,
            'power': 5000,
            'belts': 200,
            'storage': 2500,
            'launch-pad': 25,
            'bank': 500,
          }
        };

        for (let t in types[cposType]) {
          if (!types[cposType].hasOwnProperty(t)) {
            continue;
          }
          c = c.br()
            .addButton('select', (function (type, cost, box, cpos, pos) {
              return function () {
                gam2.action.selectBuild(type, cost, box, cpos, pos);
                onClose();
              }
            })(t, types[cposType][t], box, cpos, box.pos), 'button ' + (coins.money >= types[cposType][t] ? 'btn-success' : 'btn-danger'), {'style': 'float: left'})

            .container('', 'div', 'color:white')
            .addText(t + ' $' + types[cposType][t])
            .up();
        }
      });
    },
    'lvlUp': function (box) {
      var cr = this.model.loc.current;
      if (!(cr.p.crkey in gam2.model.box.list)) {
        return;
      }
      var b = this.model.box.list[cr.p.crkey];

      do {
        if ('sloti' in b.p) {
          b.p.sloti++;
          b.p.repaint = 1;
        }
      } while (b = b.next);
      //gam2.view.deleteEls(gam2.view.cardBox);
      //gam2.view.deleteEls(gam2.view.cardBox);

      gam2.view.drawBoxes();
    },
    'hdl': {
      'ref': function (object, method) {
        return function () {
          return method.apply(object, arguments);
        };
      },
    },
    'loc': {
      'selectLoc': function (bi, p, p0, p1, p2, p3) {
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

        gam2.model.loc.current = cr;

        gam2.view.drawLoc();


        if (cr.p.lvl === 0) {
          xr = gam2.view.genLocs(lvl + 1, pos, 0, 0, 0);
          pp = gam2.model.constr.getPropList(xr.first, 1, 0);

          p0 = pos;

          cr.child = xr;
          xr.setParentObj(cr);
          //console.table(pp);
        } else if (cr.p.lvl < 3) {
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

        gam2.model.loc.currentPos = [p0, p1, p2, p3].join('.');

        gam2.view.drawBoxes(1);
        let coins = gam2.action.getCoins();
        gam2.view.paintTopBar(coins);
        gam2.view.showLocOptions(pp, p0, p1, p2, p3);
        
      },
      'unlockLoc': function (el, bi, plist) {
        if (Object.keys(gam2.view.cardBox).length) {
          gam2.view.deleteEls(gam2.view.cardBox);
          gam2.init.topBar();
        }

        var box = plist[bi];
        var card = gam2.view.card;
        var cr = gam2.model.loc.current;
        if (cr.lvl === 3) {
          gam2.model.loc.oldCurrentComplet = cr;
        }

        var p0, p1, p2, p3;
        p0 = box.lvl <= 0 ? 0 : plist[0].pos;
        p1 = box.lvl <= 1 ? 0 : plist[1].pos;
        p2 = box.lvl <= 2 ? 0 : plist[2].pos;
        p3 = box.lvl <= 3 ? 0 : plist[3].pos;
        if (box.lvl === 0 && ('loc0' in card)) {
          r(card['loc0']).clear();
          delete card['loc0'];

        }
        if (box.lvl <= 1 && ('loc1' in card)) {
          if (box.lvl === 1) {
            r(card['loc1']).clear();
          } else {
            r(card['loc1']).remove();
            delete card['loc1'];
          }

        }
        if (box.lvl <= 2 && ('loc2' in card)) {
          if (box.lvl === 2) {
            r(card['loc2']).clear();
          } else {
            r(card['loc2']).remove();
            delete card['loc2'];
          }
        }
        if (box.lvl <= 3 && ('loc3' in card)) {
          el.unbind('click');
          if (box.lvl === 3) {
            r(card['loc3']).clear();
          } else {
            r(card['loc3']).remove();
            delete card['loc3'];
          }

        }
        var ncr = cr;
        if (box.lvl === 0) {
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
        gam2.model.loc.currentPos = [p0, p1, p2, p3].join('.')
        //console.log('new-cr', ncr.p);

        // gam2.view.locEnd = r(el).up().el.next();
        // [p0, p1, p2, p3] = gam2.view.getLocPs(box);

        var xr = gam2.view.genLocs(box.lvl, p0, p1, p2, p3);
        var p = gam2.model.constr.getPropList(xr.first, 1, 0);
        if (ncr) {
          ncr.child = xr;
          xr.setParentObj(ncr);
        } else {
          ncr = xr;
          gam2.model.loc.list = ncr;
        }
        //console.table(p);

        gam2.view.showLocOptions(p, p0, p1, p2, p3);
      },
    }
  },
}


export {gam2};
