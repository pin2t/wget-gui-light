<?php

## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2015 <github.com/tarampampam>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light

#   _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____
#   \____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\
#
#     ____             _                  _                    __ _ 
#    |  _ \           | |                | |                  / _(_)
#    | |_) | __ _  ___| | _____ _ __   __| |   ___ ___  _ __ | |_ _  __ _
#    |  _ < / _` |/ __| |/ / _ \ '_ \ / _` |  / __/ _ \| '_ \|  _| |/ _` |
#    | |_) | (_| | (__|   <  __/ | | | (_| | | (_| (_) | | | | | | | (_| |
#    |____/ \__,_|\___|_|\_\___|_| |_|\__,_|  \___\___/|_| |_|_| |_|\__, |
#                                                                    __/ |
#                                                                   |___/
#   _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____
#   \____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\
#

## Project version
define('WGET_GUI_LIGHT_VERSION', '0.1.8');

## Add debug info to log-file (and maybe some output) + a lot of info in gui
##    console (used 'console.log') . Comment this line or set 'false' for
##    disable this feature
//define('DEBUG_MODE', true);

## Path to base directory (where this script located)
## > Without '/' at the end!
define('BASEPATH', realpath(dirname(__FILE__)));

## Base URL to this script
## > With '/' at the end!
define('BASEURL', 
  ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off')?'https':'http').
  '://'.$_SERVER['SERVER_NAME'].
  ($_SERVER['SERVER_PORT'] !== '80' ? ':'.$_SERVER['SERVER_PORT'] : '').
  dirname($_SERVER['REQUEST_URI']).
  ((substr(dirname($_SERVER['REQUEST_URI']), -1) !== '/') ? '/' : '')
);

## Path to downloads directory. Any files will download to this directory. And
## one more important notice - I recommend create symlink to downloads directory
## (named as './downloads'), instead changing this value. This is better
## practise and easiest way for updates.
## > Without '/' at the end!
define('DOWNLOAD_PATH', BASEPATH.'/downloads');

## URL to downloads directory (uncomment this line ONLY IF YOU HAVE WEB
##   ACCESS TO DOWNLOADS DIRECTORY)
## > With '/' at the end!
define('DOWNLOAD_URL', BASEURL.'downloads/');

## Path to temp files directory. Temp files will created by 'wget' for 
##   parsing progress state, and will be deleted automatically when finish
##   or cancel task (thx to <https://github.com/ghospich>)
## > Without '/' at the end!
define('TMP_PATH', '/tmp');

## Write messages to log files in this directory. Uncomment this line for
## enable this feature
## > Without '/' at the end!
## > CHANGE DEFAULT PATH
define('LOG_PATH', BASEPATH.'/log');

## Write massages on complete/error tasks to this file. Also it enable
## 'get_LOG_HISTORY' action feature. Uncomment this line for enable this
## feature
define('LOG_HISTORY', BASEPATH.'/log/history.log');

## How many max history entries RPC will return by calling 'get_history'
define('HISTORY_LENGTH', 5);

## Set maximum tasks count in one time. Comment this line for disable this
## feature
define('WGET_ONE_TIME_LIMIT', 10);

## Path to 'wget' (check in console '> which wget'). Uncomment and set if
## downloads tasks will not work
#define('wget', '/usr/bin/wget');

## Path to 'ps' (check in console '> which ps'). Uncomment and set if listing
## of active tasks will now shown
#define('ps', '/bin/ps');

## Path to 'rm' (check in console '> which rm'). Uncomment and set if files
## not removes
#define('rm', '/bin/rm');

## Wget speed limit for tasks in KiB (numeric only). Uncomment for enable this
## feature
define('WGET_DOWNLOAD_LIMIT', '2048');

## Wget 'Secret flag'. By this parameter we identify wget tasks in background
## > DO NOT change this
define('WGET_SECRET_FLAG', '--max-redirect=4321');

## Setup default timezone (if not setted)
if(!ini_get('date.timezone')) date_default_timezone_set('GMT');

#   _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____
#   \____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\
#
#   ______               _                 _                    __ _       
#  |  ____|             | |               | |                  / _(_)      
#  | |__ _ __ ___  _ __ | |_ ___ _ __   __| |   ___ ___  _ __ | |_ _  __ _ 
#  |  __| '__/ _ \| '_ \| __/ _ \ '_ \ / _` |  / __/ _ \| '_ \|  _| |/ _` |
#  | |  | | | (_) | | | | ||  __/ | | | (_| | | (_| (_) | | | | | | | (_| |
#  |_|  |_|  \___/|_| |_|\__\___|_| |_|\__,_|  \___\___/|_| |_|_| |_|\__, |
#                                                                     __/ |
#                                                                    |___/ 
#   _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____
#   \____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\
#

if(isset($_GET) && array_key_exists('js', $_GET)) {
header('Content-Type: application/javascript');
?>
var WGET_GUI_LIGHT_VERSION = '<?php
      if(defined('WGET_GUI_LIGHT_VERSION')) echo(WGET_GUI_LIGHT_VERSION);
    ?>',
    DEBUG_MODE = <?php
      echo((defined('DEBUG_MODE') && DEBUG_MODE) ? 'true' : 'false');
    ?>,
    addTasksLimitCount = 5, // How many requests can be passed in one time
    updateStatusInterval = 5 * 1000, // Update interval (in milliseconds)
                                     // Interval for checking changes loop
    CheckForUpdates = true, // Enable checking for newest versions
    CheckExtensionInstalled = true,  // Check - installed extension for
                                     // browser, or not?
    rpc = '<?php if(defined('BASEURL')) echo(BASEURL); ?>rpc.php'; // IMPORTANT! Path to 'rpc.php' for AJAX requests

<?php }

#   _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____
#   \____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\
#
#   ___      _   _   _                 ___ _           _
#  / __| ___| |_| |_(_)_ _  __ _ ___  / __| |_  ___ __| |_____ _ _
#  \__ \/ -_)  _|  _| | ' \/ _` (_-< | (__| ' \/ -_) _| / / -_) '_|
#  |___/\___|\__|\__|_|_||_\__, /__/  \___|_||_\___\__|_\_\___|_|
#                          |___/
#   _____ _____ _____ _____ _____ _____ _____ _____ _____ _____ _____
#   \____\\____\\____\\____\\____\\____\\____\\____\\____\\____\\____\
#

$e = array(); // Errors
$em = array(  // Error Messages
  'checkSetting'   => 'Please check setting "%s" in "settings.php" file',
  'invalidSetting' => 'Invalid value for "%s" in "settings.php" file',
  'notDir' => 'Directory "%s" (setted in "settings.php" file) is not valid',
  'notDirOrNotWriteable' => 'Directory "%s" (setted in "settings.php"'.
    'file) is not valid or not writeable',
);
if(!defined('WGET_GUI_LIGHT_VERSION'))
  array_push($e, sprintf($em['checkSetting'], 'WGET_GUI_LIGHT_VERSION'));
elseif(floatval(WGET_GUI_LIGHT_VERSION) <= 0)
  array_push($e, sprintf($em['invalidSetting'], 'WGET_GUI_LIGHT_VERSION'));
  
if(!defined('BASEPATH'))
  array_push($e, sprintf($em['checkSetting'], 'BASEPATH'));
elseif(!is_dir(BASEPATH))
  array_push($e, sprintf($em['notDir'], BASEPATH));

if(!defined('DOWNLOAD_PATH'))
  array_push($e, sprintf($em['checkSetting'], 'DOWNLOAD_PATH'));
elseif(!is_dir(DOWNLOAD_PATH) || !is_writable(DOWNLOAD_PATH))
  array_push($e, sprintf($em['notDirOrNotWriteable'], DOWNLOAD_PATH));

if(!empty($e))
  echo("var settingsErrors = ['".htmlspecialchars(implode("','", $e), ENT_COMPAT)."'];".PHP_EOL);
