/*
## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @package   Google Chrome Extension
## @copyright 2014 <samoylovnn@gmail.com>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   Look in 'manifest.json'
*/
'use strict';

var globSettings = {pathToRpc: 'http://yourserver.ltd/wget-gui/rpc.php'},
    globMenuItemID = 'WgetGUILightHelper',
    globUseGlobalStorage = true; // true = global, false = local 
        // TODO: Change to 'true' before release

        
/* -------------------------------------------------------------------------- */


function setPathToRpc(path) {
    globSettings.pathToRpc = (typeof path == 'string') ? path : globSettings.pathToRpc;
}

function getPathToRpc() {
    return globSettings.pathToRpc;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function validateUrl(url) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}

function saveSettings(callback) {
    function saveInStorage(a,b){
        return(globUseGlobalStorage)?chrome.storage.sync.set(a,b):chrome.storage.local.set(a,b)
    }
    
    saveInStorage({
        'pathToRpc': globSettings.pathToRpc
    }, function(result) {
        //console.info('Settings saved');
        if(typeof(callback) == "function") callback(true);
        return true;
    });
}

function loadSetting(callback) {
    function loadFromStorage(a,b){
        return(globUseGlobalStorage)?chrome.storage.sync.get(a,b):chrome.storage.local.get(a,b)
    }
    
    loadFromStorage(['pathToRpc'], function (value) {
        // If value not stored (loaded as 'undefined') - setup default (or setted in past) value
        setPathToRpc((typeof(value.pathToRpc) !== "undefined") ? value.pathToRpc : globSettings.pathToRpc);
        
        //console.info('Settings loaded');
        if(typeof(callback) == "function") callback(true);
        return true;
    });
}
 

/* -------------------------------------------------------------------------- */


function sendAjaxRequest(url, callback) {
    // <http://stackoverflow.com/a/18324384>
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if(xmlhttp.readyState == 4)
            if(xmlhttp.status == 200) {
                if(typeof(callback) == "function") try {
                    callback(JSON.parse(xmlhttp.responseText));
                } catch(e) {
                    console.warn("Invalid JSON answer:\n"+e);
                    callback(false);
                }
            } else showNotify('Error while sending request to "Wget GUI Light" is not valid. Please, check the settings');
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function showNotify(text, caption) {
    // <http://stackoverflow.com/a/23974386>
    var notiId = 'wget-gui-light-id'+getRandomInt(1,32768);
    var notiCaption = ((typeof caption == 'undefined') || (caption == '')) ? 'Wget GUI Light' : caption;
    if (!("Notification" in window))
        return false;
    else if (Notification.permission === "granted") {
        chrome.notifications.create(notiId,
            {   
                type: 'basic', 
                iconUrl: 'img/icon.png', 
                title: notiCaption, 
                message: text
            }, function(){});
    }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if(!('permission' in Notification)) {
                Notification.permission = permission;
            }
            if (permission === "granted") {
                chrome.notifications.create(notiId,
                    {   
                        type: 'basic', 
                        iconUrl: 'img/icon.png', 
                        title: notiCaption, 
                        message: text
                    }, function(){});
            }
        });
    }
}


/* -------------------------------------------------------------------------- */


function onInstall() {
    console.log("Extension Installed");
    chrome.tabs.create({ url: "options.html" });
}

function onUpdate() {
    console.log("Extension Updated");
}

function getVersion() {
    var details = chrome.app.getDetails();
    return details.version;
}

// <http://stackoverflow.com/a/2401788>
// Check if the version has changed.
var currVersion = getVersion(),
    prevVersion = localStorage['version'];
if(currVersion != prevVersion) {
    // Check if we just installed this extension.
    if((typeof prevVersion == 'undefined') || prevVersion == '') {
        onInstall();
    } else {
        onUpdate();
    }
    localStorage['version'] = currVersion;
}
//localStorage['version'] = ''; // Reset state 


/* -------------------------------------------------------------------------- */


loadSetting(function(){
    chrome.contextMenus.create({
        "id": globMenuItemID,
        "title": "Download with \"Wget GUI Light\"",
        "contexts":["link","image","video","audio"]
    }/*, function () {
        if (chrome.runtime.lastError) {
            console.warn('ERROR: ' + chrome.runtime.lastError.message);
        }
    }*/);
    
    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId === globMenuItemID) {
            var downloadURL = info.linkUrl || info.srcUrl;
            if(validateUrl(globSettings.pathToRpc)) {
                try {
                    var requestString = globSettings.pathToRpc+'?action=add_task&url='+downloadURL;
                    console.log('Executing request: '+requestString);
                    sendAjaxRequest(requestString, function(answer){
                        console.log(answer);
                        try {
                            if((answer !== false) && (answer.msg !== ''))
                                showNotify(downloadURL, answer.msg);
                        } catch(e) {showNotify(e)};
                    });
                } catch(e) {showNotify('Error try sending request')};
            } else {
                showNotify('Path to "Wget GUI Light" is not valid. Please, check the settings');
            }
        }
    });
});
