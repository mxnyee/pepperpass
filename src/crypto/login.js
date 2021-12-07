const ACCOUNT_EMAIL = 'snowden@example.com';
const PASS_SALT = 'bbaa575c266e964';
const ACCOUNT_PASS =
  '12d7118c30f8460995dd9938d3e3b0dd4d7e5539c56ecdb33fede5bf43e933f3';
const KEY_SALT = '1af775b6c86fafbb';

// https://stackoverflow.com/a/34356351
function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xf).toString(16));
  }
  return hex.join('');
}
function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return new Uint8Array(bytes);
}

// https://remarkablemark.medium.com/how-to-generate-a-sha-256-hash-with-javascript-d3b2696382fd
// const bytesToHex = (arr) => {
//   const array = Array.from(arr)
//   return array.map((bytes) => bytes.toString(16).padStart(2, '0'))
//   .join('');
// }
const hash = async (string) => {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  return bytesToHex(new Uint8Array(hashBuffer));
};

const encode = (raw) => {
  const enc = new TextEncoder();
  return enc.encode(raw);
};

const decode = (bytes) => {
  const dec = new TextDecoder();
  return dec.decode(bytes);
};

const stringifyStorage = (str) => {
  // Keep typed arrays as arrays and not objects https://stackoverflow.com/a/62544282
  return JSON.stringify(str, (k, v) =>
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

const deriveKey = async (master) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encode(master),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBytes(KEY_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

const encrypt = async (key, iv, data) => {
  const encoded = encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );
  console.log('encrypt:', iv, key, encoded, new Uint8Array(ciphertext));
  return new Uint8Array(ciphertext);
};

const decrypt = async (key, iv, data) => {
  console.log('decrypt:', key, iv, data);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );
  return JSON.parse(decode(plaintext));
};

const initAccountRecords = async (email, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  // const data = await encrypt(key, iv, []);
  const data = await encrypt(key, iv, [
    {
      urlMatch: ['www.stealmylogin.com'],
      user: 'buzz',
      secret: '123456',
    },
  ]);
  return {
    [email]: {
      email: ACCOUNT_EMAIL,
      password: ACCOUNT_PASS,
      salt: PASS_SALT,
      iv,
      data,
    },
  };
};

const getAccountRecord = async (email, password) => {
  const storage = await chrome.storage.local.get('dbStore');
  const account = storage.dbStore ? parseStorage(storage.dbStore)[email] : null;
  console.log('db storage:', account, storage.dbStore);
  if (email === ACCOUNT_EMAIL && !account) {
    const key = await deriveKey(password);
    const dbStore = await initAccountRecords(email, key);
    console.log('Initializing dbstore', dbStore, JSON.stringify(dbStore));
    await chrome.storage.local.set({
      dbStore: stringifyStorage(dbStore),
    });
    return dbStore[email];
  }
  return account;
};

const exportKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
};

const importKey = async (key) => {
  return await crypto.subtle.importKey('raw', key, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
};

const initSessionData = async (email, key, iv, data) => {
  return {
    email,
    key,
    iv,
    data,
  };
};

const unlockAccount = async (account, password) => {
  const key = await deriveKey(password);
  // Store session info
  const sessionStore = await initSessionData(
    account.email,
    await exportKey(key),
    account.iv,
    account.data
  );
  console.log(
    'unlocking:',
    account,
    sessionStore,
    JSON.stringify(sessionStore)
  );
  await chrome.storage.local.set({
    sessionStore: stringifyStorage(sessionStore),
  });
  return true;
};

export const accountLogin = async (email, password) => {
  try {
    const account = await getAccountRecord(email, password);
    if (!account) {
      // Email does not exist
      return false;
    }
    const hashedPassword = await hash(password + account.salt);
    if (hashedPassword !== account.password) {
      // Master password does not match
      return false;
    }
    return await unlockAccount(account, password);
  } catch (e) {
    console.log('Unable to login.');
    console.error(e, e.message, e.stack);
    return false;
  }
};

export const accountLogout = async () => {
  await chrome.storage.local.remove('sessionStore');
};

export const isLoggedIn = async () => {
  const storage = await chrome.storage.local.get('sessionStore');
  const session = storage.sessionStore
    ? parseStorage(storage.sessionStore)
    : null;
  return !!session?.email;
};

export const getSiteSecret = async (url, username) => {
  const storage = await chrome.storage.local.get('sessionStore');
  const session = storage.sessionStore
    ? parseStorage(storage.sessionStore)
    : null;
  const data = await decrypt(
    await importKey(session.key),
    session.iv,
    session.data
  );
  console.log('getting secret for site:', url, username, data);
  const match = data.find(({ urlMatch, user }) => {
    return urlMatch.includes(url) && user === username;
  });
  return match?.secret;
};

export const generateSecret = () => {
  const rand = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(rand);
};

const charSet =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
export const constructPassword = async (secret, pepper) => {
  // let hash = CryptoJS.SHA256(pepper + secret);
  // let passNum = BigInt("0x" + hash.toString(CryptoJS.enc.Hex));
  let hashed = await hash(pepper + secret);
  // TODO
  return hashed;
  let passNum = BigInt('0x' + hashed);
  const base = BigInt(charSet.length);
  let digits = [];
  let place = -1;
  let output = '';
  for (; passNum > 0; passNum = passNum / base) {
    console.log(`charSet`[passNum % base], passNum % base);
    digits.push(`charSet`[passNum % base]);
    place = place + 1;
  }
  console.log({ digits, place });
  for (; place >= 0; place--) {
    output += digits[place];
  }
  return output;
};

export const addAccount = async (hostname, user, secret) => {
  const storage = await chrome.storage.local.get(['sessionStore', 'dbStore']);
  // Add account to data and encrypt
  const session = storage.sessionStore
    ? parseStorage(storage.sessionStore)
    : null;
  const oldData = await decrypt(
    await importKey(session.key),
    session.iv,
    session.data
  );
  oldData.push({
    urlMatch: [hostname],
    user,
    secret,
  });
  console.log('saving accounts:', oldData);
  const newData = await encrypt(
    await importKey(session.key),
    session.iv,
    oldData
  );
  // Update session storage
  await chrome.storage.local.set({
    sessionStore: stringifyStorage({ ...session, data: newData }),
  });
  // Update db storage
  const accounts = storage.dbStore ? parseStorage(storage.dbStore) : null;
  await chrome.storage.local.set({
    dbStore: stringifyStorage({
      ...accounts,
      [session.email]: { ...accounts[session.email], data: newData },
    }),
  });
};
