/*
 Module: ObjDb
 Version: 1.0.1
 t/tttjrjfjjgjcjdjzjsjdjuvudjsjjcjieiiviviieidigieiivugiie
 Author: epsislow@gmail.com
*/

var ObjDb = (function () {
    let pub;
    pub = {
      'db': {},
      'pre': {'db':0},
      'types': {
        'enum': [],
        'number': 0,
        'date': 0,
        'string':0,
        'else':0,
      },
      'cast': {},
      'index': {},
      'trans': {},
      'addDb': function(name) {
        this.db[name]={};
        return 1;
      },
      'addList': function(db, name) {
        this.db[db][name]={id:0};
      },
      'useDb': function(db) {
        this.pre.db=db;
      },
      'select': function() {
        
      },
      'add': function(list, val, id=0) {
        let dbl=this.db[this.pre.db][list];
        let nid=id?id:dbl.id; 
        dbl[nid] = val;
      },
      'update': function(list, val, id = 0) {
        let dbl = this.db[this.pre.db][list];
        let nid = id ? id : dbl.id;
        dbl[nid] = val;
      },
      'removeId': function(list, nid) {
        let dbl = this.db[this.pre.db][list];
        delete dbl[nid];
        
      },
      'truncate': function() {
        
      }
    }
    return pub;
})();

var ObjRef = (function() {
  let pub;
  pub = {
    'new': function() {
      
    }
  }
  
  return pub;
})();

var ObjSimple = (function() {
  let pub;
  pub= {
    'new': function() {
      return this.use({});
    },
    'use': function(o) {
      return this.addFn(o);
    },
    'addFn': function(o) {
      let f= {};
      /*
      let handlers = {
        set
      }*/
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
      //let o= new Proxy(o, handlers);
      let pub = {'o':o, 'f': f};
      f.o=o;
      f.trz = {old: 0, en:0};
      f.begin=function() {
        if(f.trz.en) {
          throw Error('Already in transaction');
        }
        let oo = JSON.parse(JSON.stringify(o));
        f.trz = {old: o, en: 1};
        pub.o = oo;
        f.o = o;
        return this;
      }
      f.commit=function() {
        f.trz.old = 0;
        f.trz.en = 0;
        f.o = pub.o;
        return this;
      }
      f.rollback=function() {
        if(!f.trz.en) {
          throw Error('No transaction to rollback to');
        }
        pub.o = f.trz.old;
        f.trz.old = 0;
        f.trz.en = 0;
        f.o = pub.o;
        return this;
      }
      f.add=function(name, idStart=0) {
        pub.o[name] = {id: idStart};
        f.event('f.add', f.ref(name, idStart) );
        return f;
      }
      f.ref=function(name, id) {
        return [name, id];
      }
      f.get=function(ref) {
        return pub.o[ref[0]][ref[1]];
      }
      f.new=function(name, prop = {}) {
        let nid= pub.o[name].id++;
        pub.o[name][nid] = prop;
        f.event('f.new', f.ref(name, nid));
        return pub.o[name][nid];
      }
      f.update=function(name, nid, prop = {}) {
        Object.assign(pub.o[name][nid], prop);
        f.event('f.update', f.ref(name, nid));
        return pub.o[name][nid];
      }
      f.remove= function(name,id) {
        let od = pub.o[name][id];
        delete pub.o[name][id];
        f.event('f.remove', {od: od, name:name, id:id});
        return this;
      }
      f.removeRef=function(ref) {
        return this.remove(ref[0],ref[1]);
      }
      f.list= (function (f) {
        let l = {}
        l.add=function(name, ofName, idStart=0) {
          pub.o[name] = {listOf: ofName, id: idStart};
          return l;
        }
        l.ref=function(name, id) {
          return [name, id];
        }
        l.get=function(ref) {
          let nRef= pub.o[ref[0]][ref[1]];
          return f.get(nRef);
        }
        l.new=function(name, ref) {
          let nid= pub.o[name].id++;
          o[name][nid] = ref;
          return pub.o[name][nid];
        }
        l.remove=function(name,id) {
          delete pub.o[name][id];
          return this;
        }
        l.removeRef=function(ref) {
          return this.remove(ref[0],ref[1]);
        }
        l.up=f;

        return l;
      })(f);
      let isRef = function(ref) {
        return (Array.isArray(ref) && ref.length === 2);
      }
      let has = function(it, where={}) {
        for(let i in it) {
          if(!where.hasOwnProperty(i)) {
            return 0;
          }
          if(where.hasOwnProperty(i) && it[i] !== where[i]) {
            return false;
          }
        }
      }
      f.event= function(act, evob) {
        switch(act) {
          case 'f.add': 
            
            break;
          case 'f.new':
          case 'f.update':
            if(isRef(evob)) {
              let name = evob[0];
              let id = evob[1];
              if(name in f.filter) {
                let it = f.get(evod);
                
                for(let i in f.filter[name]) {
                  if(has(it, f.filter[name][i].where)) {
                    f.filter[name][i][id] = id;
                  }
                }
                
              }
            }
            break;
          case 'f.remove':
            let name=evod.name;
            let id=evod.id;
            let it=evod.od;
            if(name in f.filter) {
              for(let i in f.filter[name]) {
                if(id in f.filter[name][i]) {
                  delete f.filter[name][i][id];
                }
              }
            }
            break;
        }
      }
      f.filter= (function (f) {
        let c= {};
        c.add=function(name, ofName, where={}) {
          
          if(!(ofName in c)) {
            c[ofName] = {};
          }
          c[ofName][name] = {where:where};
          let l=f[ofName];
          for(let i in l) {
            if(l.hasOwnProperty(i) && has(l[i], where)) {
              c[ofName][name][i] = i;
            }
          }
          
        }
          
          /*
          f.event[ofName].onAdd= (function(cc, where) {
            return function(li, i) {
              if (has(li, where)) {
                cc[i] = i;
              }
            }
          })(cc, where);
          
          f.event[ofName].onRemove = function(name, i) {
            c.list[name]
          }*/
        
        
        
        return c;
      })(f);

      return pub;
    }
    
  }
  
  return pub;
})();

export { ObjDb, ObjRef, ObjSimple }
