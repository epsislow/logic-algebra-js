import {Storage} from "/library/storage/Storage.js";

/*
 Module: DbStorage
 Version: 1.0.1
 Author: epsislow@gmail.com
*/

var DbStorageConstr = function (dbKey = 'dgldb', storeKey = 'dgl', LZString = 0, cacheSv = {'one': {}}) {
    let pub;
    pub = {
        savedSlots: {},
        pan:0,px:0,py:0, opx:0,opy:0,
        slots: ['default', 'key1', 'key2'],
        currentSlot: 0,
        storage: {
            dbopend: false,
            initIdxdb: function () {
                Storage.start();
                Storage.idxdb.schema.add(dbKey, storeKey);
                Storage.idxdb.open(dbKey, 1, pub.initDefaults);
            },
            initDefaults: function () {
                pub.storage.dbopend = 1;

                pub.loadSlotsInfo();
            },
            has: function(key, next) {
                Storage.idxdb.has(storeKey, key, next);
            },
            get: function(key, next) {
                Storage.idxdb.get(storeKey, key, function (record) {return next(record.value)});
            },
            set: function(key, value, next = 0) {
                Storage.idxdb.update(storeKey, [{'id': key, 'value': value}], next);
            },
            remove: function(keys, next=0) {
                Storage.idxdb.delete(storeKey, keys, next);
            },
            addToChain(next, chainObj) {
                chainObj.hdls.push(next);
            },
            nextInChain: function(chainObj) {
                if(!chainObj.hdls.length) {
                    return 0;
                }

                return chainObj.hdls.shift();
            },
            execChain: function(chainObj) {
                if(!chainObj.hdls.length) {
                    return 0;
                }

                chainObj.hdls.shift()();
            }
        },
        loadSlotsInfo: function (zip=1) {
            var slotsInfoObj = {hdls:[]};

            var that = pub;
            console.log('loadSlotsInfo');
            slotsInfoObj.hdls.push(function () {
                console.log('slotsInfoObj.has '+ storeKey + '.slots.info');
                that.storage.has(storeKey + ".slots.info", that.storage.nextInChain(slotsInfoObj))
            });

            slotsInfoObj.hdls.push(function (exists) {
                if (!exists) {
                    return;
                }
                console.log('slotsInfoObj.get '+ storeKey + '.slots.info');
                that.storage.get(storeKey + ".slots.info", that.storage.nextInChain(slotsInfoObj))
            });

            slotsInfoObj.hdls.push(function (string) {
                console.log('after slotsInfoObj.get success');
                if(!string) {
                    return 0;
                }

                console.log('slotsInfoObj.get decompress');

                if(zip && LZString) {
                    string=LZString
                        .decompressFromUTF16(string);
                }

                const data= JSON.parse(string);

                if (data.slots) {
                    that.slots = data.slots;
                }
                if (data.savedSlots) {
                    that.savedSlots= data.savedSlots;
                }
                if (data.currentSlot) {
                    that.currentSlot = data.currentSlot;
                }

                console.log('Slots info:', data);
            });

            pub.storage.execChain(slotsInfoObj);
        },
        saveSlotsInfo: function(zip=1) {
            console.log('saveSlotsInfo');
            const data= {
                slots: pub.slots,
                savedSlots: pub.savedSlots,
                currentSlot: pub.currentSlot,
            };

            var string = JSON.stringify(data);

            if(zip && LZString) {
                string = LZString
                    .compressToUTF16(string);

                console.log("Compressed: " + string.length);
            }

            var slotsInfoObj = {hdls:[]};
            var that = pub;
            slotsInfoObj.hdls.push(function () {
                console.log('slotsInfoObj.set ' + storeKey + '.slots.info');
                that.storage.set(storeKey + ".slots.info", string,  that.storage.nextInChain(slotsInfoObj))
            });

            slotsInfoObj.hdls.push(function () {
                console.log('Saved SlotsInfo');
            });

            pub.storage.execChain(slotsInfoObj);
        },
        save: function(data, dataLength = 0, slotId=0, zip=1, postSaveFn=0) {
            pub.savedSlots[parseInt(slotId)] = {length: dataLength};
            pub.saveSlotsInfo();

            slotId = slotId==0? '': slotId;

            var string;
            try {
               string = JSON.stringify(data);
            } catch (Error) {
                console.log(data);
                throw Error;
            }

            if(zip && LZString) {
                string = LZString
                    .compressToUTF16(string);
            }
            console.log("Compressed: " + string.length);

            var chainObj = {hdls:[]};
            var that = pub;
            chainObj.hdls.push(function () {
                console.log('Pre-save chainObj');
                that.storage.set(storeKey + ".data"+slotId, string, that.storage.nextInChain(chainObj))
            });

            chainObj.hdls.push((function (postSaveFn) {
              return function() {
                console.log('Saved Comps');
                if(postSaveFn) {
                  postSaveFn();
                }
              }
            })(postSaveFn));

            pub.storage.execChain(chainObj);

        },

        saveCacheSv: function (slotId=0, zip=1) {
            slotId = slotId==0? '': slotId;
            const data = cacheSv.one;

            var string = JSON.stringify(data);

            if(zip) {
                string = LZString
                    .compressToUTF16(string);
            }
            console.log("Compressed: " + string.length);

            var chainObj = {hdls:[]};
            var that = pub;
            chainObj.hdls.push(function () {
                console.log('Pre-save chainObj');
                that.storage.set(storeKey + ".data"+slotId, string, that.storage.nextInChain(chainObj))
            });

            chainObj.hdls.push(function () {
                console.log('SavedCacheSv to slot:'+ slotId);
                console.log('Now lets load.');
                that.load(slotId==''?0:slotId, zip);
            });

            pub.storage.execChain(chainObj);

        },
        remove: function(slotId) {
            slotId = slotId==0? '': slotId;

            var chainObj = {hdls:[]};
            var that = pub;

            chainObj.hdls.push(function () {
                that.storage.has(storeKey + ".data"+slotId, that.storage.nextInChain(chainObj))
            });

            chainObj.hdls.push(function (exists) {
                if(!exists) {
                    return;
                }
                that.storage.remove([storeKey + ".data"+slotId], that.storage.nextInChain(chainObj))
            });

            slotId = slotId==''? 0: slotId;
            delete pub.savedSlots[parseInt(slotId)];

            chainObj.hdls.push(function () {
                console.log('Slot '+slotId+' deleted');
            });

            pub.storage.execChain(chainObj);

            pub.saveSlotsInfo();
        },
        remove0: function(slotId) {
            slotId = slotId==0? '': slotId;
            localStorage.removeItem(storeKey + ".data"+ slotId);

            slotId = slotId==''? 0: slotId;
            delete pub.savedSlots[parseInt(slotId)];

            pub.saveSlotsInfo();
        },
        load: function(initCallback, getLengthFromData, slotId='', zip=1) {
            slotId = slotId==0? '': slotId;

            var chainObj = {hdls:[]};
            var that = pub;

            chainObj.hdls.push(function() {
                console.log('pre-has load');
                that.storage.has(storeKey + '.data'+slotId, that.storage.nextInChain(chainObj))
            });

            chainObj.hdls.push(function (exists) {
                if(!exists) {
                    return;
                }
                console.log('Pre-load chainObj');
                that.storage.get(storeKey + ".data"+slotId, that.storage.nextInChain(chainObj))
            });

            chainObj.hdls.push(function (string) {
                if (string === null) {
                    return false;
                }

                //  console.log(string);
                if(zip && LZString) {
                    string=LZString
                        .decompressFromUTF16(string);
                }
                const data= JSON.parse(string);

                console.log('Slot `' + slotId +'` loaded.');

                slotId = slotId==''? 0: slotId;
                that.savedSlots[parseInt(slotId)] = {length: getLengthFromData(data)};
                that.saveSlotsInfo();

                initCallback(data);
            });

            pub.storage.execChain(chainObj);
        },
    };

    return pub;
}

export { DbStorageConstr };
