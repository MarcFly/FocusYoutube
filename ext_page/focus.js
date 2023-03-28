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


function AddException() {

    chrome.storage.local.get({"list": []}).then((data) => { 
        chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            
            let tab = tabs[0]

            let channel_at = tab.url.match(channel_at_re)
            let channel_eq = tab.url.match(channel_eq_re)
            
            console.log(channel_at + "\n" + channel_eq)

            data.list.push(channel_at)
            data.list.push(channel_eq)

            chrome.storage.local.set({"list":[...new Set(data.list)]}, () => {
                chrome.tabs.sendMessage(tab.id, {"type": "addException"})   
            })
        })
    })
}