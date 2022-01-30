
let r = function(el) {
    return vs.from(el);
}

window.r = r;

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
        this.model.res.init();
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
          
          var blist = this.model.constr.addBox({type:'miner', sloti:0, slots:8, slot: {}, pos:1, level:1, levelCost:10})
            .nextObj(
              this.model.constr.addBox({type:'dwellings', pos:2, level:1, levelCost:100, capacity: 5, usage: 2})
            )
            .nextObj(
              this.model.constr.addBox({type:'cargo', sloti:8, slots: 8, slot: {}, pos:3, level:1, levelCost: 10})
            )
            .nextObj(
              this.model.constr.addBox({type:'cargo', sloti:16, slots: 8, slot: {}, pos:4, level:1, levelCost: 10})
            )
            .nextObj(
              this.model.constr.addBox({ type: 'cargo', sloti: 24, slots: 8, slot: {}, pos: 5, level: 1, levelCost: 10 })
            )
            .nextObj(
              this.model.constr.addBox({ type: 'cargo', sloti: 36, slots: 8, slot: {}, pos: 6, level: 1, levelCost: 10 })
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
         // console.log(p);
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
                .up()
                .br();
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
      'draw':function() {
        this.drawLoc(1);
        this.drawBox(1);
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
      // console.log(p);
      },
      'paintTopBar': function(coins) {
        gam2.init.topBar(
          coins.money,
          coins.ppl[0], coins.ppl[1],
          coins.power[0], coins.power[1]
        )
      },
      'drawBox': function(repaint=0) {
        var cr = this.model.loc.current;
        var cpos = gam2.model.loc.currentPos;

        if(!(cpos in gam2.model.box.list)) {
          return;
        }
        if(cpos in gam2.model.box.coins) {
          this.paintTopBar(gam2.model.box.coins[cpos])
        } else {
          gam2.init.topBar();
        }
        var p = gam2.model.constr.getPropList(gam2.model.box.list[cpos])
        if (p.length) {
          var el;
        
          for (const i in p) {
            el = this.drawCard('b' + p[i].pos, p[i]);
            if(repaint) {
              this.paint('b'+p[i].pos, p[i]);
            }
          }
        }
        
      },
      'drawCard': function(id, box, container = null, opt=0, wTikSec = 0, redrawAll=1) {
          if(!(box.type in this.model.cards)) {
            throw Error(box.type+ ' not found')
          }
          var crd= this.model.cards[box.type];
          
          var x2 = (box.is==='loc' && !opt)?'-xs':'', color = crd.bg, dashed = crd.dashed;

//crd.icon = (box.type==='cargo')?'empty':'empty';
    //color='empty';
   // dashed=1;
var clr=(box.is=='loc')?3:5;
          var icon = crd.icon+ " b-clr i-clr"+clr+" "+ crd.icon;
          
          var title = (box.is==='loc')? box.name:box.type;
          var topRight = (box.is==='loc') ? box.loc: box.level;

          title = title.charAt(0).toUpperCase() + title.slice(1);

          var cel;

          cel = r(container ? container: this.view.content)
            .container( (box.is==='loc' &&! opt? 'mb-3':'m-2') + ' p-2 unlock bg-' + color + (opt?' option'+(box.locWithBuilds?'-bl':''):'')+' rounded box-shadow text-light bg-card'+x2+' ' + (dashed ? 'bg-dashed' : ''), 'div', '', {'id':id})

            .container('fas fa-' + icon + ' fa-bgd'+x2+' fa-5x', 'div', '')
            .up()

            .container('tt', 'div', 'position:relative;top:0px;z-index:997')
            .container('top', 'div')
                .container('pb-2 mb-0 h6-left', 'h6', 'float:left')
                .addText(title)
                .up()

                .container('pb-2 mb-0 h6-right', 'h6', 'float:right')
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
                  
                if(box.slot && ('sloti' in box)) {
                  var gi=box.sloti;
                  
                  for(let s= 0; s< box.slots;s++){
                
                    cel = cel
                      .container('slot', 'div')
                      .addJqEl(gam2.model.res.getResIco(gi+s))
                        .container('amount','div')
                        .addText(50)
                        .up()
                      .up();
                  }/*
                      .container('slot', 'div')
                      .addJqEl(gam2.model.res.getResIco(gi+1))
                      .container('amount', 'div')
                        .addText(50)
                        .up()
                      .up()
                      .container('slot', 'div')
                      .addJqEl(gam2.model.res.getResIco(gi+2))
                      .container('amount', 'div')
                        .addText(50)
                        .up()
                      .up()
                      .container('slot', 'div')
                      .addJqEl(gam2.model.res.getResIco(gi+3))
                      .container('amount', 'div')
                        .addText(50)
                        .up()
                      .up()
                      .container('slot', 'div')
                      .addJqEl(gam2.model.res.getResIco(gi+4))
                      .container('amount', 'div')
                        .addText(50)
                        .up()
                      .up()
                      .container('slot', 'div')
                      .up();*/
                   
                }
                  
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
          } else {
              cel = cel
                  .container('bottom' + x2, 'div')
                  .container('pb-2 mb-0 h6-left', 'h6', 'float:left')
                  .addText((!opt || x2 === '-xs') ? '' : box.type)
                  .up()
                  .up()
          }
           cel = cel.up().el
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
      'paint': function(id, box) {
        var opt = {btns:{'add':[['Lvl up', (function(box) { return function() {gam2.action.lvlUp(box)}})(box), 'btn-success']]}};
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
          opt.strong = "test";
          opt.texts= [1,2,3];
        }
        this.paintBox(id, opt);
        //gam2.view.paintBox('b1', {'texts': [gam2.model.res.getResIco(5)]});
      },
      'paintBox': function(id, options = {}) {
          if (!(id in this.cardBox)) {
              return;
          }
          options = Object.assign({}, {
              'title': 0,
              'lvl': 0,
              'strong': 0,
              'texts': 0,
              'btns':0,
              'tikUp': -1,
              'tikSec': 0,
              'tikDelay': 0,
          }, options);

          let title = options.title;
          let lvl = options.lvl;
          let strong = options.strong;
          let texts = options.texts;
          let buttons = options.btns;
          let tikUp = options.tikUp;
          let tikSec = options.tikSec;
          let tikDelay = options.tikDelay;
          let bt, style;

          if (title) {
              r(this.cardBox[id]).in('.h6-left').clear().addText(title);
          }
          if (lvl) {
              r(this.cardBox[id]).in('.h6-right').clear().addText(lvl);
          }

          if(strong) {
              let dBlock = r(this.cardBox[id]).in('.content .d-block');
              if (strong === -1) {
                  dBlock.clear();
              } else {
                  dBlock.clear().addText(strong);
              }
          }

          if (texts) {
              let dText = r(this.cardBox[id]).in('.content .d-text');
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

          if (buttons) {
              buttons = Object.assign({}, {clr: 0, upd: {}, add:[]}, buttons);

              let btn = r(this.cardBox[id]).in('.btns');
              let b;

              if (buttons.clr) {
                  btn.clear();
              }
              for (b in buttons.upd) {
                  if(!buttons.upd.hasOwnProperty(b)) {
                      continue;
                  }
                  bt = buttons.upd[b];
                  btn.addButton(bt[0], bt[1], 'button ' + bt[2]);
              }

              for (b in buttons.add) {
                  if(!buttons.add.hasOwnProperty(b)) {
                      continue;
                  }
                  bt = buttons.add[b];
                  btn.addButton(bt[0], bt[1], 'button ' + bt[2]);
              }
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
              : (type ==='asteroid-belt'?'Cloud ':'') +rdNam(seedLocId)
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
          'transport': {
            'icon': 'circle',
            'bg': 'crafter',
            'dashed':0
          },
          'cargo': {
            'icon':'play',
            'bg': 'crafter',
            'dashed': 0,
          },
          'airliner': {
            'icon': 'square',
            'bg':'crafter',
            'dashed': 0,
          }
        },
        'loc': {
          'list': null,
          'current': null,
          'currentPos':'0.0.0.0',
        },
        'box': {
          'list': null,
          'coins': {},
        },
        'res': {
            'icoList':['atom','adjust','cheese', 'bars','circle-notch','clone','cubes','cube','columns','glass-whiskey', 'database','dice-d6','dice-d20', 'dot-circle','egg','eject','equals','fire','fire-alt','flask','hockey-puck','grip-vertical','gem','radiation-alt','neuter', 'icicles','mountain','ring','shapes','share-alt-square','square','stop-circle','sun','tint','th-large','th','water','wave-square','window-restore'],
            'colorList':["aliceblue", "antiquewhite", "aqua", "aquamarine", "biege", "bisque", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "coral", "cornflowerblue", "cyan", "darkcyan", "darkgreen", "darkorchid", "darkred", "deeppink", "deepskyblue", "darkslategray", "darkslateblue", "gold", "goldenrod", "gray", "greenyellow", "hotpink", "indianred", "lavender", "lemonchiffon", "lightblue", "lightcyan", "lightcoral", "lightseagreen", "lightskyblue", "lightsteelblue", "lime", "linen", "mediumaquamarine", "mediumseagreen", "mediumcoral", "mediumturquoise", "mediumvioletred", "mistyrose", "olive", "orangered", "orange", "palegoldenrod", "purple", "plum", "pink", "powderblue", "red", "rosybrown", "royalblue", "salmon", "sandybrown", "seagreen", "silver", "seashell", "springgreen", "steelblue", "teal", "tan", "thistle", "turquoise", "violet", "wheat", "white", "yellow", "yellowgreen"],
            'colorList2': ['cyan','pink','yellow','white', 'lightblue','red'],
            'colorUni': {},
            'reg':[],
            'init': function() {
              this.add('money','donate','white');
              this.add('money','donate','yellow');
              this.add('moneyK','donate','greenyellow');
              this.add('moneyG','donate','aquamarine');
              this.add('moneyT','donate','lightblue');
              this.add('moneyM','donate','lightviolet');
              this.add('moneyR','donate','pink');
              
              this.add('power','battery-full','greenyellow');
              this.add('child','child','lightgreen');
            },
            'add': function (name, ico=0, color='light') {
                var id=this.reg.length;
                this.reg[id] = {
                    name: name,
                    value: 0,
                    ico: ico,
                    color: color
                }
                return id;
            },
            'gen': function (num) {
                let rd = gam2.model.rand.rd;
                let ico, suf, name, color;
                let seed = gam2.model.rand.seed.res;
                var icoList = [], colorList= [];
                for(let i=0;i<num;i++) {
                    if(!icoList.length) {
                      icoList = [...this.icoList];
                    }
                    ico = rd.pickOneFrom(icoList,1, seed);
                    suf = rd.randomBytes(1,1) + rd.pickOneFrom(['um','um','is','ix','us','ad','am'],0, seed);
                    name = rd.randomName(rd.rand(3,8),0,suf, 0, seed);
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
                console.log(this.reg)
            },
            'getResIco': function (id) {
                var res = this.reg[id];
               // console.log(res, this.reg[id+1])
                return $('<i>').addClass('fas')
                    .addClass('fa-'+res.ico)
                    .attr('style', 'font-size: 24px;color:'+res.color);
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
            'locProps': function ( pos,type, lvl, name, crkey='') {
                return {
                    card:'empty',
                  is:'loc',
                    pos: pos,
                    type: type,
                    lvl: lvl,
                    name: name,
                    loc: 'L' + lvl + ':' + ((pos< 10)? '0': '') + pos,
                    crkey: crkey+'.'+pos
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
      'lvlUp': function (box) {
        var cr= this.model.loc.current;
        if(!(cr.p.crkey in gam2.model.box.list)) {
          return;
        }
        var b = this.model.box.list[cr.p.crkey];
        
        console.log(cr.p.crkey);
        do{
          if('sloti' in b.p) {
            b.p.sloti++;
          }
        } while(b= b.next);
        //gam2.view.deleteEls(gam2.view.cardBox);
        gam2.view.deleteEls(gam2.view.cardBox);
        gam2.view.drawBox(1);
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
              
              gam2.view.drawBox(1);
              
              

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