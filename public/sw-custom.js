// Custom service worker logic for IndexedDB caching of catalog components and handling offline fetch intercepts
const DB_NAME = 'supabase-cache-db';
const DB_VERSION = 1;
const STORES = ['inverters', 'batteries', 'panels'];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllFromStore(storeName) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function saveToStore(storeName, items) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      items.forEach(item => {
        store.put(item);
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  });
}

// Intercept fetching component catalogs from Supabase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercept GET requests to Supabase component tables
  if (
    event.request.method === 'GET' &&
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/rest/v1/')
  ) {
    let table = null;
    if (url.pathname.includes('/inverters')) table = 'inverters';
    else if (url.pathname.includes('/batteries')) table = 'batteries';
    else if (url.pathname.includes('/panels')) table = 'panels';
    
    if (table) {
      event.respondWith(
        fetch(event.request)
          .then(async (response) => {
            // Clone response, parse and save to IndexedDB cache
            const clone = response.clone();
            try {
              const data = await clone.json();
              if (Array.isArray(data)) {
                await saveToStore(table, data);
              }
            } catch (err) {
              console.error('[SW] Failed to cache table ' + table, err);
            }
            return response;
          })
          .catch(async () => {
            // Offline fallback: load all from IndexedDB
            console.log(`[SW] Offline: loading ${table} from IndexedDB cache`);
            try {
              const cachedData = await getAllFromStore(table);
              return new Response(JSON.stringify(cachedData), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
                statusText: 'OK'
              });
            } catch (err) {
              console.error('[SW] Failed to load from IndexedDB cache', err);
              return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
                statusText: 'OK'
              });
            }
          })
      );
    }
  }
});
