function ChangeFocus() {
    chrome.storage.local.get({"active": false}, (data) => {
        
        data.active = !data.active
        console.log("Technically setting active")
        chrome.storage.local.set({"active": data.active}).then((data) => {
            chrome.tabs.query({"active": true, "currentWindow": true}, (tabs) => {
                for(let tab of tabs)
                    chrome.tabs.reload(tab.id)
            })
        })
    })
}

const channel_at_re = new RegExp("(?<=@)[^/]+(?=\/|$)")
const channel_eq_re = new RegExp("(?<=channel=)[^/]+(?=\/|$)")

document.getElementById("AddExceptionButton").addEventListener("click", AddException)
document.getElementById("FocusCheck").addEventListener("click", ChangeFocus)
document.getElementById("ClearExceptionsButton").addEventListener("click", ClearExceptions)
document.getElementById("PrintButton").addEventListener("click", PrintList)
document.getElementById("RemoveExceptionButton").addEventListener("click", RemoveException)


function AddException() {

    chrome.storage.local.get({"list": []}).then((data) => { 
        chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            
            let tab = tabs[0]

            let channel_at = tab.url.match(channel_at_re)
            let channel_eq = tab.url.match(channel_eq_re)
            
            console.log(channel_at + "\n" + channel_eq)

            if(channel_at != null)
                for(let at of channel_at)
                    data.list.push(at)
            
            if(channel_eq != null)
                for(let eq of channel_eq)
                    data.list.push(eq)

            chrome.storage.local.set({"list":[...new Set(data.list)]}, () => {
                chrome.tabs.sendMessage(tab.id, {"type": "addException"})   
            })
        })
    })
}

function RemoveException() {
    chrome.storage.local.get({"list": []}).then((data) => { 
        chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            
            let tab = tabs[0]

            let channel_at = tab.url.match(channel_at_re)
            let channel_eq = tab.url.match(channel_eq_re)
            
            console.log(channel_at + "\n" + channel_eq)

            if(channel_at != null)
                for(let at of channel_at)
                    data.list = data.list.filter(x => x != at);
            
            if(channel_eq != null)
                for(let eq of channel_eq)
                    data.list = data.list.filter(x => x != eq);

            chrome.storage.local.set({"list":[...new Set(data.list)]}, () => {
                chrome.tabs.sendMessage(tab.id, {"type": "removeException"})   
            })
        })
    })
}

function ClearExceptions() {
    chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {"type": "clearExceptions"}) 
    });
}

function PrintList() {
    chrome.storage.local.get({"list": []}).then((data) => { 
        console.log(data.list);
    });
}