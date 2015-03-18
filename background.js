var injecting = false,
    httpProtocol = ["http://*/*", "https://*/*"],
    acceptHeader = {
	name: "Accept-Clacks",
	value: "GNU Plain"
    },
    overheadRE = /([A-Z]+)\s+(".*?"|[^",]+)(?=\s*,|\s*$)/g,
    headerRE = /^(Clacks|X-Clacks-Overhead)$/i;
    clacksMessages = [],
    messageSource = function(details) {
        return details.url.match(/:\/\/([^/:]+)/)[1];
    },
    addMessage = function(code, value, source) {
	if(/^[GNU]+$/.test(code)) {
            for(var i=clacksMessages.length-1; i>=0; --i) {
                if(clacksMessages[i].code===code && clacksMessages[i].value===value) {
                    clacksMessages[i].source[source] = true;
                    return;
                }
            }
            var sourceMap = {};
            sourceMap[source] = true;
            clacksMessages.push({
                code:code,
                value:value,
                source:sourceMap
            });
	}
    },
    receiver = function(details) {
	if(!details.responseHeaders) return;
	var responseHeadersLength = details.responseHeaders.length;
	for(var i=0; i<responseHeadersLength; ++i) {
	    if(headerRE.test(details.responseHeaders[i].name)) {
		var header = details.responseHeaders[i].value;
		var source = messageSource(details);
		var message;
		while((message = overheadRE.exec(header)) !== null) {
		    addMessage(message[1], message[2].trim(), source);
		}
	    }
	}
    },
    injector = function(details) {
	details.requestHeaders.push(acceptHeader);
	var clacksMessagesLength = clacksMessages.length;
	for(var i=0; i<clacksMessagesLength; ++i) {
	    var message = clacksMessages[i];
	    if(!/U$/.test(message.code)) {
                if(message.source[messageSource(details)]) continue;
	    }
	    clacksMessages.splice(i, 1);
            var value = message.code + " " + message.value;
	    if(!/N/.test(message.code)) {
		console.log("clacks sent '" + value + "'");
	    }
	    details.requestHeaders.push({name: "Clacks", value: value});
	    if(/^G/.test(message.code)) {
		clacksMessages.push(message);
	    }
	    break;
	}
	return {"requestHeaders": details.requestHeaders};
    },
    startInjecting = function() {
	if(!injecting) {
	    console.log("started clacks overhead");
	    chrome.webRequest.onBeforeSendHeaders.addListener(injector,
		    {urls:httpProtocol}, ["blocking","requestHeaders"]);
	    chrome.webRequest.onHeadersReceived.addListener(receiver,
		    {urls:httpProtocol}, ["responseHeaders"]);
	    injecting = true;
	}
    },
    stopInjecting = function() {
	if(injecting) {
	    console.log("stopped clacks overhead");
	    chrome.webRequest.onBeforeSendHeaders.removeListener(injector);
	    chrome.webRequest.onHeadersReceived.removeListener(receiver);
	    injecting = false;
	}
    };

startInjecting();
/**
Copyright (c) 2015 Patrick Brown <opensource@whoopdedo.org>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/