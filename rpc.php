<?php

## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2014 <samoylovnn@gmail.com>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   0.0.7
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

if(!defined('tmp_path')) define('tmp_path', '/tmp');
if(!defined('wget')) define('wget', 'wget');
if(!defined('ps'))   define('ps', 'ps');
if(!defined('kill')) define('kill', 'kill');
if(!defined('rm'))   define('rm', 'rm');

//error_reporting(-1); ini_set('display_errors', 'On');

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

// Check PID value
function validatePid($pid) {
    // 32768 is maximum pid by default
    return (is_numeric($pid) && ($pid > 0) && ($pid <= 32768)) ? true : false;
}

// Get PID value by any string in task
function getWgetTasksList($string) {
    $result = array();
    // For BSD 'ps axwwo pid,args'
    // Issue <https://github.com/tarampampam/wget-gui-light/issues/8>
    // Thx to @ghospich <https://github.com/ghospich>
    //$tasks = bash(ps.' aux', 'array');
    $tasks = bash(ps.' -ewwo pid,args', 'array');
    $string = empty($string) ? ' ' : (string) $string;
    
    //var_dump($tasks);
    
    foreach($tasks as $task) {
        // make FAST search:
        // find string with 'wget' and without '2>&1'
        if((strpos($task, 'wget') !== false) && (strpos($task, '2>&1') == false) && (strpos($task, $string) !== false)) {
            preg_match("/(\d{1,5}).*wget.*--output-file=(\/.*\d{3,6}\.log\.tmp).*".wget_secret_flag."\s(.*)/i", $task, $founded);
            $pid = $founded[1]; $logfile = $founded[2]; $url = $founded[3];
            array_push($result, array(
                'debug'    => (string) $founded[0],
                'pid'      => (int) $pid,
                'logfile'  => (string) $logfile,
                'url'      => (string) $url
            ));
        }
    }
    
    // If in '$string' passed PID
    if(validatePid($string)) {
        foreach($result as $task)
            if($task['pid'] == $string)
                return $task;
        return array();
    }
                
    return $result;
}

// IMPORTANT FUNCTION
// Remove download task. Just kill process
function removeWgetTask($pid) {
    if(!validatePid($pid))
        return array(
            'result' => false,
            'msg' => 'ID is invalid'
        );

    $taskData = getWgetTasksList($pid);
    //var_dump($taskData);
    
    if(empty($taskData))
        return array(
            'result' => false,
            'msg' => 'Task not exists'
        );
    
    $kill = bash(kill.' -15 '.$taskData['pid'], 'string');
    if (!empty($taskData['logfile']) && file_exists($taskData['logfile'])) {
        $del = bash(rm.' -f '.$taskData['logfile'], 'string');
    }
    
    if(!is_null($taskData['pid']) && empty($kill) && empty($del))
        return array(
            'result' => true,
            'msg' => 'Task removed success'
        );
        
    return array(
        'result' => false,
        'msg' => 'No remove data'
    );
}
//var_dump(removeWgetTask(1276)); // Debug call


// IMPORTANT FUNCTION
// Add task for a work
function addWgetTask($url) {
    $speedLimit = (defined('wget_download_limit')) ? '--limit-rate='.wget_download_limit.'k ' : ' ';
    $tmpFileName = tmp_path.'/wget'.rand(1, 32768).'.log.tmp';
    
    $cmd = '('.wget.' '.
        '--progress=bar:force '.
        '--tries=0 '.
        '--no-cache '.
        '--user-agent="Mozilla/5.0 (X11; Linux amd64; rv:21.0) Gecko/20100101 Firefox/21.0" '.
        '--directory-prefix="'.download_path.'" '.
        $speedLimit.
        ' --output-file="'.$tmpFileName.'" '.
        wget_secret_flag.' '.
        prepareUrl($url).' && '.rm.' -f "'.$tmpFileName.'") > /dev/null 2>&1 & echo $!';
    
    $task = bash($cmd, 'string');
    if(empty($task))
        return array(
            'result' => false,
            'msg' => 'Exec task error'
        );
    
    preg_match("/(\d{1,5})/i", $task, $founded);
    $parentPid = $founded[1];
    if(!validatePid($parentPid))
        return array(
            'result' => false,
            'msg' => 'Parent PID not valid'
        );

    //var_dump($cmd); var_dump($task); var_dump($parentPid); 

    // Wait ~5 sec until child pipe not running, check every second
    for ($i = 1; $i <= 5; $i++) {
        // Get pipe with out wget task (search by $tmpFileName)
        $taskData = getWgetTasksList($tmpFileName);
        // Get last job with current URL
        $taskPid = $taskData[0]['pid'];
        
        if(!validatePid($taskPid)) 
            sleep(1);
        else
            break;
    }
    
    if(!validatePid($taskPid))
        return array(
            'result' => false,
            'msg' => 'Task PID not valid'
        );
    
    return array(
        'result' => true,
        'pid' => (int) $taskPid,
        'msg' => 'Task added success'
    );
}
//echo addWgetTask('http://goo.gl/v7Ujhg'); // Debug call

// IMPORTANT FUNCTION
// Get list of active jobs
function getWgetTasks() {
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

function echoResult($data, $type) {
    $type = (empty($type)) ? 'json' : (string) $type;
    
    switch ($type) {
        case 'json':
            echo(json_encode($data));
            break;
        case 'text':
            var_dump($data);
            break;
    }
    return true;
}


// Result array {status: 0, msg: 'message'}
//   -1 - script started without errors
//    0 - error
//    1 - script finished without errors
$result = array('status' => -1, 'msg' => 'No input data');



// Command line support
if(isset($argv)) {
    if(isset($argv[1]) && !empty($argv[1])) {
        $_GET['action'] = $argv[1];
        if(isset($argv[2]) && !empty($argv[2]))
            if(validatePid($argv[2]))
                $_GET['id'] = $argv[2];
        else
            $_GET['url'] = $argv[2];
    }
}

// AJAX send data in GET, html in POST
if((count($_POST) > 0) and (count($_GET) === 0)) 
    $_GET = $_POST;
else 
    $_POST = $_GET;

if(!empty($_GET['action'])) {
    // Set value from GET array to $formData
    $formData = array(
        'action' => @$_GET['action'],
        'url'    => @$_GET['url'],
        'id'     => @$_GET['id']
    );
    // Make some clear
    foreach ($formData as $key => $value) {
        $formData[$key] = htmlspecialchars($value);
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
            
            if(!empty($result['tasks']))
                $result['msg'] = 'Active tasks list';
            else
                $result['msg'] = 'No active tasks';
                
            $result['status'] = 1;
            break;
        ## Action - Add Task
        ####################
        case 'add_task':
            $url = $formData['url'];
            
            $addTaskResult = addWgetTask($url);
            
            if($addTaskResult['result'] === true) {
                $result['msg']    = $addTaskResult['msg'];
                $result['id']     = (int) $addTaskResult['pid'];
                $result['status'] = 1;
            } else {
                $result['msg']    = $addTaskResult['msg'];
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
        ## Action - Cancel (remove) Task
        ################################
        case 'test':
            // Added after comment in issue <http://goo.gl/I8gYoK>
            if(is_dir(download_path) && is_writable(download_path)) {
                if(function_exists('ini_get') && !ini_get('safe_mode')) {
                    $testVal = (string) 'test'.rand(1024, 32768);
                    $bash = bash('echo "'.$testVal.'"', 'string');
                    if(strpos($bash, $testVal) !== false) {
                        $bash = bash(wget.' -V', 'array');
                        if(strpos(strtolower($bash[0]), 'gnu wget') !== false) {
                            preg_match("/(\d{1,2}\.\d{1,3}\.\d{1,3})/i", $bash[0], $founded);
                            $wgetVersion = $founded[1];
                            if(!empty($wgetVersion)) {
                                $result['msg'] = 'PHP \'safe_mode\' = Off, \'exec()\' enabled, \'wget\' version = \''.$wgetVersion.'\'. All right, cap!';
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
            break;
            
        default:
            $result['msg']    = 'No action';
            $result['status'] = 0;
    }

}

echoResult($result, 'json');