'use strict';
importScripts('modules/timocom/bridge.js');
const MENU_ID = 'transport-route-review';
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({id: MENU_ID, title: 'Przygotuj trasę w Google Maps', contexts: ['selection']}, () => {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message);
    });
  });
});
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText?.trim()) return;
  openReview(info.selectionText).catch(error => console.error('Nie udało się otworzyć podglądu trasy:', error));
});
async function openReview(text, points = null) {
  const id = crypto.randomUUID();
  const key = 'selection-' + id;
  const entries = await chrome.storage.session.get(null);
  const expired = Object.keys(entries).filter(k => k.startsWith('selection-') && Date.now() - (entries[k]?.createdAt || 0) > 3600000);
  if (expired.length) await chrome.storage.session.remove(expired);
  await chrome.storage.session.set({[key]: {text, ...(points ? {points, source: 'timocom'} : {}), createdAt: Date.now()}});
  try {
    await chrome.tabs.create({url: chrome.runtime.getURL('popup.html') + '?selection=' + encodeURIComponent(id)});
  } catch (error) {
    await chrome.storage.session.remove(key);
    throw error;
  }
}
