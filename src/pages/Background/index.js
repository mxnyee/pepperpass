import { initAccountRecord } from '../../crypto/login';

console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ accountStore: initAccountRecord() });
});
