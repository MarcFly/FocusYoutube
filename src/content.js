//======================================================================================
// Avoid Infinite scroll - Always
//======================================================================================

const watch_re = new RegExp(".*watch.*")

setInterval(function() {

    const body = document.body,
    html = document.documentElement;
    
    let height = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
    );
    
    if (height * 0.1 < html.scrollTop){
        window.scrollTo(0, 0);
    }

  }, 100);


//======================================================================================
// Block youtube videos
//======================================================================================

var observeDOM = (function(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    return function( obj, callback ){
      if( !obj || obj.nodeType !== 1 ) return; 
  
      if( MutationObserver ){
        // define a new observer
        var mutationObserver = new MutationObserver(callback)
  
        // have the observer observe for changes in children
        mutationObserver.observe( obj, { childList:true, subtree:true })
        return mutationObserver
      }
      
      // browser support fallback
      else if( window.addEventListener ){
        obj.addEventListener("DOMNodeInserted", callback, false)
        obj.addEventListener("DOMNodeRemoved", callback, false)
      }
    }
})()

const at_re = new RegExp("(?<=\/@)[^/]+(?=\/|$)")

let intervalId = setInterval( function() {

    chrome.storage.local.get().then((data) => {
        if(data.active == true) {
            // Check if channel, or video's channel is from the allowed list
            // Each square get the channel id associated ideally
            
            // Grid from home
            console.debug("Getting from ytd-rich-item-renderer")
            let elements = Array.from(document.getElementsByTagName("ytd-rich-item-renderer"));
            console.debug(elements)
            for(let element of elements) {
                console.debug(element)
                let items = Array.from(element.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string"))
                for(it of items){
                    console.debug(it)
                    if(!data.list.includes(it.textContent.replace(/\s+/g, ''))) {
                        console.debug("removed: "+ it.textContent.replace(/s+/g, ''))
                        element.remove()
                    }
                }
            }
            
            // Grid from subscribed
            console.debug("Getting from ytd-grid-item-renderer")
            elements = Array.from(document.getElementsByTagName("ytd-grid-video-renderer"));
            for(let element of elements) {
                let items = Array.from(element.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string"))
                for(it of items){
                    if(!data.list.includes(it.textContent.replace(/\s+/g,''))) {
                        console.debug("removed: "+ it.textContent.replace(/s+/g, ''))
                        element.remove()
                    }
                }
            }

            // Video Recomendations at the side
            console.debug("Getting from ytd-compact-video-render")
            elements = Array.from(document.getElementsByTagName("ytd-compact-video-renderer"));
            for(let element of elements) {
                let items = Array.from(element.getElementsByClassName("style-scope ytd-channel-name"))
                for(it of items){
                    if(it.getAttribute("id") != "text") continue;
                    if(data.list.includes(it.textContent.replace(/\s+/g, '')) == false) {
                        console.debug("removed: "+ it.textContent.replace(/s+/g, ''))
                        element.remove()
                    }
                }
            }
        }
    });

    
}, 500);

chrome.runtime.sendMessage({"type": "registerInterval", "interval": intervalId})

const hashtag_re = new RegExp("(?<=#).*")
const days_re = new RegExp("(?<=^\d+\s)[A-Za-z]+\s[A-Za-z]+$")

function onAddException() {
    console.debug("Adding Exception")
    
    chrome.storage.local.get({"list": []}).then((data) => { 
        // Try to get first channel id
        let els = document.getElementsByTagName("meta")

        let filtered = Array.from(els).filter(x => x.getAttribute('itemprop'))

        
        console.debug("Adding channel id...")
        for (let el of filtered) {
            if (el.getAttribute('itemprop') =='channelId'){
                console.debug("Added channelId " + el.content)
                data.list.push(el.content)
                break
            }
        }

        // Then the full channel name
        console.debug("Adding full channel @name...")
        els = document.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string")
        filtered = Array.from(els).filter(x => x.getAttribute('href'))
        console.debug(filtered)
        for(let el of filtered) {
            if(el.textContent.match(hashtag_re) == null && el.textContent.match(days_re) == null){
                data.list.push(el.textContent.replace(/s+/g, ''))
                console.debug("Added channel name "+ el.textContent.replace(/s+/g, ''))
            }
        }

        // When we are at the users page, we also might want the coloquial name (not id, not @name)
        console.debug("Adding coloquial channel name...")
        els = document.getElementsByClassName("style-scope ytd-channel-name");
        console.debug(els)
        filtered = Array.from(els).filter(x => x.localName == "yt-formatted-string")
        filtered = filtered.filter(x => x.id == "text" && x.textContent != "" )
        console.debug(filtered)
        for( let el of filtered) {
            data.list.push(el.textContent.replace(/s+/g, ''));
            console.debug("Added coloqiual channel name "+ el.textContent.replace(/s+/g, ''))
        }

        
        chrome.storage.local.set({"list":[...new Set(data.list)]})

        console.debug(data.list)
    })
}

function onRemoveException() {
    console.debug("Removing Exception")
    
    chrome.storage.local.get({"list": []}).then((data) => { 
        // Try to get first channel id
        let els = document.getElementsByTagName("meta")

        let filtered = Array.from(els).filter(x => x.getAttribute('itemprop'))

        console.debug(filtered);

        for (let el of filtered) {
            if (el.getAttribute('itemprop') =='channelId'){
                console.debug("Removed channelId " + el.content)
                data.list = data.list.filter(x => x != el.content);
                break
            }
        }

        // Then the full channel name

        els = document.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string")
        filtered = Array.from(els).filter(x => x.getAttribute('href'))
        console.debug(filtered)
        for(let el of filtered) {
            if(el.textContent.match(hashtag_re) == null && el.textContent.match(days_re)){
                data.list = data.list.filter(x => x != el.textContent);
                console.debug("Removed channel name "+ el.textContent)
            }
        }

        
        chrome.storage.local.set({"list":[...new Set(data.list)]})

        console.debug(data.list)
    })
}

function onClearExceptions() {
    chrome.storage.local.set({"list":[]})
}

chrome.runtime.onMessage.addListener(
    function(req, sender, sendResponse) {
        console.debug(req);

        if(req.type == "addException")
            onAddException()
        else if(req.type == "removeException")
            onRemoveException()
        else if(req.type == "clearExceptions")
            onClearExceptions()
    } 
)


