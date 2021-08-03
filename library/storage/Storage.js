
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
					 
					 
	  pub.idxdb.schema.add('test');
	  pub.idxdb.schema.add('comp');
	  pub.idxdb.open(
	    'testDb',1,
	  
	   function() {
	     Storage.idxdb.insert('comp', [{'id': 1, 'someObj':{'a':'b','x':0,'y':1}}])
	  
	   });
	  
	  
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
  }
  
  
	const workers = {};
  
	function customWorker(name, workFunc, messageHdl, errorHdl) {
		if (name in workers) {
			return workers[name];
		}

		let blobWork = new Blob(["onmessage =" + workFunc.toString()], {type: "text/javascript"});

		workers[name] = new Worker(URL.createObjectURL(blobWork));

		workers[name].onmessage = messageHdl;

		if (typeof errorHdl == 'function') {
			workers[name].onerror = errorHdl;
		}

		return workers[name];
	}
	
  
  pub.idxdb = {
	  idx: null,
	  db: null,
	  
	  open: function(dbName, ver = 1, next) {
		  const req = this.idx.open(dbName, ver);
		  
		  req.onerror = function (e) {
			  console.log('problem opening Db:'+dbName);
		  }
		  
		  var that = this;
		  
		  req.onupgradeneeded = function (e) {
			  console.log('onupgradeneeded');
			  //db not exists/ diff version
			  that.db = e.target.result;
			  
			  that.schemaUpgrade();
		  };
		  
		  req.onsuccess = function (e) {
			  that.db = e.target.result;
			  console.log('db:'+dbName+' opended');
			  
			  next();
		  }
		  
		  console.log(req);
	  },
	  
	  dropAllDbs: function() {
		var workThatDropAll = customWorker(
			'dropAllDbs', 
			function (data) {
				//worker fn
				const idd = indexedDB
                     || webkitIndexedDB
                     || mozIndexedDB;
				
				const deletedDbs = [];
				
				const promise = indexedDB.databases();
				
				idd.databases().then(dbs => dbs.forEach(db => {idd.deleteDatabase(db.name); deletedDbs.push(db.name);})).then();
				self.postMessage(deletedDbs);
			},
			function (deletedDbs) {
				//success hdl
				console.log('deleted databases: '+ deletedDbs.join(','));
			},
			function (e) {
				//error hdl
				console.log('Error? What error? ', e.message);
			}
		);
		
		workThatDropAll.postMessage(1);
	  },
	  drop: function(dbName) {
		  const req = this.idx.deleteDatabase(dbName);
		  console.log('here drop');
		  
		  req.onerror = function (e) {
			  console.log('Error on drop db:');
		  }
		  
		  req.onsuccess = function (e) {
			  console.log('db was deleted.');
		  }
	  },
	  schemaUpgrade: function () {
		console.log('here schemaUpgrade');
		if(!this.db) {
		  console.log('No db opened.');
		  return;
		}

		console.log(this.schema.stores);

		for(var s in this.schema.stores) {
		  this.storeAdd(s, this.schema.stores[s]);
		}
	  },
	  schema: {
		stores: {},
		add: function (name, settings = { keyPath: 'id'}) {
		  this.stores[name] = settings;
		}
	  },
	  storeAdd: function(name, settings) {
		console.log(name,settings);
		const store = this.db.createObjectStore(name, settings);
		
		store.createIndex(settings.keyPath, settings.keyPath, { unique: true });
	
		store.transaction.oncomplete = function(e) {
			console.log('Table:'+name+' created.');
		}
	  },

	  insert: function(storeName, records) {
		  if(!this.db) {
			  console.log('No db opened.');
			  return;
		  }
		  
		  const insert_transaction = this.db.transaction(Object.keys(this.schema.stores), 'readwrite');
		  const store = insert_transaction.objectStore(storeName);
		  
		  insert_transaction.onerror = function() {
			  console.log('Problem with insert transaction on store:'+storeName);
		  }
		  
		  insert_transaction.oncomplete = function() {
			  console.log('Success insert transaction on store:'+storeName);
		  }
		  
		  records.forEach(record => {
			  let req = store.add(record);
			  req.onerror = function(e) {
				  console.log('Could not add record to '+storeName, record);
			  }
			  
			  req.onsuccess = function(e) {
				  console.log('Success added record to '+storeName, record);
			  }
		  });
	  },
	  get: function(storeName, key) {
		  if(!this.db) {
			  console.log('No db opened.');
			  return;
		  }
		  const get_transaction = this.db.transaction(Object.keys(this.schema.stores), 'readonly');
		  const store = get_transaction.objectStore(storeName);
		  
		  get_transaction.onerror = function() {
			  console.log('Problem with get transaction on store:' + storeName);
		  }
		  
		  get_transaction.oncomplete = function() {
			  console.log('Success get transaction on store:' + storeName);
		  }
		  
		  let req = store.get(key);
		  req.onerror = function(e) {
			  console.log('Could not get record '+key+' from ' + storeName);
		  }
		  
		  req.onsuccess = function(e) {
			  console.log('Success got record '+key+' from ' + storeName, e.target.result);
		  }
		  
	  },
	  getAll: function(storeName) {
		  if(!this.db) {
			  console.log('No db opened.');
			  return;
		  }
		  const get_transaction = this.db.transaction(Object.keys(this.schema.stores), 'readonly');
		  const store = get_transaction.objectStore(storeName);
		  
		  get_transaction.onerror = function() {
			  console.log('Problem with getAll transaction on store:' + storeName);
		  }
		  
		  get_transaction.oncomplete = function() {
			  console.log('Success getAll transaction on store:' + storeName);
		  }
		  
		  let req = store.getAll();
		  req.onerror = function(e) {
			  console.log('Could not get all records from ' + storeName);
		  }
		  
		  req.onsuccess = function(e) {
			  console.log('Success got all records  from ' + storeName, e.target.result);
		  }
	  },
	  update: function(storeName, record) {
		  if(!this.db) {
			  console.log('No db opened.');
			  return;
		  }
		  
		  const update_transaction = this.db.transaction(Object.keys(this.schema.stores), 'readwrite');
		  const store = update_transaction.objectStore(storeName);
		  
		  update_transaction.onerror = function() {
			  console.log('Problem with update transaction on store:'+storeName);
		  }
		  
		  update_transaction.oncomplete = function() {
			  console.log('Success update transaction on store:'+storeName);
		  }
		  
		  let req = store.put(record);
		  req.onerror = function(e) {
			  console.log('Could not update record to '+storeName, record);
		  }
		  
		  req.onsuccess = function(e) {
			  console.log('Success updated record to '+storeName, record);
		  }
	  },
	  delete: function(storeName, key) {
		  if(!this.db) {
			  console.log('No db opened.');
			  return;
		  }
		  
		  const get_transaction = this.db.transaction(Object.keys(this.schema.stores), 'readwrite');
		  const store = delete_transaction.objectStore(storeName);
		  
		  delete_transaction.onerror = function() {
			  console.log('Problem with insert transaction on store:' + storeName);
		  }
		  
		  delete_transaction.oncomplete = function() {
			  console.log('Success insert transaction on store:' + storeName);
		  }
		  
		  records.forEach(record => {
			  let req = store.delete(key);
			  req.onerror = function(e) {
				  console.log('Could not delete record '+key+' from '+storeName, record);
			  }
			  
			  req.onsuccess = function(e) {
				  console.log('Success deleted record '+key+' from '+storeName, record);
			  }
		  });
	  },
  };
  
  return pub;
})();

var debug= {is: true};

/*
Storage.start();
Storage.idxdb.schema.add('test');
Storage.idxdb.create('testDb');
Storage.idxdb.drop('testDb');  
*/

export {Storage, debug}