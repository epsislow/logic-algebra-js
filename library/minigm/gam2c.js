import {DbStorageConstr} from "/library/modules/DbStorage.js";
import {ObjSimple} from "/library/modules/ObjDb.js";

window.ObjSimple = ObjSimple;

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
  'start': function () {
    this.boot();
  },
  'boot': function () {
    this.db = ObjSimple.new();

    this.db.f
      .add('loc')
      .add('box')
      .add('slot');

    this.db.f.new('loc', {'level': 1});
    gam2.db.f.new('loc', {'a':'b'})

    this.db.f.list.add('listLoc', 'loc')
      .new('listLoc', gam2.db.f.ref('loc',1))

    console.log(this.db.o);

    console.log(this.db.f.list.get(['listLoc', 0]));
  },
  'db': {}
}


export {gam2};
