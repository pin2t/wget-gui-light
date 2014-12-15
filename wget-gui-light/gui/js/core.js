/*
## @author    Samoylov Nikolay
## @project   Wget GUI Light
## @copyright 2014 <samoylovnn {d0g} gmail {d0t} com>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   Look in 'settings.php'

## 3rd party used tools:
##   * jquery           <https://github.com/jquery/jquery>
##   * jquery.owl       <http://codecanyon.net/item/owl-unobtrusive-css3-notifications/408575>
##   * url.js           <https://github.com/websanova/js-url>
##   * jquery.cookie.js <https://github.com/carhartl/jquery-cookie>
##   * bpopup           <http://dinbror.dk/bpopup/>
*/
'use strict';

$(function() {
    var head = $('head').first(), body = $('body').first(),
        favicon = $('#favicon'),
        pageTitle = $(document).find('title'),
        
        menu = $('#menu'),
        menuButton = $('#menu-button'),
        
        taskList = $('#tasklist'),
        taskInput = $('#addTaskAddr'),
        taskButton = $('#addTaskBtn'),
        
        titleText = pageTitle.text(),
        timerHandler = null;
        // WGET_GUI_LIGHT_VERSION // declared in 'settings.php'
        

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
    
    if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        taskInput.height(20); // Fix Firefox auto-height bug
    }
    
    // Show notification function
    //   Example call is: showNoty({type: 'error', title: 'Title', msg: 'Message'});
    function showNoty(settings) {
        var nTitle = ((typeof settings.title !== 'undefined') && (typeof settings.title === 'string')) ? settings.title : '',
            nContent = ((typeof settings.msg !== 'undefined') && (typeof settings.msg === 'string')) ? settings.msg : '',
            nTimeout = ((typeof settings.timeout !== 'undefined') && (typeof settings.timeout === 'number')) ? settings.timeout : 10000,
            nShowTime = ((typeof settings.showTime !== 'undefined') && settings.showTime) ? true : false,
            nIcon = '',
            nError = false;
            
        switch (settings.type) {
            case 'success': nIcon = 'W'; break;
            case 'error': nIcon = 'X'; nError = true; nShowTime = true; break;
            case 'warning': nIcon = 'c'; break;
            case 'info': nIcon = '_'; break;
            default: nIcon = '`';
        }
        
        $.notification({
            title: nTitle,
            content: nContent,
            timeout: nTimeout,
            error: nError,
            showTime: nShowTime,
            fill: true,
            icon: nIcon,
            border: true
        });    
    }
    
    /* *** EXT FUNCTIONS ************************************************************* */
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function clearString(str) {
        return str.replace(/<\/?[^>]+(>|$)/g, "");
    }
    
    function getLabelTextFromUrl(inputUrl) {
        // use code from url(.min).js
        var domain = $.url('domain', inputUrl),
            path = $.url('path', inputUrl),
            file = $.url('file', inputUrl),
            
            labelText = '',
            labelText = (domain || domain.length !== 0) ? domain : labelText,
            labelText = (path || path.length !== 0) ? path : labelText,
            labelText = (file || file.length !== 0) ? file : labelText,
            labelText = (labelText == '') ? inputUrl : labelText;
        //console.log(domain, path, file);
        return labelText;
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
                showNoty({
                    type: 'error',
                    title: 'Get tasks list',
                    msg: answerJSON.status+': '+answerJSON.statusText
                });
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
                showNoty({
                    type: 'error',
                    title: 'Add task',
                    msg: answerJSON.status+': '+answerJSON.statusText
                });
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
                        showNoty({
                            type: 'error',
                            title: 'Remove task',
                            msg: answerJSON.status+': '+answerJSON.statusText
                        });
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
    
    function getHistoryList(callback) {
        if(DebugMode) console.info('getHistoryList() called');
        var historyList = [],
            result = [];
        
        $.getJSON(prc, {'action': 'get_history'})
            .done(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                if($.isArray(answerJSON.history) && (answerJSON.history.length > 0) && (answerJSON.status == '1')) {
                    jQuery.each(answerJSON.history, function() {
                        if((typeof this.url !== 'undefined') && (typeof this.success !== 'undefined'))
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
                showNoty({
                    type: 'error',
                    title: 'Get history list',
                    msg: answerJSON.status+': '+answerJSON.statusText
                });
                if ($.isFunction(callback)) callback(result);
                return result;
            });
        return result;
    }
    
    function testServer() {
        if(DebugMode) console.info('testServer() called');
        $.getJSON(prc, {'action': 'test'})
            .done(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                var msgType = (answerJSON.status == '1') ? "success" : "error";
                showNoty({
                    type: msgType,
                    title: 'Server test result',
                    msg: answerJSON.msg,
                    timeout: 0
                });
                return true;
            })
            .fail(function(answerJSON) {
                if(DebugMode) console.log('AJAX result: ', answerJSON);
                showNoty({
                    type: 'error',
                    title: 'Server test',
                    msg: answerJSON.status+': '+answerJSON.statusText
                });
                return false;
            });
    }
    
    /* *** TASKS data **************************************************************** */
    
    /* return tasks list from GUI */
    function getTasksList() {
        var tslist = taskList.find('div.task');
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
        // Add VK external video code support
        if(/\<iframe\s.*src=\"http.?\:\/\/.*vk\.com\/video_ext\.php\?.*\".*\>/i.test(fileUrl)) {
            var vkVideoUrlParts = fileUrl.match(/\<iframe\s.*src=\"(.*?)\"/i),
                fileUrl = vkVideoUrlParts[1].replace("https", "http");
            taskInput.val(fileUrl);
        }

        // Make some clear
        fileUrl = clearString(fileUrl);
        
        // Make fast check
        if((typeof fileUrl !== 'string') || (fileUrl == '')) {
            showNoty({
                type: 'warning',
                title: 'Check url',
                msg: 'Address cannot be empty',
            });
            return false;
        }
        
        // Notify is passed link - is not supported video link
        if(/http.?\:\/\/.*vk\.com\/video\d{1,11}_\d{1,15}$/i.test(fileUrl)) {
            showNoty({
                type: 'warning',
                title: 'This link format not supported, use this:',
                msg: "<br />https://vk.com/<b>video_ext.php</b>?oid=1&id=164841344&hash=c8de45fc73389353",
                timeout: 20000
            });
            return false;
        }
        
        // Call 'test' mode
        if(fileUrl === 'test') {
            testServer(); return false;
        }
        
        // If 'fileUrl' without '(http|https|ftp)://' at the begin - we add 'http://'
        var fileUrl = (fileUrl.substring(3, 8).indexOf('://') == -1) ? 'http://'+fileUrl : fileUrl,
            urls = fileUrl.split(/\r*\n/),
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
                            addTaskGui({'url': result.url, 'progress': result.progress, 'id': result.id, 'name': result.saveAs});
                        } else
                            // or only show message
                            showNoty({
                                type: 'warning',
                                title: 'Task "'+result.url+'" return message',
                                msg: '<b>'+result.msg+'</b>',
                                timeout: 20000
                            });
                        // If it is last task in stack - make sync
                        if(result.isLast) syncTasksList();
                    } else {
                        // If returned error with correct message in answer
                        if((result !== false) && (typeof result.url === 'string') && (typeof result.msg === 'string'))
                            showNoty({
                                type: 'error',
                                title: 'Task "'+result.url+'" return message',
                                msg: '<b>'+result.msg+'</b>',
                                timeout: 20000
                            });
                        // If all is bad =)
                        else
                            showNoty({
                                type: 'error',
                                title: 'Download not added',
                                msg: 'Server error',
                                timeout: 20000
                            });
                    }
                });
            }, 150 * i, taskData/* <--- pass settings object to timer */);
            
        }
        
        // And for broken
        if(brokenUrls.length)
            showNoty({
                type: 'warning',
                title: 'Invalid Address',
                msg: 'Address "<b>'+brokenUrls.join("</b>, <b>")+'</b>" is not valid'
            });
    }
    
    function removeTask(taskID) {
        removeWgetTask(taskID, function(bool_result, msg){
            if(bool_result) {
                removeTaskGui(taskID);
                syncTasksList();
            } else {
                showNoty({
                    type: 'error',
                    title: 'Download task not removed',
                    msg: '(ID'+taskID+', "'+msg+'")',
                    timeout: 0
                });
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
            var guiTasks = taskList.find('div.task'),
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
            if(duplicatesFounded) guiTasks = taskList.find('div.task'); // Refresh
            
            jQuery.each(Tasks, function() {
                var wgetTask = this;
                jQuery.each(guiTasks, function() {
                    var guiTask = this, guiTaskData = $(guiTask).data('info');
                    // if remote task id == gui task id
                    if((typeof wgetTask !== 'undefined') && (typeof guiTaskData !== 'undefined') && (wgetTask.id == guiTaskData.id)) {
                        // Make data sync
                        setTaskProgress(guiTaskData.id, wgetTask.progress);
                        setTaskLabelText(guiTaskData.id, wgetTask.saveAs);
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
                        addTaskGui({'url': Tasks[j].url, 'progress': Tasks[j].progress, 'id': Tasks[j].id, 'name': Tasks[j].saveAs});
            
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
            
            // Init history list
            getHistoryList(function(list){
                var historyDiv = $('#historyList');
                
                if(list.length > 0) {
                    var historyList = historyDiv.find('ul').first(),
                        firstShow = (historyList.find('li').length == 0) ? true : false;
                        
                    if(firstShow) historyDiv.css({ opacity: 0 });
                    
                    historyDiv.show().css({ display: 'block' });
                    historyList.empty();
                    for(var i = 0; i < list.length; ++i) {
                        var cssClass  = (list[i].success === true) ? 'ok' : 'err';
                        var hrefTitle = (list[i].success === true) ? list[i].url : 'Task completed with error';
                        var hrefText  = ((typeof list[i].savedAs === 'string') && (list[i].savedAs.length > 0)) ? list[i].savedAs : getLabelTextFromUrl(list[i].url);
                        historyList.append('<li><a href="'+list[i].url+'" title="'+hrefTitle+'" class="'+cssClass+'" target="_blank">'+hrefText+'</li>');
                    }
                    if(firstShow) historyDiv.animate({ opacity: 1 });
                } else {
                    historyDiv.fadeOut();
                }
            });
            
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
                favicon.attr("href","gui/img/favicon.png");
                break;
            case 'active-tasks':
                body.addClass("active-tasks");
                favicon.attr("href","gui/img/favicon_active.png");
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
    
    /* Set task label text */
    function setTaskLabelText(taskID, labelText) {
        if(typeof taskID !== 'number') return;
        if((typeof labelText !== 'string') || (labelText.length == 0)) return;
        
        getTaskObj(taskID).find('td.name').first().find('a').first()
            .text(labelText)
            .attr('title', labelText);
    }
    
    function addTaskGui(data) {
        /* data = {'url': 'http://foo.com/bar.dat, 'progress': 50, 'id': 12345, 'name': 'somename'} */
        if(DebugMode) console.log('addTaskGui() data: ', data);
        var url = data.url,
            saveas = data.saveas,
            labelText = ((typeof data.name === 'string') && (data.name.length !== 0)) ? data.name : getLabelTextFromUrl(url),
            taskID = data.id, /* set task ID */
            html = '<div class="task id'+taskID+'">'+
                       '<table><tr>'+
                       '<td class="name"><a href="'+url+'" title="'+labelText+'" target="_blank">'+labelText+'</a></td>'+
                       '<td class="progress"><div class="meter animate"><span style="width: 0%"><span></span></span></div></td>'+
                       '<td class="actions"><input type="button" class="button cancel red-hover" value="Cancel" /></td>'+
                       '</td></table>'+
                   '</div>';
                   
        taskList.append(html);
        var taskObj = taskList.find('div.task.id'+taskID).last();
        taskObj
            .css({opacity: 0})
            .data('info', {
                url: url,
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
            showNoty({
                type: 'info',
                title: 'Data updated',
                showTime: true,
                timeout: 2000
            });
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
    
    // Enable menu events
    menuButton
        .on('click', function() {
            if(!menu.hasClass('open')) {
                menu.removeClass('close').addClass('open');
                menuButton.removeClass('close').addClass('open');
            } else {
                menu.removeClass('open').addClass('close');
                menuButton.removeClass('open').addClass('close');
            }
            return false;
        });
    
    // Print version to any gui element with class 'projectCurrentVersion'
    $('.projectCurrentVersion').text(WGET_GUI_LIGHT_VERSION);
    
    // Enable feature 'Quick download bookmark'
    if(($.urlParam('action') == 'add')){
        var url = $.urlParam('url');
        taskInput.val(url); taskButton.click();
    }
    $("#bookmark")
        .attr("href", "javascript:window.open('"+document.URL+"?action=add&url='+window.location.toString());void 0;")
        .on('click', function(){
            showNoty({
                type: 'info',
                title: 'Bookmark',
                msg: 'Move me to your <b>bookmarks bar</b>, don\'t click here :)',
                timeout: 5000
            });
            return false;
        });
    
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
        var isBrowser = (/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) ? 'chrome' : '';
            
        if(isBrowser === 'chrome') {
            chromeCheckExtensionInstalled(function(installed){
                if(!installed) {
                    menu.find('ul').first().append('<li><a href="#" id="browserExtension" style="display:none;">Install Google Chrome Extension</a></li>');
                    var addExtension = $('#browserExtension');
                    
                    addExtension
                        .show()
                        .addClass('chrome')
                        .on('click', function(){
                            window.open('https://chrome.google.com/webstore/detail/dbcjcjjjijkgihaddcmppppjohbpcail');
                            return false;
                        });
                }
            });
        }
    }
    
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
                    // Check returned value in script. and local (declared in 'settings.php')
                    if((typeof web_wgetguilight !== 'undefined') && (typeof web_wgetguilight.version === 'string') &&
                       (web_wgetguilight.version !== '')) {
                        // Compare local and web versions
                        // If web version is newest then local
                        if(versionCompare(WGET_GUI_LIGHT_VERSION, web_wgetguilight.version) < 0) {
                            var webVer = web_wgetguilight;
                            menu.find('.bottom').last().append('<br /><a id="updateAvailable" href="'+webVer.download.page+'" title="'+webVer.lastUpdate.shortDesc+'" target="_blank" style="white-space:nowrap; text-overflow:clip; overflow:hidden; font-size:80%; font-family:Tahoma,Verdana,Arial; opacity:1;">Update available</a>');//
                            var updateLink = $('#updateAvailable'), 
                                updateLinkOrigWidth = updateLink.width();
                            // Animate showing notification link
                            updateLink.css({width: 0}).animate({width: updateLinkOrigWidth}, 1000);
                            // Load popup script <http://dinbror.dk/bpopup/>
                            $.getScript('gui/js/jquery.bpopup/jquery.bpopup.min.js', function(){
                                // Load css
                                $('<link>')
                                    .attr({type : 'text/css', rel : 'stylesheet'})
                                    .attr('href', 'gui/js/jquery.bpopup/jquery.bpopup.css?rnd='+getRandomInt(0,2047)) // disable caching
                                    .appendTo(head);
                                // Create popup container details
                                body.append('<div id="updateDetails" style="display:none">'+
                                                '<span class="button popupClose">'+
                                                    '<span>X</span>'+
                                                '</span>'+
                                                '<h2 class="name">'+webVer.name+'</h2>'+
                                                '<h3 class="curentver">Current version: '+WGET_GUI_LIGHT_VERSION+'</h3>'+
                                                '<h3 class="availablever">Available version: <strong>'+webVer.version+'</strong></h3>'+
                                                '<p class="desc">'+webVer.lastUpdate.shortDesc+' // <a href="'+webVer.lastUpdate.fullDescUrl+'" target="_blank">Full text</a></p>'+
                                                '<div class="links">'+
                                                    '<a class="page" href="'+webVer.download.page+'" target="_blank"><img alt="Page" src="gui/img/dl-watch-detalies.svg" width="64" height="64" /><br />Info page</a>'+
                                                    '<a class="dl" href="'+webVer.download.file+'"><img alt="Download" src="gui/img/dl-package.svg" width="64" height="64" /><br />Package</a>'+
                                                    '<div class="clear"></a>'+
                                                '</div>'+
                                                '<p class="disable">'+
                                                    '<a href="#" id="disableUpdateCheck">Disable updates checking</a>'+
                                                    '<span>This setting will stored in cookies</span>'+
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
                                        showNoty({
                                            type: 'warning',
                                            title: 'Check Update',
                                            msg: 'Disabled',
                                            timeout: 3000
                                        });
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
    
    /* *** Here we go! :) ************************************************************ */
    
    syncTasksList(); // Run timer
    taskInput.focus(); // Set focus to input
    if(CheckForUpdates) checkProjectUpdate(); // Check new version, if this function is enabled
});
