
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
  
  pub.start= function() {
     if (navigator.storage && navigator.storage.persist)
   navigator.storage.persist().then(function(persistent) {
     if (persistent)
       console.log("Storage will not be cleared except by explicit user action");
     else
       console.log("Storage may be cleared by the UA under storage pressure.");
   }); 
  
  }
  
  return pub;
})();

var debug= {is: true};

export {Storage, debug}