let dir = document.querySelector('#dir');
let id = document.querySelector('#id');
let useZip = document.querySelector('#use_zip');

function saveOptions() {
    let path = dir.value.replace(/\/+$/, '') + '/';
    path = path === '/' ? '' : path;
    chrome.storage.local.set({
        path,
        use_id: id.checked,
        use_zip: useZip.checked
    });
}

function restoreOptions() {
    chrome.storage.local.get(['path', 'use_id', 'use_zip'], (result) => {
        dir.value = result.path || '';
        id.checked = result.use_id || false;
        useZip.checked = result.use_zip || false;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
