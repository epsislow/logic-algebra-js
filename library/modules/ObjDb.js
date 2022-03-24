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
      'insert': function(list, val, id=0) {
        let dbl=this.db[this.pre.db][list];
        let nid=id?id:dbl.id; 
        dbl[nid] = val;
      },
      'update': function(list, val, id = 0) {
        let dbl = this.db[this.pre.db][list];
        let nid = id ? id : dbl.id;
        dbl[nid] = val;
      },
      'deleteId': function(list, nid) {
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
      }
      f.add=function(name, idStart=0) {
        pub.o[name] = {id: idStart};
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
        return pub.o[name][nid];
      }
      f.remove= function(name,id) {
        delete pub.o[name][id];
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

      return pub;
    }
    
  }
  
  return pub;
})();

export { ObjDb, ObjRef, ObjSimple }
