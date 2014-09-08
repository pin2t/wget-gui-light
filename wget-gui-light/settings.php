<?php

## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2014 <samoylovnn@gmail.com>
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
define('WGET_GUI_LIGHT_VERSION', '0.1.5');

## Add debug info to log-file (and maybe some output) + a lot of info in gui
##    console (used 'console.log') . Comment this line or set 'false' for
##    disable this feature
#define('DebugMode', true);

##   Path to downloads directory. Any files will download to this path 
##   > Without '/' at the end!
##   > CHANGE DEFAULT PATH
define('download_path', BASEPATH.'/downloads');

##   Path to temp files directory. Temp files will created by 'wget' for 
##     parsing progress state, and will be deleted automatically when finish
##     or cancel task (thx to <https://github.com/ghospich>)
##   > Without '/' at the end!
define('tmp_path', '/tmp');

## Write messages to log files in this directory. Uncomment this line for
##   enable this feature
##   > Without '/' at the end!
##   > CHANGE DEFAULT PATH
define('log_path', BASEPATH.'/log');

## Write massages on complete/error tasks to this file. Also it enable
##   'get_history' action feature. Uncomment this line for enable this
##   feature
define('history', BASEPATH.'/log/history.log');

## Set maximum tasks count in one time. Comment this line for disable this
##   feature
define('WgetOnetimeLimit', 10);

## Path to 'wget' (check in console '> which wget'). Uncomment and set if
##   downloads tasks will not work
#define('wget', '/usr/bin/wget');

## Path to 'ps' (check in console '> which ps'). Uncomment and set if listing
##   of active tasks will now shown
#define('ps',   '/bin/ps');

## Path to 'rm' (check in console '> which rm'). Uncomment and set if files
##   not removes
#define('rm', '/bin/rm');

## Wget speed limit for tasks in KiB (numeric only). Uncomment for enable this
##   feature
define('wget_download_limit', '2048');

## Wget 'Secret flag'. By this parameter we identify wget tasks in background
##   > DO NOT change this
define('wget_secret_flag', '--max-redirect=4321');

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
header('Content-Type: application/javascript'); ?>

var WGET_GUI_LIGHT_VERSION = '<?php
        echo(WGET_GUI_LIGHT_VERSION);
    ?>',
    addTasksLimitCount = 5, // How many requests can be passed in one time
    updateStatusInterval = 5 * 1000, // Update interval (in milliseconds)
                                     // Interval for checking changes loop
    DebugMode = <?php
        echo((defined('DebugMode') && DebugMode) ? 'true' : 'false');
    ?>,
    CheckForUpdates = true, // Enable checking for newest versions
    CheckExtensionInstalled = true, // Check - installed extension for
                                    // browser, or not?
    prc = 'rpc.php'; // IMPORTANT! Path to 'rpc.php' for AJAX requests

<?php }
