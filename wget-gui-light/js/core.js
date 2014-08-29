/*
## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2014 <samoylovnn@gmail.com>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   Look in 'version.js'

## 3rd party used tools:
##   * jquery           <http://jquery.com/>
##   * notifIt!         <https://dl.dropboxusercontent.com/u/19156616/ficheros/notifIt!-1.1/index.html>
##   * url.js           <http://habrahabr.ru/post/232073/>
##   * jquery.cookie.js <https://github.com/carhartl/jquery-cookie>
##   * bpopup           <http://dinbror.dk/bpopup/>
*/
'use strict';

$(function() {
    var body = $('body').first(),
        head = $('head').first(),
        root = $('#tasklist'),
        favicon = $('#favicon'),
        taskInput = $('#addTaskAddr'),
        taskButton = $('#addTaskBtn'),
        pageTitle = $(document).find('title'),
        titleText = pageTitle.text(),
        timerHandler = null,
        wgetGuiCurrentVersion = (typeof WGET_GUI_LIGHT_VERSION === 'string') ? WGET_GUI_LIGHT_VERSION : false, /* declared in 'version.js' */
        
        /* How many requests can be passed in one time */
        addTasksLimitCount = 5,
        
        /* Update interval (in milliseconds). Interval for checking change data loop */
        updateStatusInterval = 5 * 1000,
        
        /* Debug mode (true|false). Enable console.log output */
        DebugMode = false,
        
        /* Enable checking for newest versions */
        CheckForUpdates = true,
        
        /* Check - installed extension for browser, or not? */
        CheckExtensionInstalled = true,
        
        /* IMPORTANT! Path for AJAX requests */
        prc = 'rpc.php';

    if(DebugMode) updateStatusInterval = 0;
    /* *** DESIGN ******************************************************************** */

    /* Animate progress bar */
    /* http://css-tricks.com/css3-progress-bars/ */
    $("div.meter > span").each(function() {
        $(this)
            .data("origWidth", $(this).width())
            .width(0)
            .animate({
                width: $(this).data("origWidth")
            }, 1200);
    });
    
    /* *** EXT FUNCTIONS ************************************************************* */
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function clearString(str) {
        return str.replace(/<\/?[^>]+(>|$)/g, "");
    }
    
    /* *** TASKS FUNCTIONS *********************************************************** */
    /* *** AJAX data ***************************************************************** */
    
    function getWgetTasksList(callback) {
        if(DebugMode) console.info('getWgetTasksList() called');
        var tasksList = [],
            result = [];
        
        $.getJSON(prc, {'action': 'get_list'})
            .done(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                tasksList = answerJSON.tasks;
                if($.isArray(tasksList) && tasksList.length > 0) {
                    jQuery.each(tasksList, function() {
                         result.push(this);
                    });
                    if ($.isFunction(callback)) callback(result);
                    return result;
                } else {
                    if ($.isFunction(callback)) callback([]);
                    return [];
                }
            })
            .fail(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                notif({type: "error", position: "center", msg: 'Get tasks list &mdash; <strong>'+prc+'</strong> &mdash; '+answerJSON.status+': '+answerJSON.statusText});
                if ($.isFunction(callback)) callback(result);
                return result;
            });
        return result;
    }
    
    function addWgetTask(inputData, callback) {
        if(DebugMode) console.info('addWgetTask() called', inputData);
        $.getJSON(prc, {'action': 'add_task', 'url': inputData.url, 'saveAs': inputData.saveAs})
            .done(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                var result = {
                    'status':   answerJSON.status,
                    'msg':      answerJSON.msg,
                    'id':       answerJSON.id,
                    // Return some input params for call gui-functions in callback
                    'url':      inputData.url,
                    'saveAs':   inputData.saveAs,
                    'pregress': inputData.progress,
                    'isLast':   inputData.isLast
                };
                if ($.isFunction(callback)) callback(result);
                return result;
            })
            .fail(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                notif({type: "error", position: "center", msg: 'Add task &mdash; <strong>'+prc+'</strong> &mdash; '+answerJSON.status+': '+answerJSON.statusText});
                if ($.isFunction(callback)) callback(false);
                return false;
            });
    }
    
    function removeWgetTask(url_or_id, callback) {
        if(DebugMode) console.info('removeWgetTask() called', url_or_id);
        /* check - exists task or not */
        getWgetTasksList(function(tasks){
            var byID = false, byURL = false, ID = -1, URL = '';
            if((typeof url_or_id == 'number') && (url_or_id >= 0)) byID = true;
            if((typeof url_or_id == 'string') && (url_or_id.length >= 11)) byURL = true;
            for(var i = 0; i < tasks.length; ++i) {
                if(byID  && tasks[i].id  == url_or_id) {ID = tasks[i].id}
                if(byURL && tasks[i].url == url_or_id) {ID = tasks[i].url}
            }
            
            if((ID >= 0) || (URL.length >= 11))
                $.getJSON(prc, {'action': 'remove_task', 'url': URL, 'id': ID})
                    .done(function(answerJSON) {
                        if(DebugMode) console.log('AJAX result: ', answerJSON);
                        var result = (answerJSON.status == '1') ? true : false;
                        if ($.isFunction(callback)) callback(result, answerJSON.msg);
                        return result;
                    })
                    .fail(function(answerJSON) {
                        if(DebugMode) console.log('AJAX result: ', answerJSON);
                        notif({type: "error", position: "center", msg: 'Remove task &mdash; <strong>'+prc+'</strong> &mdash; '+answerJSON.status+': '+answerJSON.statusText});
                        if ($.isFunction(callback)) callback(false);
                        return false;
                    });
                else {
                    if ($.isFunction(callback)) callback(false);
                    return false;
                }
        });
        return false;
    }
    
    function testServer() {
        if(DebugMode) console.info('testServer() called');
        $.getJSON(prc, {'action': 'test'})
            .done(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                var msgType = (answerJSON.status == '1') ? "success" : "error";
                notif({type: msgType, multiline: true, autohide: false, position: "center", msg: answerJSON.msg});
                return true;
            })
            .fail(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                notif({type: "error", position: "center", msg: 'Server test &mdash; <strong>'+prc+'</strong> &mdash; '+answerJSON.status+': '+answerJSON.statusText});
                return false;
            });
    }
    
    /* *** TASKS data **************************************************************** */
    
    /* return tasks list from GUI */
    function getTasksList() {
        var tslist = root.find('div.task');
        if(tslist.length > 0) {
            var result = [];
            jQuery.each(tslist, function() {
                 result.push($(this).data('info'));
            });
            return result;
        }
        return null;
    }
    
    /* add task function */
    function addTask(fileUrl, progress) {
        // Make some clear
        fileUrl = clearString(fileUrl);
        
        // Make fast check
        if((typeof fileUrl !== 'string') || (fileUrl == '')) {
            notif({type: "warning", position: "center", msg: "Address cannot be empty"});
            return false;
        }
        
        // Catt 'test' mode
        if(fileUrl === 'test') {
            testServer(); return false;
        }
        
        var urls = fileUrl.split(/\r*\n/),
            brokenUrls = [], validUrls = [];


            
        // Make urls check
        for(var i = 0; i < urls.length; ++i) {
            // Format: "http://someurl.is/here/file.dat -> newfilename.dat"
            var newTaskData = urls[i].split(" -> "),
                isSaveAsUrl = ($.isArray(newTaskData) && 
                              (newTaskData.length > 0) &&
                              (typeof newTaskData[0] == 'string') &&
                              (newTaskData[0].length > 11) &&
                              (typeof newTaskData[1] == 'string') &&
                              (newTaskData[1].length > 0)) ? true : false,
                newTaskUrl  = (isSaveAsUrl) ? newTaskData[0] : urls[i],
                newTaskSaveAs=(isSaveAsUrl) ? newTaskData[1] : '';
                
            if(DebugMode) console.log(isSaveAsUrl, newTaskUrl, newTaskSaveAs);
            
            /* http://stackoverflow.com/a/8317014 */
            if(/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(newTaskUrl)) {
                if ((typeof addTasksLimitCount == 'number') && (addTasksLimitCount > 0) && validUrls.length < addTasksLimitCount)
                    validUrls.push({'url': newTaskUrl, 'saveAs': newTaskSaveAs});
            } else {
                brokenUrls.push(newTaskUrl);
            }
        }
        
        // Actions for valid urls
        for(var i = 0; i < validUrls.length; ++i) {
            var taskData = {
                    'url': validUrls[i].url,
                    'saveAs': validUrls[i].saveAs,
                    'progress': ((typeof progress !== 'number') || (progress < 0) || (progress > 100)) ? 0 : progress,
                    'isLast': (validUrls.length-1 === i) ? true : false
                };
                
            // Timer needed for tasks stack (create task order)
            setTimeout(function(taskData){
                // Call Ajax function
                addWgetTask(taskData, function(result){
                    // If result is 'good'
                    if((result !== false) && (typeof result.status === 'number') && (result.status === 1)) {
                        // and returned 'id' (pid) is correct
                        if((typeof result.id === 'number') && (result.id > 1)) {
                            // Add task to gui
                            addTaskGui({'url': result.url, 'progress': result.progress, 'id': result.id});
                        } else
                            // or only show message
                            notif({type: "warning", multiline: true, time: 10000, position: "center", msg: 'Task "'+result.url+'" return message<br /><br /><b>'+result.msg+'</b>'});
                        // If it is last task in stack - make sync
                        if(result.isLast) syncTasksList();
                    } else {
                        // If returned error with correct message in answer
                        if((result !== false) && (typeof result.url === 'string') && (typeof result.msg === 'string'))
                            notif({type: "error", multiline: true, time: 10000, position: "center", msg: 'Task "'+result.url+'" return message<br /><br /><b>'+result.msg+'</b>'});
                        // If all is bad =)
                        else
                            notif({type: "error", multiline: true, position: "center", msg: 'Download not added, server error'});
                    }
                });
            }, 150 * i, taskData/* <--- pass settings object to timer */);
            
        }
        
        // And for broken
        if(brokenUrls.length)
            notif({type: "warning", multiline: true, position: "center", msg: 'Address \"<b>'+brokenUrls.join("</b>, <b>")+'</b>\" is not valid'});
    }
    
    function removeTask(taskID) {
        removeWgetTask(taskID, function(bool_result, msg){
            if(bool_result) {
                removeTaskGui(taskID);
                syncTasksList();
            } else {
                notif({type: "error", multiline: true, position: "center", msg: '<strong>Download task not removed</strong><br />(ID'+taskID+', "'+msg+'")'});
            }
        });
    }
    
    function syncTasksList() {
        /* Здесь всё таки нужен подробный комментарий. Функция для сихронизации данных полученных от сервера
           и тех, что отображены на gui. Мы получаем список актуальных задач путем вызова 'getWgetTasksList',
           и далее пробегаемся по ним, выискивая какие вхождения есть там и тут. И если такие есть - заносим
           их ID в SyncedTasksIDs и обновляем данные в gui (синхронизируем).
           Попутно записываем при каждом проходе по массиву Tasks - ID в RemoteTasksIDs.
           Далее - получаем ID всех задач, что у нас отображены в gui.
           Далее - получаем РАЗНИЦУ между GuiTasksIDs и RemoteTasksIDs для того, чтоб получить ID задач,
           которые УДАЛЕНЫ, и сохраняем их в RemovedTasksIDs.
           Далее - выполняем аналогичное, но для получения ДОБАВЛЕННЫХ задач, с сохранением ID в AddedTasksIDs.

           Теперь, обладая всеми необходимыми данными для полноценной синхронизации - мы не актуальное - удаляем,
           а добавленное - отображаем. */
        getWgetTasksList(function(Tasks){
            var guiTasks = root.find('div.task'),
                SyncedTasksIDs = [], AddedTasksIDs = [], RemovedTasksIDs = [],
                GuiTasksIDs = [], RemoteTasksIDs = [],
                duplicatesFounded = false;
            
            // Remove duplicated tasks
            jQuery.each(guiTasks, function() {
                if(typeof this !== 'undefined') {
                    var guiTaskData = $(this).data('info');
                    if(typeof guiTaskData !== 'undefined') {
                        var tasks = $('div.task.id'+guiTaskData.id);
                        if(tasks.size() > 1) {
                            duplicatesFounded = true;
                            tasks.not(':first').remove();
                        }
                    }
                }
            });
            if(duplicatesFounded) guiTasks = root.find('div.task'); // Refresh
            
            jQuery.each(Tasks, function() {
                var wgetTask = this;
                jQuery.each(guiTasks, function() {
                    var guiTask = this, guiTaskData = $(guiTask).data('info');
                    // if remote task id == gui task id
                    if((typeof wgetTask !== 'undefined') && (typeof guiTaskData !== 'undefined') && (wgetTask.id == guiTaskData.id)) {
                        // Make data sync
                        setTaskProgress(guiTaskData.id, wgetTask.progress);
                        // +Get SyncedTasksIDs
                        SyncedTasksIDs.push(wgetTask.id);
                    }
                });
                // +Get RemoteTasksIDs
                RemoteTasksIDs.push(wgetTask.id);
            });

            // +Get GuiTasksIDs
            jQuery.each(guiTasks, function() {
                if(typeof this !== 'undefined') {
                    var guiTaskData = $(this).data('info');
                    if(typeof guiTaskData !== 'undefined')
                        GuiTasksIDs.push(guiTaskData.id);
                }
            });
            
            // +Get RemovedTasksIDs <http://stackoverflow.com/a/15385871>
            var RemovedTasksIDs = $(GuiTasksIDs).not(RemoteTasksIDs).get();
            
            // +Get AddedTasksIDs <http://stackoverflow.com/a/15385871>
            var AddedTasksIDs = $(RemoteTasksIDs).not(GuiTasksIDs).get();
            
            
            // Remove tasks from gui
            for(var i = 0; i < RemovedTasksIDs.length; ++i) removeTaskGui(RemovedTasksIDs[i]);
            
            // Add tasks to gui
            for(var i = 0; i < AddedTasksIDs.length; ++i) 
                for(var j = 0; j < Tasks.length; ++j) 
                    if(Tasks[j].id == AddedTasksIDs[i]) 
                        addTaskGui({'url': Tasks[j].url, 'progress': Tasks[j].progress, 'id': Tasks[j].id});
            
            // Set active tasks count in title
            if(RemoteTasksIDs.length > 0)
                pageTitle.text('('+RemoteTasksIDs.length+') '+titleText);
            
            if(DebugMode) console.info("Sync data:\n", 
                'SyncedTasksIDs: '+SyncedTasksIDs+"\n", 
                'RemoteTasksIDs: '+RemoteTasksIDs+"\n", 
                'GuiTasksIDs: '+GuiTasksIDs+"\n", 
                'RemovedTasksIDs: '+RemovedTasksIDs+"\n", 
                'AddedTasksIDs: '+AddedTasksIDs
            );
            
            if((typeof updateStatusInterval === 'number') && updateStatusInterval > 0) {
                window.clearTimeout(timerHandler);
                timerHandler = setTimeout(function(){ return syncTasksList() }, updateStatusInterval);
            }
        });
    }
    
    /* *** TASKS gui ***************************************************************** */
    
    /* Set mode */
    function setMode(mode) {
        if((typeof mode !== 'string') || (mode == ''))
            return false;
            
        switch (mode) {
            case 'bar-only':
                body.removeClass("active-tasks");
                pageTitle.text(titleText);
                favicon.attr("href","img/favicon.png");
                break;
            case 'active-tasks':
                body.addClass("active-tasks");
                favicon.attr("href","img/favicon_active.png");
                break;
        }
        return true;
    }
    
    /* Return task pointer by id (int) */
    function getTaskObj(taskID) {
        return $('.task.id'+taskID);
    }
    
    /* Remove (cancel) task */
    function removeTaskGui(taskID) {
        var taskObj = getTaskObj(taskID);
        taskObj
            .animate({
                height: 0,
                opacity: 0
            }, 300, function() {
                taskObj.remove();
                var TasksList = getTasksList();
                if((TasksList == null) || (TasksList.length <= 0))
                    setMode('bar-only');
            });
    }
    
    /* Set progress bar position */
    function setTaskProgress(taskID, setPosition) {
        if(typeof taskID !== 'number') return;
        if((typeof setPosition !== 'number') || (setPosition < 0) || (setPosition > 100)) return;
        var taskObj = getTaskObj(taskID),
            meter = taskObj.find('div.meter').first(),
            indicator = meter.find('span').first(),
            lastProgress = indicator.data('setWidth');
        if((typeof lastProgress == 'undefined') || (lastProgress < 0) || (lastProgress > 100))
            lastProgress = 0;
        indicator
            .data('setWidth', setPosition)
            .html('<b>'+setPosition+'</b><span></span>')
            .width(lastProgress+'%')
            .animate({
                width: indicator.data('setWidth')+'%'
            }, 500);
    }
    
    function addTaskGui(data) {
        /* data = {'url': 'http://foo.com/bar.dat, 'progress': 50, 'id': 12345} */
        var url       = new URL(data.url), /* parse url */
            urlPath   = (!url.data.path) ? url.url : url.data.path, /* extract path from url */
            filename  = (urlPath.indexOf('/') > 1) ? urlPath.split("/").pop() : urlPath, /* extract filename from path */
            labelFilename = (!url.data.path || 0 === url.data.path.length) ? '' : url.data.path, /* set filename for label */
            labelText = (!filename || 0 === filename.length) ? url.data.host+'/'+labelFilename : filename, /* set text label for task */
            taskID    = data.id, /* set task ID */
            html = '<div class="task id'+taskID+'">'+
                       '<table><tr>'+
                       '<td class="name"><a href="'+url.url+'" title="'+labelText+'" target="_blank">'+labelText+'</a></td>'+
                       '<td class="progress"><div class="meter animate"><span style="width: 0%"><span></span></span></div></td>'+
                       '<td class="actions"><input type="button" class="button cancel red-hover" value="Cancel" /></td>'+
                       '</td></table>'+
                   '</div>';
        root.append(html);
        var taskObj = root.find('div.task').last();
        taskObj
            .css({opacity: 0})
            .data('info', {
                url: url.url,
                id: taskID
            })
            .find('input.cancel').on('click', function(){
                removeTask(taskObj.data('info').id);
            });
        taskObj
            .fadeTo(500, 1);

        setTaskProgress(taskID, data.progress);
        setMode('active-tasks');
    }
    
    // http://stackoverflow.com/a/20009705
    function changeF5event(e) {
        if ((e.which || e.keyCode) == 116 || (e.which || e.keyCode) == 82) {
            syncTasksList();
            notif({msg: "Data updated", position: "center", time: 1000, width: 150, opacity: 0.8});
            e.preventDefault();
        }
    };
    
    // http://stackoverflow.com/a/25359264
    $.urlParam = function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null)
            return null;
        else
            return results[1] || 0;
    }
    
    /* *** EVENTS ******************************************************************** */
    
    /* Disable 'not update window on F5' in debug mode */
    if(!DebugMode)
        $(document).on('keydown', changeF5event);
    
    /* on press 'enter' in url text input */
    taskInput.on('keypress', function(e) {
        taskInput.attr('rows', taskInput.val().split(/\r*\n/).length);

        // [Ctrl] + [Enter] pressed
        if (e.ctrlKey && (e.keyCode == 10 || e.keyCode == 13)) {
            taskInput.val(taskInput.val() + "\n");
            taskInput.trigger('keypress');
            return false;
        }
        // [Enter] pressed
        if (e.keyCode == 10 || e.keyCode == 13) {
            taskInput.trigger('keypress');
            taskButton.click();
            return false;
        }
    }).on('keydown', function(e) {
        // any event on [Backspace] or [Del] not call 'keypress', and
        //   we need call it manually after some time
        if (e.keyCode == 8 || e.keyCode == 46) {
            setTimeout(function(){ taskInput.trigger('keypress'); }, 10);
        }
    }).on('paste', function() {
        // [Paste] text event
        setTimeout(function(){ taskInput.trigger('keypress'); }, 10);
    });
    
    /* on press 'add task' button */
    taskButton.on('click', function(){
        addTask(taskInput.val());
    });
    
    /* #taskExtended functions */
    taskInput
        .on('focus', function() {
            $('#taskExtended .multitask').animate({ opacity: 0.8 }, 200);
        })
        .on('focusout', function() {
            $('#taskExtended .multitask').animate({ opacity: 0 }, 200);
        });
    
    // Enable feature 'Quick download bookmark'
    if(($.urlParam('action') == 'add')){
        var url = $.urlParam('url');
        taskInput.val(url); taskButton.click();
    }
    $("#bookmark")
        .attr("href", "javascript:window.open('"+document.URL+"?action=add&url='+window.location.toString());void 0;")
        .on('click', function(){
            notif({msg: "Move me to your <b>bookmarks bar</b>, don't click here :)", position: "center", time: 5000, opacity: 0.8});
            return false;
        });
    
    /* *** Need Update Notification ************************************************** */
    
    function checkProjectUpdate() {
        // <http://stackoverflow.com/a/14540169>
        // @returns {Integer} 0: v1 == v2, -1: v1 < v2, 1: v1 > v2
        function versionCompare(n,t){var e,r,i,l=(""+n).split("."),a=(""+t).split("."),h=Math.min(l.length,a.length);
        for(i=0;h>i;i++)if(e=parseInt(l[i],10),r=parseInt(a[i],10),isNaN(e)&&(e=l[i]),isNaN(r)&&(r=a[i]),e!=r)return e>r?1:r>e?-1:0/0;
        return l.length===a.length?0:l.length<a.length?-1:1}
        
        var CheckNewVersionNow = true;
        if(typeof $.cookie !== 'undefined') {
            // Disable update check for a day (CHECK cookie value)
            CheckNewVersionNow = ($.cookie('DoNotCheckUpdate') == 'true') ? false : true;
        }
        if(CheckNewVersionNow) {
            // <http://rawgit.com/>
            try { // TODO: Comment while testing
                $.getScript('https://rawgit.com/tarampampam/wget-gui-light/master/lastversion.js', function(){
                    // Check returned value in script. and local (declared in 'version.js')
                    if((typeof web_wgetguilight !== 'undefined') && (typeof web_wgetguilight.version === 'string') &&
                       (web_wgetguilight.version !== '') && (typeof wgetGuiCurrentVersion === 'string') &&
                       wgetGuiCurrentVersion.length > 3) {
                        // Compare local and web versions
                        // If web version is newest then local
                        if(versionCompare(wgetGuiCurrentVersion, web_wgetguilight.version) < 0) {
                            var webVer = web_wgetguilight;
                            $('#footer').append('<a id="updateAvailable" href="'+webVer.download.page+'" title="'+webVer.lastUpdate.shortDesc+'" target="_blank"style="white-space:nowrap;text-overflow:clip;overflow:hidden">Update available</a>');//
                            var updateLink = $('#updateAvailable'), 
                                updateLinkOrigWidth = updateLink.width();
                            // Animate showing notification link
                            updateLink.css({width: 0}).animate({width: updateLinkOrigWidth}, 1000);
                            // Load popup script <http://dinbror.dk/bpopup/>
                            $.getScript('js/jquery.bpopup/jquery.bpopup.min.js', function(){
                                // Load css
                                $('<link>')
                                    .appendTo(head)
                                    .attr({type : 'text/css', rel : 'stylesheet'})
                                    .attr('href', 'js/jquery.bpopup/jquery.bpopup.css?rnd='+getRandomInt(0,2047)); // disable caching
                                // Create popup container details
                                body.append('<div id="updateDetails" style="display:none">'+
                                                '<span class="button popupClose">'+
                                                    '<span>X</span>'+
                                                '</span>'+
                                                '<h2 class="name">'+webVer.name+'</h2>'+
                                                '<h3 class="curentver">Current version: '+wgetGuiCurrentVersion+'</h3>'+
                                                '<h3 class="availablever">Available version: <strong>'+webVer.version+'</strong></h3>'+
                                                '<p class="desc">'+webVer.lastUpdate.shortDesc+' // <a href="'+webVer.lastUpdate.fullDescUrl+'" target="_blank">Full text</a></p>'+
                                                '<div class="links">'+
                                                    '<a class="page" href="'+webVer.download.page+'" target="_blank"><img alt="Page" src="http://oi58.tinypic.com/2jbv9c7.jpg" width="64" height="64" /><br />Info page</a>'+
                                                    '<a class="dl" href="'+webVer.download.file+'"><img alt="Download" src="http://oi62.tinypic.com/2zi36on.jpg" width="64" height="64" /><br />Package</a>'+
                                                    '<div class="clear"></a>'+
                                                '</div>'+
                                                '<p class="disable">'+
                                                    '<a href="#" id="disableUpdateCheck">Disable updates checking</a>'+
                                                    '<span>Setting will stored in cookies</span>'+
                                                '</p>'+
                                            '</div>');
                                // Attach event to notification link
                                updateLink.on('click', function(){
                                    // Show popup
                                    $('#updateDetails').bPopup({
                                        modalColor: '#666',
                                        opacity: 0.3,
                                        closeClass: 'popupClose',
                                        position: ['auto', 'auto'],
                                        transition: 'fadeIn'
                                    });
                                    return false;
                                });
                                // Attach event to 'disable update check' link
                                $('#disableUpdateCheck').on('click', function(){
                                    // Disable update check for a N days (SET cookie value)
                                    if(typeof $.cookie !== 'undefined') {
                                        $.cookie('DoNotCheckUpdate', 'true', {expires : 93});
                                        notif({type: "warning", msg: "Disabled", position: "center", time: 1000, width: 150, opacity: 0.8});
                                    }
                                    return false;
                                });
                            });
                        } else {
                            if(DebugMode) console.log('Update not available');
                        }
                    }
                });
            } catch(e) {console.log('Error on checking update : ' + e)}// TODO: Comment while testing
            
        }
    }
    
    /* *** Browser extension ********************************************************* */
    
    function chromeCheckExtensionInstalled(callback) {
        body.append('<img alt="" id="extensionImg" style="display:none" />');
        var extensionImg = $('#extensionImg');
        extensionImg
            .one('load',  function(){if($.isFunction(callback))callback(true);  extensionImg.remove()})
            .one('error', function(){if($.isFunction(callback))callback(false); extensionImg.remove()})
            .attr('src', 'chrome-extension://dbcjcjjjijkgihaddcmppppjohbpcail/img/icon.png');
    }
    
    if(CheckExtensionInstalled) {
        body.append('<div id="browserExtension" class="hidden">Browser Extension</div>');
        
        var addExtension = $('#browserExtension'),
            isBrowser = (/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) ? 'chrome' : '';
            
        if(isBrowser === 'chrome') {
            chromeCheckExtensionInstalled(function(installed){
                if(installed) {
                    addExtension.remove();
                } else {
                    addExtension
                        .css({ opacity: '0', display: 'block' })
                        .addClass('chrome')
                        .on('click', function(){
                            window.open('https://chrome.google.com/webstore/detail/dbcjcjjjijkgihaddcmppppjohbpcail');
                            return false;
                        })
                        .animate({ opacity: 0.3 }, 500);
                }
            });
        }
    }
    
    /* *** Here we go! :) ************************************************************ */
    
    syncTasksList(); // Run timer
    taskInput.focus(); // Set focus to input
    if(CheckForUpdates) checkProjectUpdate(); // Check new version, if this function is enabled
});