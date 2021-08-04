/*
 Module: Storage
 Version: 1.0.1
 Author: epsislow@gmail.com
*/
import {Workers} from '/library/modules/Workers.js'

var Storage = (function () {
  var pub = {};
  
  var persistentStorage = window.navigator.persistentStorage ||
  window.navigator.webkitPersistentStorage ||
  window.navigator.mozPersistentStorage ||
  window.navigator.msPersistentStorage ||
  undefined;
  
  function errorFn() {
    console.log('error');
    console.log({ ...arguments });
  }
  
	//persistentStorage.requestPersistentQuota(20* 1024 * 1024)
	  

	/*
	var requestFileSystem = window.requestFileSystem ||
	  window.webkitRequestFileSystem ||
	  window.mozRequestFileSystem ||
	  window.msRequestFileSystem ||
	  undefined;

	requestFileSystem(TEMPORARY, 1024*1024, function(fs) {
	  console.log('yes');
	});
	*/
  pub.requestQuota = function(disp_quota) {
    persistentStorage.requestQuota(disp_quota * 1024 * 1024,
      function(quota) {
        disp_quota = ~~(quota / 1024 / 1024);
        console.log(disp_quota);
        
        //this.change_file_system();
      }, errorFn);
  }

  pub.query = function() {
    persistentStorage.queryUsageAndQuota(function(usage, quota) {
        var disp_quota = ~~(quota / 1024 / 1024);
        var disp_usage = ~~(usage / 1024 / 1024);
        
        console.log(disp_quota + '/'+disp_usage);
        
    }, errorFn)
  }
  
  pub.persist = async function tryPersistWithoutPromtingUser() {
    if (!navigator.storage || !navigator.storage.persisted) {
      return "never";
    }
    let persisted = await navigator.storage.persisted();
    if (persisted) {
      return "persisted";
    }
    if (!navigator.permissions || !navigator.permissions.query) {
      return "prompt"; // It MAY be successful to prompt. Don't know.
    }
    const permission = await navigator.permissions.query({
      name: "persistent-storage"
    });
    if (permission.state === "granted") {
      persisted = await navigator.storage.persist();
      if (persisted) {
        return "persisted";
      } else {
        throw new Error("Failed to persist");
      }
    }
    if (permission.state === "prompt") {
      return "prompt";
    }
    return "never";
  }
  
  pub.start0= function() {
     if (navigator.storage && navigator.storage.persist)
   navigator.storage.persist().then(function(persistent) {
     if (persistent)
       console.log("Storage will not be cleared except by explicit user action");
     else
       console.log("Storage may be cleared by the UA under storage pressure.");
   }); 
  }
  
  pub.start = function() {
	  pub.idxdb.idx = window.indexedDB
		 || window.webkitIndexedDB
		 || window.mozIndexedDB;
  }
  
					 /*
	if ( 'webkitIndexedDB' in window ) {
		window.IDBCursor = window.webkitIDBCursor;
		window.IDBDatabase = window.webkitIDBDatabase;
		window.IDBDatabaseError = window.webkitIDBDatabaseError;
		window.IDBDatabaseException = window.webkitIDBDatabaseException;
		window.IDBErrorEvent = window.webkitIDBErrorEvent;
		window.IDBEvent = window.webkitIDBEvent;
		window.IDBFactory = window.webkitIDBFactory;
		window.IDBIndex = window.webkitIDBIndex;
		window.IDBKeyRange = window.webkitIDBKeyRange;
		window.IDBObjectStore = window.webkitIDBObjectStore;
		window.IDBRequest = window.webkitIDBRequest;
		window.IDBSuccessEvent = window.webkitIDBSuccessEvent;
		window.IDBTransaction = window.webkitIDBTransaction;
		window.indexedDB = window.webkitIndexedDB;
	} else if ( 'mozIndexedDB' in window ) {
		window.indexedDB = window.mozIndexedDB;
	}*/
	
  pub.idxdb = {
	  idx: null,
	  db: null,
	  
	  open: function(dbName, ver = 1, next = 0) {
		  const req = this.idx.open(dbName, ver);
		  
		  req.onerror = function (e) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
			    console.log('problem opening Db:'+dbName);
			  }
		  }
		  
		  var that = this;
		  
		  req.onupgradeneeded = function (e) {
			  console.log('onupgradeneeded');
			  //db not exists/ diff version
			  that.db = e.target.result;
			  
			  that.schemaUpgrade(dbName);
		  };
		  
		  req.onsuccess = function (e) {
			  that.db = e.target.result;
			  console.log('db:'+dbName+' opended');
			  
			  if (typeof next=='function') {
				next();
			  }
		  }
		  
		  console.log(req);
	  },
	  
	  dropAllDbs: function() {
	  },
	  drop: function(dbName) {
		  const req = this.idx.deleteDatabase(dbName);
		  console.log('here drop');
		  
		  req.onerror = function (e) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
			    console.log('Error on drop db:'+dbName);
			  }
		  }
		  
		  req.onsuccess = function (e) {
			  console.log('db was deleted.');
		  }
	  },
	  schemaUpgrade: function (dbName, next=0) {
		console.log('Request for schemaUpgrade');
		if(!this.db) {
		  if (debug.is && debug.level & debug.const.B_VERBOSE) {
			console.log('No db opened.');
		  }
		  return;
		}
		
		if (!(dbName in this.schema.stores)) {
			if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No schema registered for db:'+ dbName);
			}
			return;
		}
		
		var nextEach = 0;
		var all = Object.keys(this.schema.stores[dbName]).length;
		if (all === 0) {
			next();
			return;
		}
		
		if (typeof next=='function') {
			var count = 0;
			nextEach = function () {
				count++;
				if (count === all) {
					next();
				}
			}
		}

		for(var s in this.schema.stores[dbName]) {
		  this.storeAdd(s, this.schema.stores[dbName][s], nextEach);
		}
	  },
	  schema: {
		stores: {},
		add: function (dbName, name, settings = { keyPath: 'id'}) {
			if (!(dbName in this.stores)) {
				this.stores[dbName] = {};
			}
			this.stores[dbName][name] = settings;
		}
	  },
	  storeAdd: function(name, settings, next = 0) {
		console.log('Attempt to add store '+name, settings);
		const store = this.db.createObjectStore(name, settings);
		
		store.createIndex(settings.keyPath, settings.keyPath, { unique: true });
	
		store.transaction.oncomplete = function(e) {
			console.log('Table:'+name+' created.');
			if (typeof next=='function') {
				next();
			}
		}
	  },

	  insert: function(storeName, records, next = 0) {
		  console.log('Pre-insert in '+ storeName);
		  if(!this.db) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No db opened.');
			  }
			  return;
		  }
		  
		  const insert_transaction = this.db.transaction(storeName, 'readwrite');
		  const store = insert_transaction.objectStore(storeName);
		  
		  insert_transaction.onerror = function() {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('Problem with insert transaction on store:'+storeName);
			  }
		  }
		  
		  insert_transaction.oncomplete = function() {
			  if (debug.is && debug.level & debug.const.B_VERY_VERBOSE) {
			    console.log('Success insert transaction on store:'+storeName);
			  }
			  
			  if (typeof next=='function') {
				next();
			  }
		  }
		  
		  records.forEach(record => {
			  let req = store.add(record);
			  req.onerror = function(e) {
				  switch(e.target.error.name) {
					  case 'AbortError': 
					  break;
					  case 'ConstraintError': 
					  break;
					  case 'QuotaExceededError':
					  break;
					  case 'VersionError':
					  break;
				  }
				  
				  console.log(e.target.error);
				  if (debug.is && debug.level & (debug.const.B_INSERT | debug.const.B_VERBOSE)) {
					console.log('Could not add record to '+storeName, record);
				  }
			  }
			  
			  req.onsuccess = function(e) {
				if (debug.is && debug.level & debug.const.B_ADD) {
				  console.log('Success added record to '+storeName, record);
				}
			  }
		  });
	  },
	  has: function(storeName, key, next=0) {
		  if(!this.db) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No db opened.');
			  }
			  return;
		  }
		  
		  const get_transaction = this.db.transaction(storeName, 'readonly');
		  const store = get_transaction.objectStore(storeName);
		  
		  let req = store.openCursor(key);
		  
		  req.onerror = function(e) {
			  console.log('141.');
			  if (debug.is && debug.level & (debug.const.B_GET | debug.const.B_VERBOSE)) {
				console.log('Could not check record '+key+' from ' + storeName);
			  }
		  }
		  
		  req.onsuccess = function(e) {
			  console.log('151.');
			  
			  var cursor = e.target.result; 
			  if (cursor) { // key already exist
				 if (debug.is && debug.level & debug.const.B_HAS) {
					console.log('Success record '+key+' exists in  ' + storeName);
				  }
			  } else { // key not exist
				if (debug.is && debug.level & debug.const.B_HAS) {
					console.log('Success record '+key+' does NOT exists in ' + storeName);
				}
			  }
			  
			  if (typeof next=='function') {
				next(cursor?1:0);
			  }
		  }
	  },
	  get: function(storeName, key, next= 0) {
		  console.log('Pre-get in '+ storeName);
		  if(!this.db) {
			  console.log('101.');
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No db opened.');
			  }
			  return;
		  }
			  console.log('111.');
		  const get_transaction = this.db.transaction(storeName, 'readonly');
		  const store = get_transaction.objectStore(storeName);
		  
		  get_transaction.onerror = function() {
			  console.log('121.');
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('Problem with get transaction on store:' + storeName);
			  }
		  }
		  
		  get_transaction.oncomplete = function() {
			  console.log('131.');
			  if (debug.is && debug.level & debug.const.B_VERY_VERBOSE) {
				console.log('Success get transaction on store:' + storeName);
			  }
		  }
		  
		  let req = store.get(key);
		  req.onerror = function(e) {
			  console.log('141.');
			  if (debug.is && debug.level & (debug.const.B_GET | debug.const.B_VERBOSE)) {
				console.log('Could not get record '+key+' from ' + storeName);
			  }
		  }
		  
		  req.onsuccess = function(e) {
			  console.log('151.');
			  if (debug.is && debug.level & debug.const.B_GET) {
				console.log('Success got record '+key+' from ' + storeName, e.target.result);
			  }
			  if (typeof next=='function') {
				next(e.target.result);
			  }
		  }
		  console.log(req)
	  },
	  getAll: function(storeName, next = 0) {
		  if(!this.db) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No db opened.');
			  }
			  return;
		  }
		  const get_transaction = this.db.transaction(storeName, 'readonly');
		  const store = get_transaction.objectStore(storeName);
		  
		  get_transaction.onerror = function() {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('Problem with getAll transaction on store:' + storeName);
			  }
		  }
		  
		  get_transaction.oncomplete = function() {
			  if (debug.is && debug.level & debug.const.B_VERY_VERBOSE) {
			    console.log('Success getAll transaction on store:' + storeName);
			  }
		  }
		  
		  let req = store.getAll();
		  req.onerror = function(e) {
			  if (debug.is && debug.level & (debug.const.B_GETALL | debug.const.B_VERBOSE)) {
				console.log('Could not get all records from ' + storeName);
			  }
		  }
		  
		  req.onsuccess = function(e) {
			  if (debug.is && debug.level & debug.const.B_GETALL) {
				console.log('Success got all records from ' + storeName, e.target.result);
			  }
			  
			  if (typeof next=='function') {
				next(e.target.result);
			  }
		  }
	  },
	  update: function(storeName, records, next = 0) {
		  console.log('Pre-update in '+ storeName);
		  if(!this.db) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No db opened.');
			  }
			  return;
		  }
		  
		  const update_transaction = this.db.transaction(storeName, 'readwrite');
		  const store = update_transaction.objectStore(storeName);
		  
		  update_transaction.onerror = function() {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('Problem with update transaction on store:'+storeName);
			  }
		  }
		  
		  update_transaction.oncomplete = function() {
			  if (debug.is && debug.level & debug.const.B_VERY_VERBOSE) {
				console.log('Success update transaction on store:'+storeName);
			  }
			  if (typeof next=='function') {
				next();
			  }
		  }
		  
		  records.forEach(record => {
			  let req = store.put(record);
			  
			  req.onerror = function(e) {
				  if (debug.is && debug.level & (debug.const.B_UPDATE | debug.const.B_VERBOSE)) {
					  console.log('Could not update record to '+storeName, record);
				  }
			  }
			  
			  req.onsuccess = function(e) {
				  if (debug.is && debug.level & debug.const.B_UPDATE) {
					console.log('Success updated record to '+storeName, record);
				  }
			  }
		  });
	  },
	  delete: function(storeName, keys, next = 0) {
		  if(!this.db) {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('No db opened.');
			  }
			  return;
		  }
		  
		  const delete_transaction  = this.db.transaction(storeName, 'readwrite');
		  const store = delete_transaction.objectStore(storeName);
		  
		  delete_transaction.onerror = function() {
			  if (debug.is && debug.level & debug.const.B_VERBOSE) {
				console.log('Problem with delete transaction on store:' + storeName);
			  }
		  }
		  
		  delete_transaction.oncomplete = function() {
			  if (debug.is && debug.level & debug.const.B_VERY_VERBOSE) {
				console.log('Success delete transaction on store:' + storeName);
			  }
			  
			  if (typeof next=='function') {
				next();
			  }
		  }
		  
		  keys.forEach(key => {
			  let req = store.delete(key);
			  req.onerror = function(e) {
				  if (debug.is && debug.level & (debug.const.B_DELETE | debug.const.B_VERBOSE)) {
					console.log('Could not delete record '+key+' from '+storeName);
				  }
			  }
			  
			  req.onsuccess = function(e) {
				  if (debug.is && debug.level & debug.const.B_DELETE) {
					console.log('Success deleted record '+key+' from '+storeName);
				  }
			  }
		  });
	  },
  };
  
  
  pub.mgr = {
	  use: 'idxdb',
	  save: function (key, val) {
		  const mgr = this.getMgr(this.use); 
	  },
	  getMgr: function(name) {
	  }
  };
  
  return pub;
})();

var debug= {is: true, level: 255, const:{
	'B_SILENCE':0,
	'B_VERBOSE':1,
	'B_INSERT':2,
	'B_UPDATE':4,
	'B_DELETE':8,
	'B_GET':16,
	'B_GETALL':32,
	'B_HAS': 64,
	'B_VERY_VERBOSE':128,
	'B_ALL':255,
	}};

/*
Storage.start();
Storage.idxdb.schema.add('test');
Storage.idxdb.create('testDb');
Storage.idxdb.drop('testDb');  
*/

export {Storage, debug}