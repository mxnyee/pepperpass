import { isLoggedIn, addAccount } from '../../crypto/login';

console.log('This is the background page.');
console.log('Put the background scripts here.');
console.log('aaaaa');

// https://stackoverflow.com/a/20023723
chrome.runtime.onMessage.addListener(async (msg, sender, response) => {
  console.log('submitted form:', msg);
  if (msg.from === 'input' && msg.action === 'addAccount') {
    const { hostname, user, secret, isNew } = msg.payload;
    if (isLoggedIn() && isNew) {
      // Write new account into storage
      // (Ideally have a banner to ask user first)
      await addAccount(hostname, user, secret);
      // addAccount(hostname, user, secret);
    }
    // Indicate async
    // return true;
    response('received');
  }
});
