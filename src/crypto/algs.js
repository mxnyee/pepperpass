const KEY_SALT = '1af775b6c86fafbb';

// https://stackoverflow.com/a/34356351
export function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xf).toString(16));
  }
  return hex.join('');
}
export function hexToBytes(hex) {
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
export const hash = async (string) => {
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

export const deriveKey = async (master) => {
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

export const exportKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
};

export const importKey = async (key) => {
  return await crypto.subtle.importKey('raw', key, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
};

export const encrypt = async (key, iv, data) => {
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

export const decrypt = async (key, iv, data) => {
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

export const rand = (size = 16) => {
  return crypto.getRandomValues(new Uint8Array(size));
};

export const generateSecret = () => {
  return bytesToHex(rand(16));
};

const charSet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ|#!"/$%?&*;:`,.+=-_~';
export const constructPassword = async (secret, pepper, passLen) => {
  // let hash = CryptoJS.SHA256(pepper + secret);
  // let passNum = BigInt("0x" + hash.toString(CryptoJS.enc.Hex));
  let hashed = await hash(pepper + secret);
  // TODO
  let passNum = BigInt('0x' + hashed);
  const base = BigInt(charSet.length);
  let digits = [];
  let output = '';
  for (; passNum > 0; passNum = passNum / base) {
    digits.push(charSet[passNum % base]);
  }
  for (let i = Math.min(passLen, digits.length) - 1; i >= 0; i--) {
    output += digits[i];
  }
  return output;
};
