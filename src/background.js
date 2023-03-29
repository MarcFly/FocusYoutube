// When tab updates for any reason, tell main script to do something to dom
chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        
        chrome.tabs.sendMessage(tabId, {"type": "page_update"})
       
    }
)



chrome.action.onClicked.addListener(async (tab) => {

    chrome.storage.local.get({"active": false}, (data) => {
        
        data.active = !data.active
        
        chrome.storage.local.set({"active": data.active}).then((data) => {
            chrome.tabs.reload(tab.id);
        })
    })
});        

chrome.runtime.onMessage.addListener(
    function(req, sender, sendResponse) {
        console.debug("From background: " + req);

        if(req.type == "registerInterval") {
            chrome.tabs.onRemoved.addListener(function(tabid, removed) {
                clearInterval(req.interval)
            })
        }
    } 
)