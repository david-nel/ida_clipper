chrome.runtime.onInstalled.addListener(function() {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
