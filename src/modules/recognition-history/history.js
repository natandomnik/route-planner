'use strict';
// Per-profile IndexedDB transactions prevent concurrent popup writes from losing records.
const RecognitionHistory = (() => {
  let database;
  function db() {
    return database ||= new Promise((resolve, reject) => {
      const request = indexedDB.open('route-planner-history', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('examples', {keyPath:'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { database = null; reject(request.error); };
    });
  }
  async function transact(mode, action) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('examples', mode);
      const store = transaction.objectStore('examples');
      let result;
      action(store, value => {result = value;});
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error('Nie udało się zapisać historii.'));
    });
  }
  const list = () => transact('readonly', (store, done) => {store.getAll().onsuccess = event => done(event.target.result.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));});
  async function start(text, settings) {
    if (!settings.modules.recognitionHistory) return null;
    const row = {id:crypto.randomUUID(),createdAt:new Date().toISOString(),text:text.slice(0,50000),source:'user',trigger:'recognize_ai_click'};
    await transact('readwrite', store => {
      store.put(row);
      store.getAll().onsuccess = event => {
        const rows = event.target.result.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
        for (const old of rows.slice(0, Math.max(0, rows.length - 500))) store.delete(old.id);
      };
    });
    return row.id;
  }
  async function update(id, patch) {
    if (!id) return;
    await transact('readwrite', store => {
      store.get(id).onsuccess = event => {
        const row = event.target.result;
        if (row && typeof patch.text === 'string') {
          store.put({...row,text:patch.text.slice(0,50000),updatedAt:new Date().toISOString()});
        }
      };
    });
  }
  return {list,start,update,remove:id=>transact('readwrite',store=>store.delete(id)),clear:()=>transact('readwrite',store=>store.clear())};
})();
