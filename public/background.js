// background.js
chrome.action.onClicked.addListener((tab) => {
  // Membuka file index.html di tab baru
  chrome.tabs.create({
    url: 'index.html'
  });
});