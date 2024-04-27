chrome.browserAction.onClicked.addListener((tab) => {
	chrome.tabs.executeScript(tab.id, {file: 'src/inject.js'})
	chrome.tabs.insertCSS(tab.id, {file: 'src/base.scss'})
})

var authorization = ''
var csrf_token = ''

function download_item(request) {
    chrome.storage.local.get(['path', 'use_id', 'use_zip'], settings => {
        const basePath = settings.path || '';
        const useZip = settings.use_zip || false;
        const useId = settings.use_id || false;

        if (request.length === 1 || !useZip) {
            // Legacy download logic
            request.forEach(item => {
                let filename = basePath + (useId ? createFilenameUsingId(item) : item.filename);
                try {
                    chrome.downloads.download({url: item.url, filename: filename});
                } catch (e) {
                    console.error('Download error:', e);
                }
            });
        } else {
            // ZIP download logic
            var zip = new JSZip();
            let pendingFiles = request.length;
            request.forEach(item => {
                let filename = useId ? createFilenameUsingId(item) : item.filename;
                fetch(item.url)
                    .then(response => response.blob())
                    .then(blob => {
                        zip.file(filename, blob, {binary: true});
                        if (--pendingFiles === 0) {
                            zip.generateAsync({type:"blob"})
                                .then(content => {
                                    let url = URL.createObjectURL(content);
                                    chrome.downloads.download({
                                        url: url,
                                        filename: basePath + 'downloaded_images.zip'
                                    });
                                })
                                .catch(e => console.error('ZIP generation error:', e));
                        }
                    })
                    .catch(e => console.error('Fetch error:', e));
            });
        }
    });
}

function createFilenameUsingId(item) {
    let urlParts = item.url.split('/');
    let identifier = urlParts[urlParts.length - 2];
    return identifier + '_' + item.filename;
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.hasOwnProperty('id')) {
		sendResponse({ authorization, csrf_token })
		return false
	}
	console.log(request)
	download_item(request)
	return false
})

function getAuth (e) {
	e.requestHeaders.forEach((h) => {
		switch (h.name.toLowerCase()) {
			case 'authorization':
				authorization = h.value
				break
			case 'x-csrf-token':
				csrf_token = h.value
				break
		}
	})
}

chrome.webRequest.onBeforeSendHeaders.addListener(
	getAuth,
	{urls: ['https://*.twitter.com/*']},
	['requestHeaders']
)
