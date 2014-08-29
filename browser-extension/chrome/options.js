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

var saved = false;

function bg(){return chrome.extension.getBackgroundPage()}
function $(a){return document.getElementById(a)}
function noty(a){$('noty').innerHTML = (typeof a == 'string') ? a : ''}
$('pathToRpc').value = bg().getPathToRpc();

$('saveSettings').onclick = function(e) {
    var pathToRpc = $('pathToRpc').value || '';
    if(pathToRpc.length !== 0) {
        if((pathToRpc.substr(pathToRpc.length - 1) == '/') && !saved) {
            pathToRpc += 'rpc.php';
            $('pathToRpc').value = pathToRpc;
        }
        if(bg().validateUrl(pathToRpc)) {
            bg().setPathToRpc(pathToRpc);
            bg().saveSettings(function(){
                if(bg().getPathToRpc() === pathToRpc) {
                    noty('Settings saved');
                    saved = true;
                } else {
                    noty('Error while saving settings, <a target="_blank" href="http://goo.gl/sUW63T">write about it here</a>');
                    console.log('Saved URL: '+bg().getPathToRpc());
                    console.log('URL for save: '+pathToRpc);
                }
            });
        } else {
            noty('Url not valid');
        }
    } else {
        noty('Url cannot be empty');
    }
};
