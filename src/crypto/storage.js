import { bytesToHex, hexToBytes } from './algs';

export const DB_STORE_KEY = 'dbStore';
export const SESSION_STORE_KEY = 'sessionStore';

const stringifyStorage = (str) => {
  return JSON.stringify(str, (k, v) =>
    // Typed arrays are stringified to objects by default https://stackoverflow.com/a/62544282
    // ArrayBuffer.isView(v) ? Array.from(v) : v
    ArrayBuffer.isView(v) ? bytesToHex(v) : v
  );
};

const parseStorage = (str) => {
  const untyped = JSON.parse(str);
  const typed = {};
  Object.entries(untyped).forEach(([k, v]) => {
    switch (k) {
      case 'key':
      case 'iv':
      case 'data':
        // typed[k] = new Uint8Array(v);
        typed[k] = new Uint8Array(hexToBytes(v));
        break;
      default:
        typed[k] = v;
    }
  });
  return typed;
};

export const getStore = async (storeKey) => {
  const storage = await chrome.storage.local.get(storeKey);
  const result = storage?.[storeKey] ? parseStorage(storage[storeKey]) : null;
  return result;
};

export const setStore = async (storeKey, obj) => {
  await chrome.storage.local.set({
    [storeKey]: stringifyStorage(obj),
  });
};

export const removeStore = async (storeKey) => {
  await chrome.storage.local.remove(storeKey);
  // DESTRUCTIVE
  //   await chrome.storage.local.clear();
  //   console.log('cleared storage:', await chrome.storage.local.get(null));
};
