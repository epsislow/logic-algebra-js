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


export { ObjDb, ObjRef }
