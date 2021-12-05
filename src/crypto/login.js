const ACCOUNT_EMAIL = 'snowden@example.com';
const ACCOUNT_PASS =
  '5c47970310c7f2746caeea16fbb69f46962207832813ecfcc9269103c0bf0ab6';

const ACCOUNT_RECORDS = {
  [ACCOUNT_EMAIL]: {
    password: ACCOUNT_PASS,
    data: {},
  },
};

// https://remarkablemark.medium.com/how-to-generate-a-sha-256-hash-with-javascript-d3b2696382fd
async function hash(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

const encrypt = (data, key) => {
  const p = JSON.stringify(data);
  //   Encrypt using key
  const c = p;
  return c;
};

export const initAccountRecord = () => {
  const p = JSON.stringify(ACCOUNT_RECORDS);
  //   Encrypt using key
  const c = p;
  return c;
};

export const accountLogin = async (email, passphrase) => {
  try {
    const hashedPassphrase = await hash(passphrase);
    console.log({ email, passphrase, hashedPassphrase });
    return email === ACCOUNT_EMAIL && hashedPassphrase === ACCOUNT_PASS;
  } catch (e) {
    console.log('Unable to login.');
    return false;
  }
};

export const accountLogout = () => {};
