<?php

## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2014 <samoylovnn@gmail.com>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   0.0.3
##
## @depends   *nix, php5, wget, bash, ps, kill, rm


# *****************************************************************************
# ***                               Config                                   **
# *****************************************************************************

## Errors reporting level (set '0' when publish)
error_reporting(0);

## Settings paths
##   Path to directory, where this script located
define('BASEPATH', realpath(dirname(__FILE__)));
##   Path to downloads directory. Any files will download to this path
define('download_path', BASEPATH.'/downloads');
##   Path to temp files directory. Temp files will created by 'wget' for 
##   getting progress in background job, and will be deleted automatically
##   on finish or cancel task (thx to <https://github.com/ghospich>).
##   Comment this line for disable this feature
define('tmp_path', '/tmp');

## Path to 'wget' (check in console '> which wget'). UNcomment and set if
## downloads tasks will not work
#define('wget', '/usr/bin/wget');

## Path to 'ps' (check in console '> which ps'). UNcomment and set if listing
## of active tasks will now shown
#define('ps',   '/bin/ps');

## Path to 'kill' (check in console '> which kill'). UNcomment and set if
## canceling tasks will not work
#define('kill', '/bin/kill');

## Path to 'rm' (check in console '> which rm'). UNcomment and set if files
## not removes
#define('rm', '/bin/rm');

## Wget speed limit for tasks in KiB (numeric only). Uncomment for enable this
##   feature
define('wget_download_limit', '1024');

## Wget 'Secret flag'. By this parameter we understand - task in background
##   created by this script, or not. DO NOT change this
define('wget_secret_flag', '--max-redirect=4321');

# *****************************************************************************
# ***                            END Config                                  **
# *****************************************************************************

header('Content-Type: application/json; charset=UTF-8'); // Default header

if(!defined('wget')) define('wget', 'wget');
if(!defined('ps'))   define('ps', 'ps');
if(!defined('kill')) define('kill', 'kill');
if(!defined('rm')) define('rm', 'rm');

// Prepare url before downloading
function prepareUrl($url) {
    return escapeshellarg($url);
}

// Make system command call, return result as string or array
function bash($cmd, $result_type) {
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

// Get PID value by any string in task
function getWgetTasksList($string) {
    $result = array();
    $tasks = bash(ps.' aux', 'array');
    $string = empty($string) ? ' ' : (string) $string;
    
    foreach($tasks as $task) {
        // make FAST search:
        // find string with 'wget' and without '2>&1'
        if((strpos($task, 'wget') == true) && (strpos($task, '2>&1') == false) && (strpos($task, $string) == true)) {
            if(defined('tmp_path')) {
                preg_match("/(\d{1,5}).*wget.*--output-file=(\/.*\d{3,6}\.log\.tmp).*".wget_secret_flag."\s(.*)/i", $task, $founded);
                $pid = $founded[1]; $logfile = $founded[2]; $url = $founded[3];
            } else {
                preg_match("/(\d{1,5}).*wget.*".wget_secret_flag."\s(.*)/i", $task, $founded);
                $pid = $founded[1]; $url = $founded[2];
            }
            array_push($result, array(
                'debug'    => (string) $founded[0],
                'pid'      => (int) $pid,
                'logfile'  => (string) $logfile,
                'url'      => (string) $url
            ));
        }
    }
    return $result;
}

// Check PID value
function validatePid($pid) {
    // 32768 is maximum pid by default
    return (is_numeric($pid) && ($pid > 0) && ($pid <= 32768)) ? true : false;
}

// IMPORTANT FUNCTION
// Remove download task. Just kill process
function removeWgetTask($pid) {
    if(!validatePid($pid))
        return false;

    $taskData = getWgetTasksList($pid);
    
    $kill = bash(kill.' -15 '.$taskData[0]['pid'], 'string');
    
    if (defined('tmp_path') && !empty($taskData[0]['logfile']) && file_exists($taskData[0]['logfile'])) {
        $del = bash(rm.' -f '.$taskData[0]['logfile'], 'string');
    }
    
    if(!is_null($taskData[0]['pid']) && empty($kill) && empty($del))
        return true;
        
    return false;
}
//var_dump(removeWgetTask(1276)); // Debug call


// IMPORTANT FUNCTION
// Add task for a work
function addWgetTask($url) {
    $speedLimit = (defined('wget_download_limit')) ? ' --limit-rate='.wget_download_limit.'k ' : '';
    $tmpFileName = (defined('tmp_path')) ? tmp_path.'/wget'.rand(1, 32768).'.log.tmp' : '';
    
    $tmpFileFlag = (defined('tmp_path')) ? ' --output-file="'.$tmpFileName.'" ' : '';
    $tmpFileRm   = (defined('tmp_path')) ? ' && '.rm.' -f "'.$tmpFileName.'"' : '';
    
    $cmd = '('.wget.' '.
        '--progress=bar:force '.
        '--tries=0 '.
        '--no-cache '.
        '--user-agent="Mozilla/5.0 (X11; Linux amd64; rv:21.0) Gecko/20100101 Firefox/21.0" '.
        '--directory-prefix="'.download_path.'" '.
        $speedLimit.
        $tmpFileFlag.
        wget_secret_flag.' '.
        prepareUrl($url).$tmpFileRm.') > /dev/null 2>&1 & echo $!';
    
    $task = bash($cmd, 'string');
    
    preg_match("/(\d{1,5})/i", $task, $founded);
    $pid = $founded[1];

    // var_dump($cmd); var_dump($task); var_dump($pid); 
    
    if(validatePid($pid)) {
        $taskData = getWgetTasksList($url);
        // Get last job with current URL
        $taskPid = $taskData[count($taskData)-1]['pid'];
    } else
        return -1;
    
    return (validatePid($taskPid)) ? $taskPid : -1;
}
//echo addWgetTask('http://goo.gl/v7Ujhg'); // Debug call

// IMPORTANT FUNCTION
// Get list of active jobs
function getWgetTasks() {
    $result = array();
    print_r($task);
    foreach(getWgetTasksList() as $task) {
        
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
                //echo "\n\n\n".$lastline."\n\n\n";
                preg_match("/(\d{1,2}).*\[.*].*/i", $lastline, $founded);
                $preogress = $founded[1];
                //print_r($founded);
            }
            
            array_push($result, array(
                'pid'      => (int) $task['pid'],
                'logfile'  => (string) $task['logfile'],
                'progress' => (int) $preogress,
                'url'      => (string) $task['url']
            ));
        }
    }
    return $result;
}
//print_r(getWgetTasks()); // Debug call

$Ajax = true; // Request by AJAX or POST?
// Result array {status: 0, msg: 'message'}
//   -1 - script started without errors
//    0 - error
//    1 - script finished without errors
$result = array('status' => -1, 'msg' => 'No input data');

// AJAX send data in GET, html in POST
if((count($_POST) > 0) and (count($_GET) === 0)) {
    $Ajax = false;
    // Move data from $_POST to $_GET
    $_GET = $_POST;
    // clear $_POST
    unset($_POST);
}

//$result['input'] = $_GET; // For debug

if(!empty($_GET['action'])) {
    // Set value from GET array to $formData
    $formData = array(
        'action' => $_GET['action'],
        'url' => $_GET['url'],
        'id' => $_GET['id']
    );
    // Make some clear
    foreach ($formData as $key => $value) {
        $formData[$key] = htmlspecialchars(strip_tags($value));
    }
    
    switch ($formData['action']) {
        ## Action - Get Tasks List
        ##########################
        case 'get_list':
            $result['tasks'] = array();
            
            foreach (getWgetTasks() as $task) {
                array_push($result['tasks'], array(
                    'url'      => (string) $task['url'],
                    'progress' => (int) $task['progress'],
                    'id'       => (int) $task['pid']
                ));
            }
            
            $result['msg']    = 'Active tasks list';
            $result['status'] = 1;
            break;
        ## Action - Add Task
        ####################
        case 'add_task':
            $url = $formData['url'];
            
            $taskPid = addWgetTask($url);
            
            if($taskPid > 0) {
                $result['msg']    = 'Task added';
                $result['id']     = (int) $taskPid;
                $result['status'] = 1;
            } else {
                $result['msg']    = 'Error task add';
                $result['status'] = 0;
            }
            break;
        ## Action - Cancel (remove) Task
        ################################
        case 'remove_task':
            $url = $formData['url'];
            $id = $formData['id'];
            
            if(removeWgetTask($id)) {
                $result['msg']    = 'Task removed';
                $result['status'] = 1;
            } else {
                $result['msg']    = 'Task remove error';
                $result['status'] = 0;
            }
            break;
            
        default:
            $result['msg']    = 'No action';
            $result['status'] = 0;
    }

}


echo(json_encode($result));