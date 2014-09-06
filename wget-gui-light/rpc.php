<?php

## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2014 <samoylovnn@gmail.com>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   Look in 'version.js'
##
## @depends   *nix, php5, wget, bash, ps, rm


# *****************************************************************************
# ***                               Config                                   **
# *****************************************************************************

## Add debug info to log and output. Comment this line or set 'false' for 
##   disable this feature
#define('DebugMode', false);

## Settings paths
##   Path to directory, where this script located
define('BASEPATH', realpath(dirname(__FILE__)));

##   Path to downloads directory. Any files will download to this path 
##     (without '/' at the end).
##     CHANGE DEFAULT PATH
define('download_path', BASEPATH.'/downloads');

##   Path to temp files directory. Temp files will created by 'wget' for 
##     getting progress in background job, and will be deleted automatically
##     on finish or cancel task (thx to <https://github.com/ghospich>)
##     (without '/' at the end).
define('tmp_path', '/tmp');

## Write logs messages to some directory. Uncomment this line for enable 
##   this feature (without '/' at the end).
##     CHANGE DEFAULT PATH
define('log_path', BASEPATH.'/log');

## Write massages on complete/error tasks to this file. Also it enable
##   'get_history' action feature. Uncomment this line for enable this
##   feature
define('history', BASEPATH.'/log/history.log');

## Set maximum tasks count in one time. Comment this line for disable this
##   feature
define('WgetOnetimeLimit', 10);

## Path to 'wget' (check in console '> which wget'). uncomment and set if
## downloads tasks will not work
#define('wget', '/usr/bin/wget');

## Path to 'ps' (check in console '> which ps'). Uncomment and set if listing
## of active tasks will now shown
#define('ps',   '/bin/ps');

## Path to 'rm' (check in console '> which rm'). Uncomment and set if files
## not removes
#define('rm', '/bin/rm');

## Wget speed limit for tasks in KiB (numeric only). Uncomment for enable this
##   feature
define('wget_download_limit', '2048');

## Wget 'Secret flag'. By this parameter we understand - task in background
##   created by this script, or not. DO NOT change this
define('wget_secret_flag', '--max-redirect=4321');

# *****************************************************************************
# ***                            END Config                                  **
# *****************************************************************************

header('Content-Type: application/json; charset=UTF-8'); // Default header
header('Access-Control-Allow-Origin: *'); // For request from anywhere

if(defined('DebugMode') && DebugMode) {
    error_reporting(-1); ini_set('display_errors', 'On');
} else error_reporting(0);

if(!defined('tmp_path')) define('tmp_path', '/tmp');
if(!defined('wget')) define('wget', 'wget');
if(!defined('ps'))   define('ps', 'ps');
if(!defined('rm'))   define('rm', 'rm');

/**
 * Simple class for writing messages to a log file. Simple call is: "log::debug('Something happens');"
 */
class log {
    const ErrorsLog  = 'wgetgui.log';
    const WarningLog = 'wgetgui.log';
    const NoticesLog = 'wgetgui.log';
    const DebugLog   = 'wgetgui.log';
    ## --- Or you can set ---
    #const NoticesLog = 'wgetgui-notices.log';
    #const WarningLog = 'wgetgui-warnings.log';
    #const ErrorsLog  = 'wgetgui-errors.log';
    #const DebugLog   = 'wgetgui-debug.log';
    
    private static function getTimeStamp() {
        list($usec, $sec) = explode(' ', microtime());
        return '['.date('Y/m/d H:i:s.', $sec) . substr($usec, 2, 3).']';
    }
    
    private static function checkPermissions() {
        return (file_exists(log_path) && is_dir(log_path) && is_writable(log_path)) ? true : false;
    }
    
    private static function writeLog($logName, $msg = '') {

        if(!defined('log_path')) return false;
        
        $msg = str_replace(array("  ", "\n", "\r", "\t"), "", $msg);
        $msg = str_replace(array(",)", ", )"), ")", $msg);
        $msg = str_replace("array (", "array(", $msg);
        
        if(!self::checkPermissions()) {
            mkdir(log_path, 0777, true); chmod(log_path, 0777);
            if(!self::checkPermissions())
                return false;
        }
        
        $LogFilePath = log_path.'/'.$logName;
        
        $logFile = fopen($LogFilePath, 'a');
        if($logFile)
            if(fwrite($logFile, $msg."\n"))
                fclose($logFile);
        
        return true;
    }

    public static function error($msg) {
        return self::writeLog(self::ErrorsLog,  self::getTimeStamp().' (ERROR) '.$msg);
    }
    
    public static function warning($msg) {
        return self::writeLog(self::WarningLog, self::getTimeStamp().' (warning) '.$msg);
    }
    
    public static function notice($msg) {
        return self::writeLog(self::NoticesLog, self::getTimeStamp().' (notice) '.$msg);
    }
    
    public static function debug($msg) {
        if(defined('DebugMode') && DebugMode)
            return self::writeLog(self::DebugLog, self::getTimeStamp().' (debug) '.$msg);
        else return false;
    }
    
    public static function emptyLine() {
        return self::writeLog(self::DebugLog, '');
    }
}

/**
 * Make system command call, return result as string or array
 *
 * @param  (string) (cmd) Command for execute
 * @param  (string) (result_type) Type for result ('string' or 'array')
 * @return (string) Exec output
 */
function bash($cmd, $result_type = '') {
    $out = ''; $result = '';
    
    if(empty($cmd))
        return false;
        
    exec($cmd, $out);
    
    $result_type = empty($result_type) ? 'string' : $result_type;
    
    switch ($result_type) {
        case 'string':
            foreach($out as $line)
                $result .= $line."\n";
            break;
        case 'array':
                $result = $out;
            break;
    }
    return $result;
}

/**
 * Check PID value
 *
 * @param  (numeric) (pid) Pid number
 * @return (bool)
 */
function validatePid($pid) {
    // 32768 is maximum pid by default
    return (is_numeric($pid) && ($pid > 0) && ($pid <= 32768)) ? true : false;
}

/**
 * Make string clear, for file system file name
 *
 * @param  (string) (str) Input string
 * @return (string)
 */
function makeStringSafe($str) {
    return str_replace(array("'", "\"", "\\", "/", "*", "$", "|", "`", "<", ">", "?", ":", "\n", "\r", "\t", "\0"), "", $str);
}

/**
 * Make url clear, without 'unsecure' chars
 *
 * @param  (string) (str) Input string
 * @return (string)
 */
function makeUrlSafe($str) {
    return str_replace( // http://tools.ietf.org/html/rfc1738
        // encode url string, and make "back-encode" some important for wget chars
        array('%2F', '%3A', '%40', '%3F', '%3D', '%26'),
        array('/',   ':',   '@',   '?',   '=',   '&'),
        rawurlencode($str)
    );
}

/**
 * Get wget tasks from `ps` 'as is'; or only with string, if $string is not
 *  empty (passed in $string); or with PID = $string, if $string is 
 *  valid PID
 *
 * @param  (string|numeric) (string) String or PID for search
 * @return (array)
 */
function getWgetTasksList($string = '') {
    log::debug('(call) getWgetTasksList() called, $string='.var_export($string, true));
    $result = array();
    // For BSD 'ps axwwo pid,args'
    // Issue <https://github.com/tarampampam/wget-gui-light/issues/8>
    // Thx to @ghospich <https://github.com/ghospich>
    $tasks = bash(ps.' -ewwo pid,args', 'array');
    $string = empty($string) ? ' ' : (string) $string;
    
    //var_dump($tasks);
    
    foreach($tasks as $task) {
        // make FAST search:
        // find string with 'wget' and without '2>&1'
        if((strpos($task, 'wget') !== false) && (strpos($task, $string) !== false)) {
            preg_match("/(\d{1,5})\swget.*--output-file=(\/.*\d{3,6}\.log\.tmp)(.*)".wget_secret_flag."\s(.*)/i", $task, $founded);
            //var_dump($task); var_dump($founded);
            $pid = @$founded[1]; $logfile = @$founded[2]; $etcParams = @$founded[3]; $url = @$founded[4];
            if(validatePid($pid)) {
                //var_dump($etcParams);
                preg_match('/--output-document=.*\/(.*?)\s$/', $etcParams, $etcParts);
                array_push($result, array(
                    'raw'     => (string) @$founded[0],
                    'saveAs'  => (string) @$etcParts[1],
                    'pid'     => (int) $pid,
                    'logfile' => (string) $logfile,
                    'url'     => (string) $url
                ));
            }
        }
    }
    
    // If in '$string' passed PID
    if(validatePid($string)) {
        foreach($result as $task)
            if($task['pid'] == $string) {
                log::debug('getWgetTasksList() return '.var_export($task, true));
                return $task;
            }
        return array();
    }
    
    log::debug('getWgetTasksList() return '.var_export($result, true));
    return $result;
}

/**
 * Get list of active tasks
 * ************************
 *
 * @return (array)
 */
function getWgetTasks() {
    log::debug('(call) getWgetTasks() called');
    $result = array();

    foreach(getWgetTasksList('') as $task) {
        $preogress = 0; 
        if(validatePid($task['pid']) && is_string($task['url']) && !empty($task['url'])) {
            if (!empty($task['logfile']) && file_exists($task['logfile'])) {
                // Read last line <http://stackoverflow.com/a/1510248>
                $lastline = (string) ''; $f = fopen($task['logfile'], 'r'); $cursor = -1;
                fseek($f, $cursor, SEEK_END); $char = fgetc($f);
                
                while ($char === "\n" || $char === "\r") {
                    fseek($f, $cursor--, SEEK_END);
                    $char = fgetc($f);
                }
                
                while ($char !== false && $char !== "\n" && $char !== "\r") {
                    $lastline = $char . $lastline;
                    fseek($f, $cursor--, SEEK_END);
                    $char = fgetc($f);
                }
                
                preg_match("/(\d{1,2}).*\[.*].*/i", $lastline, $founded);
                $preogress = !is_null(@$founded[1]) ? @$founded[1] : -1;
                //print_r($founded);
                
                log::debug('Last line is '.var_export($lastline, true).', progress value is '.var_export($preogress, true));
            }
            
            array_push($result, array(
                'pid'      => (int) $task['pid'],
                'logfile'  => (string) $task['logfile'],
                'saveAs'   => (string) $task['saveAs'],
                'progress' => (int) $preogress,
                'url'      => (string) $task['url']
            ));
        }
    }
    return $result;
}

/**
 * Remove download task. Kill process & remove temp log file
 * *********************************************************
 *
 * @param  (numeric) (pid) PID value for process
 * @return (array)
 */
function removeWgetTask($pid) {
    log::debug('(call) removeWgetTask() called, $pid='.var_export($pid, true));
    if(!validatePid($pid))
        return array(
            'result' => false,
            'msg' => 'ID is invalid'
        );

    $taskData = getWgetTasksList($pid);
    //var_dump($taskData);
    
    if(empty($taskData)) {
        log::debug('Task with ID '.$pid.' not exists');
        return array(
            'result' => false,
            'msg' => 'Task not exists'
        );
    }
    
    $kill = @posix_kill((int) $taskData['pid'], 15); // http://php.net/manual/ru/function.posix-kill.php
    if(!$kill) log::error('Task with PID '.$taskData['pid'].' NOT killed');
    
    usleep(200000); // at first - subprocess must del file. if not - when del we // 1/5 sec
    if (!empty($taskData['logfile']) && file_exists($taskData['logfile'])) {
        log::notice('removeWgetTask() remove file '.var_export($taskData['logfile'], true));
        $del = @unlink($taskData['logfile']); // http://php.net//manual/ru/function.unlink.php
        if(!$del) log::error('File '.var_export($taskData['logfile'], true).' NOT deleted');
    }
    
    if(!is_null($taskData['pid']) && $kill) {
        log::notice('Task with ID '.var_export($taskData['pid'], true).' killed');
        return array(
            'result' => true,
            'msg' => 'Task removed success'
        );
    }
        
    return array(
        'result' => false,
        'msg' => 'No remove data'
    );
}
//var_dump(removeWgetTask(1276)); // Debug call

/**
 * Add task for a work
 * *******************
 *
 * @param  (string) (url) Url for task
 * @param  (string) (saveAs) Save to this file name
 * @return (array)
 */
function addWgetTask($url, $saveAs) {
    function checkPermissions($path) {
        return (file_exists($path) && is_dir($path) && is_writable($path)) ? true : false;
    }
    function checkDirectory($dir) {
        if(!checkPermissions($dir)) {
            mkdir($dir, 0777, true); chmod($dir, 0777);
            return checkPermissions($dir) ? true : false;
        } return true;
    }
    log::debug('(call) addWgetTask() called, $url='.var_export($url, true).', $saveAs='.var_export($saveAs, true));
    
    $urlWasChanged = false; // flag - url was changed (parsed), or will be not changed
    define('OriginalTaskUrl', $url); // Save in constant original task url
    
    if(empty($url)) return array('result' => false, 'msg' => 'No URL');
    
    if(defined('WgetOnetimeLimit') && (count(getWgetTasks())+1 > WgetOnetimeLimit)) {
        log::notice('Task not added, because one time tasks limit is reached');
        return array('result' => false, 'msg' => 'One time tasks limit is reached');
    }

    if(!defined('download_path')) {
        log::error('"download_path" not defined');
        return array('result' => false, 'msg' => '"download_path" not defined');
    }
    
    if(!checkDirectory(download_path)) {
        log::error('Directory '.var_export(download_path, true).' cannot be created');
        return array('result' => false, 'msg' => 'Cannot create directory for downloads');
    }
    
    // DOWNLOAD YOUTUBE VIDEO
    // Detect - if url is link to youtube video
    if((strpos($url, 'youtube.com/') !== false) || (strpos($url, 'youtu.be/') !== false)) {
        $youtubeVideos = array();
        // http://stackoverflow.com/a/10315969/2252921
        preg_match('/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/', $url, $founded);
        // $founded[1] - is video ID
        if(isset($founded[1]) && !empty($founded[1]) && (strlen($founded[1]) == 11)) {
            $rawVideoInfo = file_get_contents('http://youtube.com/get_video_info?video_id='.$founded[1]);
            if(($rawVideoInfo !== false)) {
                parse_str($rawVideoInfo, $videoInfo);
                //var_dump($videoInfo);
                if(isset($videoInfo['url_encoded_fmt_stream_map'])) {
                    $my_formats_array = explode(',', $videoInfo['url_encoded_fmt_stream_map']);
                    foreach($my_formats_array as $videoItem) {
                        parse_str($videoItem, $videoItemData);
                        if(isset($videoItemData['url'])) {
                            //var_dump($videoItemData);
                            array_push($youtubeVideos, array(
                                'title'     => @$videoInfo['title'],
                                'thumbnail' => @$videoInfo['thumbnail_url'], // or 'iurlsd'
                                'url'       => urldecode($videoItemData['url']),
                                'type'      => @$videoItemData['type'],
                                'quality'   => @$videoItemData['quality']
                            ));
                        } else
                            log::error('Link to youtube video not exists '.var_export($videoItemData, true)); 
                    }
                } else
                    log::error('Youtube answer not contains \'url_encoded_fmt_stream_map\''); 
                
            } else
                log::error('Cannot call "file_get_contents()" for $url='.var_export($url, true));
        }
        //var_dump($youtubeVideos);
        
        // If we found video links
        if(count($youtubeVideos) > 0) {
            $videoToDownload = $youtubeVideos[0]; // get first (HD) video
            
            preg_match('~\/(.*?)\;~', $videoToDownload['type'], $extension);
            switch (@$extension[1]) {
                case 'mp4':   $fileExtension = 'mp4';  break;
                case 'webm':  $fileExtension = 'webm'; break;
                case 'x-flv': $fileExtension = 'flv';  break;
                case '3gpp':  $fileExtension = '3gp';  break;
                default: $fileExtension = 'video';
            }
            
            // Tadaaam :)
            $urlWasChanged = true;
            $url = $videoToDownload['url'];
            if(empty($saveAs))
                $saveAs = $videoToDownload['title'].' ('.$videoToDownload['quality'].').'.$fileExtension;
        }
    }
    
    $historyAction = ''; $saveAs = makeStringSafe($saveAs);
    if(defined('history'))
        if(checkDirectory(dirname(history))) {
            $savedAsCmdString = (!empty($saveAs)) ? ' ## SavedAs: \"'.$saveAs.'\"' : '';
            // If string passed in '$url' and saved 'OriginalTaskUrl' not equal each other,
            //   we understand - URL was PARSED and changed. And now, for a history 
            //   (tadatadaaaam =)) we must write ORIGINAL url (not parsed)
            $urlForHistory = ($url !== OriginalTaskUrl) ? OriginalTaskUrl : $url;
            $urlForHistoryCmd = ($url !== OriginalTaskUrl) ? ' && URL="'.$urlForHistory.'"' : '';
            $historyAction = ' && HISTORY="'.history.'"'.$urlForHistoryCmd.' && if [ "$?" = "0" ]; then '.
                                   'echo "Success: \"$URL\"'.$savedAsCmdString.'" >> "$HISTORY"; '.
                               'else '.
                                   'echo "Failed: \"$URL\"" >> "$HISTORY"; '.
                               'fi';
        } else
            log::error('Directory '.var_export(dirname(history), true).' cannot be created');
            
    $speedLimit = (defined('wget_download_limit')) ? '--limit-rate='.wget_download_limit.'k ' : ' ';
    $saveAsFile  = (!empty($saveAs)) ? '--output-document="'.download_path.'/'.$saveAs.'" ' : ' ';
    $tmpFileName = tmp_path.'/wget'.rand(1, 32768).'.log.tmp';
    
    $cmd = '(URL="'.$url.'"; TMPFILE="'.$tmpFileName.'"; echo > "$TMPFILE"; '.wget.' '.
        '--progress=bar:force --output-file="$TMPFILE" '. // forever stand at beginning
        '--tries=0 '.
        '--no-cache '.
        '--user-agent="Mozilla/5.0 (X11; Linux amd64; rv:21.0) Gecko/20100101 Firefox/21.0" '.
        '--directory-prefix="'.download_path.'" '.
        '--content-disposition '. // by <https://github.com/CodingFu>
        '--restrict-file-names=nocontrol '. // For Cyrillic correct filenames
        $speedLimit.
        $saveAsFile.
        wget_secret_flag.' '. // forever LAST param
        '"$URL"'.$historyAction.'; '.rm.' -f "$TMPFILE") > /dev/null 2>&1 & echo $!';
    
    log::debug('Command to exec: '.var_export($cmd, true));
    
    $task = bash($cmd, 'string');
    if(empty($task)) {
        log::error('Exec task '.var_export($cmd, true).' error');
        return array(
            'result' => false,
            'msg' => 'Exec task error'
        );
    }
    
    usleep(100000); // 1/10 sec
    
    preg_match("/(\d{2,5})/i", $task, $founded);
    $parentPid = @$founded[1];
    if(!validatePid($parentPid)) {
        log::error('Parent PID '.var_export($parentPid, true).' for task '.var_export($url, true).' not valid');
        return array(
            'result' => false,
            'msg' => 'Parent PID not valid'
        );
    }

    //var_dump($cmd); var_dump($task); var_dump($parentPid); 

    // Wait ~1 sec until child pipe not running, check every second
    for ($i = 1; $i <= 4; $i++) {
        // Get pipe with out wget task (search by $tmpFileName)
        $taskData = getWgetTasksList($tmpFileName);
        // Get last job with current URL
        $taskPid = @$taskData[0]['pid'];
        
        if(validatePid($taskPid)) 
            break;
        else
            usleep(250000); // 1/4 sec
    }
    
    if(!file_exists($tmpFileName)) {
        log::notice('Task '.var_export($url, true).' already complete (probably with error)');
        return array(
            'result' => true,
            'msg' => 'Task completed too fast (probably with error)'
        );
    }
    
    if(!validatePid($taskPid)) {
        log::error('Task PID '.var_export($taskPid, true).' for '.var_export($url, true).' not valid');
        return array(
            'result' => false,
            'msg' => 'Task PID not valid'
        );
    }
    
    log::notice('Task '.var_export($url, true).' added successful (pid '.var_export($taskPid, true).')');
    return array(
        'result' => true,
        'pid' => (int) $taskPid,
        'msg' => 'Task added successful'
    );
}

/**
 * Get history
 *
 * @param  (numeric) Entries count
 * @return (array)
 */
function getTasksHistory($count = 5) {
    if(!defined('history'))
        return array(
            'result' => false,
            'msg' => 'Feature disabled'
        );

    if(!file_exists(history))
        return array(
            'result' => false,
            'msg' => 'History file not exists'
        );

    $hist = file(history);
    if(is_bool($hist) && !$hist)
        return array(
            'result' => false,
            'msg' => 'Cannot open history file'
        );

    $result = array();
    $offset = ($count < count($hist)) ? count($hist)-$count : 0;
    for ($i = $offset; $i < count($hist); $i++) {
        $subResult = array();
        $currentLine = $hist[$i];
        preg_match("/([A-Za-z]+)\:\s\"(.*?)\"/i", $currentLine, $founded);
        //var_dump($founded);
        if(isset($founded[1]) && !empty($founded[1]) && isset($founded[2]) && !empty($founded[2])) {
            $subResult['success'] = (string) (strpos(strtolower($founded[1]), 'success') !== false) ? true : false;
            $subResult['url']     = (string) $founded[2];
            
            preg_match("/\s\#\#\sSavedAs\:\s\"(.*?)\"/i", $currentLine, $saveAsRaw);
            if(isset($saveAsRaw[1]) && !empty($saveAsRaw[1]))
                $subResult['savedAs'] = (string) $saveAsRaw[1];

            array_push($result, $subResult);
        }
    }
    return $result;
}

/**
 * Print work result
 *
 * @param  (string) (data) Data for a printing
 * @param  (string) (type) Type of result ('json' or 'text')
 * @return (bool) true
 */
function echoResult($data, $type) {
    log::debug('Returned data: '.var_export($data, true));
    $type = (empty($type)) ? 'json' : (string) $type;
    
    switch ($type) {
        case 'json':
            echo(json_encode($data));
            break;
        case 'text':
            var_dump($data);
            break;
    }
    if(defined('DebugMode') && DebugMode) log::emptyLine();
    return true;
}

// Result array {status: 0, msg: 'message'}
//   -1 - script started without errors
//    0 - error
//    1 - script finished without errors
$result = array('status' => -1, 'msg' => 'No input data');

// Command line support
if(isset($argv)) {
    log::debug('(ext) Command line run detected, $argv='.var_export($argv, true));
    if(isset($argv[1]) && !empty($argv[1])) {
        @$_GET['action'] = $argv[1];
        if(isset($argv[2]) && !empty($argv[2]))
            if(validatePid($argv[2]))
                @$_GET['id'] = $argv[2];
        else
            @$_GET['url'] = $argv[2];
        if(isset($argv[3]) && !empty($argv[3]))
            @$_GET['saveAs'] = $argv[3];
    }
}

// AJAX send data in GET, html in POST
if((count($_POST) > 0) and (count($_GET) === 0)) 
    $_GET = $_POST;
else 
    $_POST = $_GET;

if(!empty($_GET['action'])) {
    log::debug('Input data: '.var_export($_GET, true));
    // Set value from GET array to $formData
    $formData = array(
        'action' => preg_replace("/[^a-z_]/", "", strtolower(@$_GET['action'])),
        'url'    => makeUrlSafe(@$_GET['url']),
        'saveAs' => makeStringSafe(@$_GET['saveAs']),
        'id'     => preg_replace("/[^0-9]/", "", @$_GET['id'])
    );
    
    log::debug('Prepared data: '.var_export($formData, true));
    
    switch ($formData['action']) {
        ## Action - Get Tasks List
        ##########################
        case 'get_list':
            $result['tasks'] = array();
            
            foreach (getWgetTasks() as $task) {
                array_push($result['tasks'], array(
                    'url'      => (string) $task['url'],
                    'saveAs'   => (string) $task['saveAs'],
                    'progress' => (int) $task['progress'],
                    'id'       => (int) $task['pid']
                ));
            }
            
            if(!empty($result['tasks']))
                $result['msg'] = 'Active tasks list';
            else
                $result['msg'] = 'No active tasks';
                
            $result['status'] = 1;
            break;
            
        ## Action - Add Task
        ####################
        case 'add_task':
            $url    = $formData['url'];
            $saveAs = (!empty($formData['saveAs'])) ? $formData['saveAs'] : '';
            
            $addTaskResult = addWgetTask($url, $saveAs);
            
            if($addTaskResult['result'] === true) {
                $result['msg']    = !empty($addTaskResult['msg']) ? $addTaskResult['msg'] : 'Task added success';
                $result['id']     = (isset($addTaskResult['pid']) && validatePid($addTaskResult['pid'])) ? (int) $addTaskResult['pid'] : -1;
                $result['status'] = 1;
            } else {
                $result['msg']    = !empty($addTaskResult['msg']) ? $addTaskResult['msg'] : 'Error while adding task';
                $result['status'] = 0;
            }
            break;
            
        ## Action - Cancel (remove) Task
        ################################
        case 'remove_task':
            $id = $formData['id'];
            
            $removeResult = removeWgetTask($id);
            if($removeResult['result'] === true) {
                $result['msg']    = $removeResult['msg'];
                $result['status'] = 1;
            } else {
                $result['msg']    = $removeResult['msg'];
                $result['status'] = 0;
            }
            break;
            
        ## Action - Get history
        #######################
        case 'get_history':
            $itemsCount = 10;
            $historyItems = getTasksHistory($itemsCount);
            
            if(count($historyItems) > 0) {
                $result['history'] = $historyItems;
                $result['msg']     = 'Recent '.$itemsCount.' history entries';
                $result['status']  = 1;
            } else {
                $result['msg']    = 'History is empty';
                $result['status'] = 0;
            }

            break;
            
        ## Action - Cancel (remove) Task
        ################################
        case 'test':
            // Added after comment in issue <http://goo.gl/I8gYoK>
            if(is_dir(tmp_path) || is_writable(tmp_path)) {
                if(is_dir(download_path) || is_writable(download_path)) {
                    if(function_exists('ini_get') && !ini_get('safe_mode')) {
                        $testVal = (string) 'test'.rand(1024, 32768);
                        $bash = bash('echo "'.$testVal.'"', 'string');
                        if(strpos($bash, $testVal) !== false) {
                            $bash = bash(wget.' -V', 'array');
                            if(strpos(strtolower($bash[0]), 'gnu wget') !== false) {
                                preg_match("/(\d{1,2}\.\d{1,3}\.\d{1,3})/i", $bash[0], $founded);
                                $wgetVersion = @$founded[1];
                                if(!empty($wgetVersion)) {
                                    $result['msg'] = 'Patches is right, PHP \'safe_mode\' = Off, \'exec()\' enabled, \'wget\' version = \''.$wgetVersion.'\'. All looks right, cap!';
                                    $result['status'] = 1;
                                    break;
                                } else {
                                    $result['msg'] = 'Getting \'wget\' version error';
                                    $result['status'] = 0;
                                    break;
                                }
                            } else {
                                $result['msg'] = '\'wget\' not installed (http://www.gnu.org/software/wget/)';
                                $result['status'] = 0;
                                break;
                            }
                        } else {
                            $result['msg'] = 'Enable \'exec()\' in PHP (http://php.net/manual/en/function.exec.php)';
                            $result['status'] = 0;
                            break;
                        }
                    } else {
                        $result['msg'] = 'Disable PHP \'safe_mode\' (http://php.net/manual/en/features.safe-mode.php)';
                        $result['status'] = 0;
                        break;
                    }
                } else {
                    $result['msg'] = 'Directory, defined in \'download_path\' not exists or not writable';
                    $result['status'] = 0;
                    break;
                }
            } else {
                $result['msg'] = 'Directory, defined in \'tmp_path\' not exists or not writable';
                $result['status'] = 0;
                break;
            }
            break;
            
        default:
            $result['msg']    = 'No action';
            $result['status'] = 0;
    }

}

echoResult($result, 'json');
