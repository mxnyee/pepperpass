import {
  getStore,
  setStore,
  removeStore,
  DB_STORE_KEY,
  SESSION_STORE_KEY,
} from './storage';
import {
  rand,
  hash,
  deriveKey,
  importKey,
  exportKey,
  encrypt,
  decrypt,
} from './algs';

const ACCOUNT_EMAIL = 'snowden@example.com';
const PASS_SALT = 'bbaa575c266e964';
const ACCOUNT_PASS =
  '12d7118c30f8460995dd9938d3e3b0dd4d7e5539c56ecdb33fede5bf43e933f3';

const SAMPLE_DATA = [
  {
    urlMatch: ['www.stealmylogin.com'],
    user: 'buzz',
    secret: '123456',
  },
];

const initAccountRecords = async (email, key) => {
  const iv = rand(16);
  // const data = await encrypt(key, iv, []);
  const data = await encrypt(key, iv, SAMPLE_DATA);
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
  const accounts = await getStore(DB_STORE_KEY);
  const account = accounts?.[email];
  console.log('dbStore:', accounts);
  if (email === ACCOUNT_EMAIL && !account) {
    // First time logging in
    const key = await deriveKey(password);
    const dbStore = await initAccountRecords(email, key);
    console.log('Initializing dbStore', dbStore);
    await setStore(dbStore);
    return dbStore[email];
  }
  return account;
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
  console.log('unlocking:', account, sessionStore);
  await setStore(SESSION_STORE_KEY, sessionStore);
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
  await removeStore(SESSION_STORE_KEY);
};

export const getUserInfo = async () => {
  const session = await getStore(SESSION_STORE_KEY);
  console.log('user info:', session);
  return session;
};

export const isLoggedIn = async () => {
  const session = await getUserInfo();
  return !!session?.email;
};

export const getSiteSecret = async (url, username) => {
  const session = await getStore(SESSION_STORE_KEY);
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

export const addAccount = async (hostname, user, secret) => {
  // Add account to data and encrypt
  const session = await getStore(SESSION_STORE_KEY);
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
  await setStore(SESSION_STORE_KEY, { ...session, data: newData });
  // Update db storage
  const accounts = await getStore(DB_STORE_KEY);
  await setStore(DB_STORE_KEY, {
    ...accounts,
    [session.email]: { ...accounts[session.email], data: newData },
  });
};
