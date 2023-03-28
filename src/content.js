//======================================================================================
// Avoid Infinite scroll - Always
//======================================================================================

const watch_re = new RegExp(".*watch.*")

setInterval(function() {
    chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        if(tabs[0].url.match(watch_re) != null) return;
        
        const body = document.body,
        html = document.documentElement;
        

        let height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
        );
        
        if (height * 0.25 < html.scrollTop){
        window.scrollTo(0, 0);
        }
    })
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


const local_storage = chrome.storage.local.get().then((data) => { 
    observeDOM(document.getElementsByTagName("ytd-app")[0], function() {
        if(data.active == true) {
            // Check if channel, or video's channel is from the allowed list
            // Each square get the channel id associated ideally
    
            let elements = Array.from(document.getElementsByTagName("ytd-rich-item-renderer"));
            console.log(elements)
            for(let element of elements) {
                console.log(element)
                let items = Array.from(element.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string"))
                console.log(items)
                for(it of items){
                    if(!data.list.includes(it.textContent))
                        element.remove()
                }
            }
    
            items = document.getElementsByTagName("ytd-grid-video-renderer");
            while(items.length > 0) {
                //if(data.list.)
                items[0].remove();
            }
        }
    
        
    });     
    return data.list 
});

console.log(local_storage)





function onAddException() {
    console.log("Adding Exception")
    
    chrome.storage.local.get({"list": []}).then((data) => { 
        // Try to get first channel id
        let els = document.getElementsByTagName("meta")

        let filtered = Array.from(els).filter(x => x.getAttribute('itemprop'))

        for (let el of filtered) {
            if (el.getAttribute('itemprop') =='channelId'){
                console.log("Added channelId " + el.content)
                data.list.push(el.content)
                break
            }
        }

        // Then the full channel name

        els = document.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string")
        filtered = Array.from(els).filter(x => x.getAttribute('href'))
        for(let el of filtered) {
            data.list.push(el.textContent)
            console.log("Added channel name "+ el.textContent)
        }

        
        chrome.storage.local.set({"list":[...new Set(data.list)]})

        console.log(data.list)
    })
}

chrome.runtime.onMessage.addListener(
    function(req, sender, sendResponse) {
        console.log(req);

        if(req.type == "addException")
            onAddException()
        else if(req.type == "removeException")
            onRemoveException()
        else if(req.type == "clearExceptions")
            onClearExceptions()
    } 
)


