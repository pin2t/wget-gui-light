/*
## @author    github.com/tarampampam
## @project   Wget GUI Light
## @copyright 2014 <github.com/tarampampam>
## @license   MIT <http://opensource.org/licenses/MIT>
## @github    https://github.com/tarampampam/wget-gui-light
## @version   Look in 'settings.php'

## 3rd party used tools:
##   * jquery           <https://github.com/jquery/jquery>
##   * jquery.owl       <http://codecanyon.net/item/owl-unobtrusive-css3-notifications/408575>
##   * url.js           <https://github.com/websanova/js-url>
##   * jquery.cookie.js <https://github.com/carhartl/jquery-cookie>
##   * bpopup           <http://dinbror.dk/bpopup/>

ONLINE PACKER: http://javascript-minifier.com/
*/

$(function() {
  "use strict";

  /*
    Global document objects links
    -----------------------------
  */
  var $head = $('head').first(),
      $body = $('body').first(),
      $favicon = $('#favicon'),
      $pageTitle = $(document).find('title').first(),

      $menu = $('#menu'),
      $menuButton = $('#menu-button'),

      $taskList = $('#tasklist'),
      $downloadedFilesList = $('#downloadedFilesList'),
      $addTaskAddr = $('#addTaskAddr'),
      $addTaskBtn = $('#addTaskBtn');

  /*
    Localization functions
    ----------------------
  */
  var _LANG = (window.navigator.userLanguage || window.navigator.language).substring(0, 2).toLowerCase() || 'en',
      // Get language var, stored in "l10n"
      __ = function(val, def){
        def = (typeof def == 'string') ? def : '';
        return ((typeof val == 'string') && (val !== '') &&
                (typeof l10n == 'object') && (l10n.hasOwnProperty(_LANG)) &&
                (typeof l10n[_LANG].hasOwnProperty(val)) &&
                (typeof l10n[_LANG][val] == 'string')) ? l10n[_LANG][val] : def;
      };

  // Localize interface
  $pageTitle.text(__('download_file', 'Download file'));
  $('#urlbar > div.title').text(__('download_file', 'Download file')+':');
  $addTaskBtn.val(__('add_task', 'Add Task'));
  $('#historyList > h2').text(__('recent_tasks', 'Recent tasks')+':');
  $('#taskExtended > .multitask').html(__('press', 'Press')+' <span class="b">Ctrl'+
    '</span> + <span class="b">Enter</span> '+__('add_more_task', 'if you want add'+
    ' more than one task'));
  $menuButton.find('span').text(__('close', 'Сlose'));
  $('#bookmark').text(__('bookmark_download', 'Bookmark "Download"'));
  $downloadedFilesList.find('h2').text(__('downloaded_files', 'Downloaded files')+':');

  /*
    Global variables
    ----------------
  */
  var titleText = $pageTitle.text(),
      timerHandler = null;

  /*
    Additional helpers functions
    ----------------------------
  */
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

  /*
    Design interface functions
    --------------------------
  */
  // Animate progress bar <http://css-tricks.com/css3-progress-bars/>
  $("div.meter > span").each(function() {
    $(this).data("origWidth", $(this).width()).width(0).animate({
      width: $(this).data("origWidth")
    }, 1200);
  });

  // Fix Firefox auto-height bug
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    $addTaskAddr.height(17);
  }

  $.urlParam = function(name){ // Source from: <http://stackoverflow.com/a/25359264>
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return (results == null) ? null : (results[1] || 0) ;
  }

  // Show notification function (ex.: showNoty({type: 'error', title: 'Title', msg: 'Message'}); )
  var showNoty = function(settings) {
        var Title    = (settings.hasOwnProperty('title')    && (typeof settings.title == 'string')) ? settings.title : '',
            Content  = (settings.hasOwnProperty('msg')      && (typeof settings.msg == 'string')) ? settings.msg : '',
            Timeout  = (settings.hasOwnProperty('timeout')  && (typeof settings.timeout == 'number')) ? settings.timeout : 10000,
            ShowTime = (settings.hasOwnProperty('showTime') && settings.showTime) ? true : false,
            Icon = '', Error = false;
        switch (settings.type) {
          case 'success': Icon = 'W'; break;
          case 'error':   Icon = 'X'; Error = true; ShowTime = true; break;
          case 'warning': Icon = 'c'; break;
          case 'info':    Icon = '_'; break;
          default: Icon = '`';
        }
        try {
          $.notification({
            title: Title, content: Content, timeout: Timeout, error: Error, showTime: ShowTime,
            fill: true, icon: Icon, border: true
          });
        } catch(err) {
          var msgOut = (Title) ? Title + ":\n\n" + Content : Content;
          window.alert(msgOut);
        }
      },

      // Set window mode mode
      setMode = function(mode) {
        if((typeof mode !== 'string') || (mode == '')) return false;
        // Image source: <https://goo.gl/nNBR8o>
        var favicon_base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAP1BMVEUAAACmp'+
        'qampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqaGmbX'+
        'uAAAAFHRSTlMA8rsLyjqaX+bUfWwkiEUa3VIvp4UlZY8AAADbSURBVHgB7dTLcoMwDIXhI1+wSbCdkvP+z'+
        '1o67YwxlSDrNt8mm/yIAWH8NW91CpJdWfCaGPhj8njBnV1ecarFuiQOGmwp8LcZJkdVgiFQY4+YaPHQLDT'+
        'FiwHiNg92FZr+D3d8Fws0MgY3dk4rPmgHZLSXRw/Y9MvbgcPeykHApnAU9QfEWUS+J4jIzO5p3FCB9x6br'+
        '59k7MfT2LTIHUE3c+/eB1sBqRWVZpC1onIUzr6bBEQeTOhuPIoLj1Z0ntee2Eu8kj0GheceTT+6dPrx10r'+
        'IoslhWvHvvH0C8n83eCJ4l+gAAAAASUVORK5CYII=',
        // Image source: <https://goo.gl/EptkZF>
            favicon_active_base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAyVBMVE'+
        'UAAACOwwCMwABbfABynABhhgCOwwCGtwBcfQCMvwBbfACIuwBLZgCPxACPxABLZgBqkQB3owBkiACPxAD/'+
        '//93owD5+/NjhgBrkgCGuADb57x+rQD8/fj0+Ofp8dTo88q60X6Yuj5+qA32+u7v9d3j7cuxy22qxl602F'+
        'STtjShzih8pgjf77fT6JvK25vB1oe722Sgv0yo0TiKsCPX5LTB3nKt1ESbyhyErBiWyA/e6cHR4KnZ66jO'+
        '3qTP5pLM5I3J44WbxCyTwBsBxjPjAAAAE3RSTlMAwv7N/vXw4tTKd29eXRMT5+XWbCEfLgAAAYVJREFUSM'+
        'fF1GlTgzAQgOFt69lTzS5KBSr0vrV3vfX//yjTDtNNuIZ88v2afQaSCYCsVrgQOboo1OBQvSByV6hLcC0M'+
        'ugaoCKMqcGkGLqFoBoogDPtPsJm2LHfyPcoJFi0Mm+7zgGfk3J9ssF1sRod5zvnNAIMWxvPsVDDBxPp2Cm'+
        'hhch7ZiWCKaQVSxMEIUxuSFDHweVpvN2UdBfgkRQzwxIpkPQUsKRQaaJ/WmyR7UkAzFBoYODHAOcNQQPzy'+
        'MNDE7ihOYIAcA7VXOgpIPNEuyeao5x8F8AGFeW3LWh2fYFmWp4APBtoLzSkIxiQbBwH1kfMU8K7dNDrlO8'+
        'i1FeChWo/CXlDNUoCDEcHznKsAFyOC57kuA/5ulH34GGmmgDVG85fxK66APcZyMNIbMeDfSnruWAPiC7Pr'+
        '7EgHYu1gRrMxMQjbzruulZTbncn9MuAeKTMGLMwAi2xgKMA2E2dwK4zEDZSLRqIMcCcMxBUANEp2XnF21Y'+
        'BD1dL5g9Z9YuelKgD8AfhiulLtTo7nAAAAAElFTkSuQmCC';
        switch (mode) {
          case 'bar_only':
              $body.removeClass('active-tasks');
              $pageTitle.text(titleText);
              $favicon.attr('href', 'data:image/png;base64,'+favicon_base64);
              return true;
            break;
          case 'disabled':
              setMode('bar_only');
              $body.find('*').attr('disabled', true);//.click(function(e){e.preventDefault();});
              return true;
            break;
          case 'active_tasks':
              $body.addClass('active-tasks');
              $favicon.attr('href', 'data:image/png;base64,'+favicon_active_base64);
              return true;
            break;
        }
        return false;
      },

      // Get Font-Awesome icon by file name
      getFAiconByFileName = function(filename) {
        if((typeof filename !== 'undefined') && (filename !== '')) {
          // http://fortawesome.github.io/Font-Awesome/icons/
          var extension = filename.substr(filename.lastIndexOf('.') + 1);
          if(/xml|xmlx/i.test(extension)) return 'fa-file-excel-o';
          if(/doc|docx|rtf/i.test(extension)) return 'fa-file-word-o';
          if(/txt|ini|inf|info|tex|md/i.test(extension)) return 'fa-file-text-o';
          if(/pdf/i.test(extension)) return 'fa-file-pdf-o';
          if(/3gp|act|aiff|aac|amr|au|awb|dct|dss|dvf|flac|gsm|iklax|ivs|m4a|m4p|mmf|mp3|mpc|msv|ogg|oga|opus|ra|rm|raw|sln|tta|vox|wav|wma|wv|webm/i.test(extension)) return 'fa-file-audio-o';
          if(/webm|mkv|flv|vob|ogv|ogg|drc|mng|avi|mov|qt|wmv|yuv|rm|rmvb|asf|mp4|m4p|m4v|mpg|mp2|mpeg|mpe|mpv|m2v|svi|3gp|3g2|mxf|roq|nsv/i.test(extension)) return 'fa-file-video-o';
          if(/ecc|par|par2|zip|zipx|zoo|zpaq|zz|uca|uha|war|wim|xar|xp3|yz1|sit|sitx|sqx|targz|tgz|tarz|tarbz2|tbz2|tarlzma|tlz|uc|uc0|uc2|ucn|ur2|ue2|ace|afa|alz|apk|arc|arj|b1|ba|bh|cab|cfs|cpt|dar|dd|dgc|dmg|ear|gca|ha|hki|ice|jar|kgb|lzh|lha|lzx|pak|partimg|paq6|paq7|paq8|and|variants|pea|pim|pit|qda|rar|rk|sda|sea|sen|sfx|7z|s7z|xz|z|z|infl|rz|sfark|lz|lzma|lzo|bz2|f|gz|a|ar|cpio|shar|iso|lbr|mar|tar/i.test(extension)) return 'fa-file-archive-o';
          if(/jpeg|jpg|jfif|exif|tiff|rif|gif|bmp|png|ppm|pgm|pbm|pnm|webp|hdr|bpg|cd5|deep|ecw|fits|ilbm|ilbm|img|nrrd|pam|pcx|pgf|plbm|sgi|sid|tga|cpt|psd|psp|xcf|cgm|svg|ai|cdr|gem|hpgl|hvif|mathml|naplps|odg|!draw|vml|wmf|emf|xar|xps|eps|pict|swf|xaml/i.test(extension)) return 'fa-file-image-o';
          if(/json|jsp|htm|html|xml|cfm|pl|cod|asm|cs|js|fs|ss|axd|pdb|dvb|bat|cmd|v4e|isa|xla|spr|aia|cgi|java|ipb|atp|idb|vbp|c|phtml|rc|lua|xsd|csb|wbf|cpp|sh|vip|resx|vlx|action|xlm|cmd|au3|as|php5|php4|php3|php2|php|textile|vbs|cxx|csx|vbe|scpt|jsc|pm|dbp|h|csc|pas|tpl|vcproj|vdproj|vbproj|csproj|perl|vba|inc|xsl|cc|asc|less|htc|obj|xul|cp|rc2|vb|bash|hh|css/i.test(extension)) return 'fa-file-code-o';
        }
        return 'fa-file-o';
      },

      // Convert bytes to human-like view
      bytesToSize = function(bytes) { // Source from: <http://stackoverflow.com/a/18650828/2252921>
        var sizes = [__('bytes', 'Bytes'), __('kb', 'KB'), __('mb', 'MB'), __('gb', 'GB'), __('tb', 'TB')];
        if (bytes == 0) return '0 ' + __('bytes', 'Byte');
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
      };

  /*
    +---------------------------------------+----------------+
    | Get (send) data from (to) server side | Ajax functions |
    +---------------------------------------+----------------+
  */
  var getWgetTasksList = function(callback) {
        var tasksList = [], result = [];
        $.getJSON(rpc, {'action': 'get_list'})
          .done(function(JSON) {
            if(DEBUG_MODE) console.log('getWgetTasksList() result: ', JSON);
            tasksList = JSON.tasks;
            if($.isArray(tasksList) && tasksList.length > 0) {
              jQuery.each(tasksList, function(){
                 result.push(this);
              });
              if ($.isFunction(callback)) callback(result);
              return result;
            } else {
              if ($.isFunction(callback)) callback([]);
              return [];
            }
          })
          .fail(function(JSON) {
            if(DEBUG_MODE) console.log('getWgetTasksList() result: ', JSON);
            showNoty({
              type:  'error',
              title: __('get_tasks_list_error','Get tasks list error'),
              msg:   __('request_rpc_failed','Request to "rpc" failed') + ' ('+__('http_code','http code')+': ' + JSON.status + ')'
            });
            if ($.isFunction(callback)) callback(result);
            return result;
          });
        return result;
      },

      addWgetTask = function(inputData, callback) {
        $.getJSON(rpc, {'action': 'add_task', 'url': inputData.url, 'saveAs': inputData.saveAs})
          .done(function(JSON) {
            if(DEBUG_MODE) console.log('addWgetTask() result: ', JSON);
            var result = {
              'status':   JSON.status,
              'msg':      JSON.msg,
              'id':       JSON.id,
              // Return some input params for call gui-functions in callback
              'url':      inputData.url,
              'saveAs':   inputData.saveAs,
              'pregress': inputData.progress,
              'isLast':   inputData.isLast
            };
            if ($.isFunction(callback)) callback(result);
            return result;
          })
          .fail(function(JSON) {
            if(DEBUG_MODE) console.log('addWgetTask() result: ', JSON);
            showNoty({
              type:  'error',
              title: __('add_task_error','Add task error'),
              msg:   __('request_rpc_failed','Request to "rpc" failed') + ' ('+__('http_code','http code')+': ' + JSON.status + ')'
            });
            if ($.isFunction(callback)) callback(false);
            return false;
          });
      },

      removeWgetTask = function(url_or_id, callback) {
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
            $.getJSON(rpc, {'action': 'remove_task', 'id': ID})
              .done(function(JSON) {
                if(DEBUG_MODE) console.log('removeWgetTask() result: ', JSON);
                var result = (JSON.status == '1') ? true : false;
                if ($.isFunction(callback)) callback(result, JSON.msg);
                return result;
              })
              .fail(function(JSON) {
                if(DEBUG_MODE) console.log('removeWgetTask() result: ', JSON);
                showNoty({
                  type:  'error',
                  title: __('remove_task_error','Remove task error'),
                  msg:   __('request_rpc_failed','Request to "rpc" failed') + ' ('+__('http_code','http code')+': ' + JSON.status + ')'
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
      },

      getHistoryList = function(callback) {
        var historyList = [], result = [];
        $.getJSON(rpc, {'action': 'get_history'})
          .done(function(JSON) {
            if(DEBUG_MODE) console.log('getHistoryList() result: ', JSON);
            if($.isArray(JSON.history) && (JSON.history.length > 0) && (JSON.status == '1')) {
              jQuery.each(JSON.history, function() {
                if((typeof this.downloaded_url !== 'undefined') && (typeof this.success !== 'undefined'))
                  result.push(this);
              });
              if ($.isFunction(callback)) callback(result);
              return result;
            } else {
              if ($.isFunction(callback)) callback([]);
              return [];
            }
          })
          .fail(function(JSON) {
            if(DEBUG_MODE) console.log('getHistoryList() result: ', JSON);
            showNoty({
              type:  'error',
              title: __('get_history_list_error','Get history list error'),
              msg:   __('request_rpc_failed','Request to "rpc" failed') + ' ('+__('http_code','http code')+': ' + JSON.status + ')'
            });
            if ($.isFunction(callback)) callback(result);
            return result;
          });
        return result;
      },

      getDownloadedFilesList = function(callback){
        $.getJSON(rpc, {'action': 'get_fileslist'})
          .done(function(JSON) {
            if(DEBUG_MODE) console.log('getDownloadedFilesList() result: ', JSON);
            if(JSON.hasOwnProperty('files') && (JSON.status == '1')) {
              if ($.isFunction(callback)) callback.call(null, JSON.files); // TODO: rewrite all callback calls
              return true;
            } else {
              if ($.isFunction(callback)) callback.call(null, false);
            }
          })
          .fail(function(JSON) {
            if(DEBUG_MODE) console.log('getDownloadedFilesList() result: ', JSON);
            showNoty({
              type:  'error',
              title: __('get_files_list_error', 'Get files list error'),
              msg:   __('request_rpc_failed','Request to "rpc" failed') + ' ('+__('http_code','http code')+': ' + JSON.status + ')'
            });
            if ($.isFunction(callback)) callback(false);
          });
        return false;
      },

      testServer = function() {
        $.getJSON(rpc, {'action': 'test'})
          .done(function(JSON) {
            if(DEBUG_MODE) console.log('testServer() result: ', JSON);
            var msgType = (JSON.status == '1') ? "success" : "error";
            showNoty({
              type: msgType,
              title: __('server_test_result','Server test result'),
              msg: JSON.msg,
              timeout: 0
            });
            return true;
          })
          .fail(function(JSON) {
            if(DEBUG_MODE) console.log('testServer() result: ', JSON);
            showNoty({
              type:  'error',
              title: __('server_test_error','Server test error'),
              msg:   __('request_rpc_failed','Request to "rpc" failed') + ' ('+__('http_code','http code')+': ' + JSON.status + ')'
            });
            return false;
          });
        return false;
      };

  /*
    Tasks GUI functions (Get & set data to GUI)
    -------------------------------------------
  */
  // Return task pointer by id (int)
  var getTaskObj = function(taskID) {
        return $('.task.id'+taskID);
      },

      // Set progress bar position
      setTaskProgress = function(taskID, setPosition) {
        if(typeof taskID !== 'number') return;
        if((typeof setPosition !== 'number') || (setPosition < 0) || (setPosition > 100)) setPosition = 0;
        var taskObj = getTaskObj(taskID),
          meter = taskObj.find('div.meter').first(),
          indicator = meter.find('span').first(),
          lastProgress = indicator.data('setWidth');
        if((typeof lastProgress == 'undefined') || (lastProgress < 0) || (lastProgress > 100))
          lastProgress = 0;
        indicator
          .data('setWidth', setPosition).html('<b>'+setPosition+'</b><span></span>')
          .width(lastProgress+'%').animate({width: indicator.data('setWidth')+'%'}, 500);
      },

      // Set task label text
      setTaskLabelText = function(taskID, labelText) {
        if(typeof taskID !== 'number') return;
        if((typeof labelText !== 'string') || (labelText.length == 0)) return;
        getTaskObj(taskID).find('td.name').first().find('a').first()
          .text(labelText)
          .attr('title', labelText);
      },

      // Add task to GUI
      addTaskGui = function(data) {
        /* data = {'url': 'http://foo.com/bar.dat', 'progress': 50, 'id': 12345, 'name': 'somename'} */
        if(DEBUG_MODE) console.log('addTaskGui() data: ', data);
        var url = data.url,
          saveas = data.saveas,
          labelText = ((typeof data.name === 'string') && (data.name.length !== 0)) ? data.name : getLabelTextFromUrl(url),
          taskID = data.id, /* set task ID */
          html = '<div class="task id'+taskID+'">'+
                 '<table><tr>'+
                 '<td class="name"><a href="'+url+'" title="'+labelText+'" target="_blank">'+labelText+'</a></td>'+
                 '<td class="progress"><div class="meter animate"><span style="width: 0%"><span></span></span></div></td>'+
                 '<td class="actions"><input type="button" class="button cancel red-hover" value="'+__('cancel', 'Cancel')+'" /></td>'+
                 '</td></table>'+
               '</div>';

        $taskList.append(html);
        var taskObj = $taskList.find('div.task.id'+taskID).last();
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
        setMode('active_tasks');
      },

      // Get tasks list (from GUI)
      getTasksList = function() {
        var tslist = $taskList.find('div.task');
        if(tslist.length > 0) {
          var result = [];
          jQuery.each(tslist, function() {
             result.push($(this).data('info'));
          });
          return result;
        }
        return null;
      },


      // Remove (cancel) task
      removeTaskGui = function(taskID) {
        var taskObj = getTaskObj(taskID);
        taskObj
          .animate({height: 0, opacity: 0}, 300, function() {
            taskObj.remove();
            var TasksList = getTasksList();
            if((TasksList == null) || (TasksList.length <= 0))
              setMode('bar_only');
          });
      },

      addTask = function(fileUrl, progress) {
        // Add VK external video code support
        if(/\<iframe\s.*src=\"http.?\:\/\/.*vk\.com\/video_ext\.php\?.*\".*\>/i.test(fileUrl)) {
          var vkVideoUrlParts = fileUrl.match(/\<iframe\s.*src=\"(.*?)\"/i),
              fileUrl = vkVideoUrlParts[1].replace("https", "http");
          $addTaskAddr.val(fileUrl);
        }
        fileUrl = clearString(fileUrl); // Make some clear
        // Make fast check
        if((typeof fileUrl !== 'string') || (fileUrl == '')) {
          showNoty({
            type:  'warning',
            title: __('check_url','Check url'),
            msg:   __('addr_cannot_be_empty','Address cannot be empty'),
          });
          return false;
        }
        // Call 'test' mode
        if(fileUrl === 'test') {
          testServer();
          return false;
        }
        if(/http.?\:\/\/.*vk\.com\/video\d{1,11}_\d{1,15}$/i.test(fileUrl)){ // Notify is passed link - is not supported video link
          showNoty({
            type: 'warning',
            title: __('link_format_not_supported','This link format is not supported')+', '+__('use_this_format','use this fromat')+':',
            msg: "<br />http://vk.com/<b>video_ext.php</b>?oid=-24589324&id=166211165&hash=aaefd0ae8321e482",
            timeout: 20000
          });
          return false;
        }
        // If 'fileUrl' without '(http|https|ftp)://' at the begin - we add 'http://'
        var fileUrl = (fileUrl.substring(3, 8).indexOf('://') == -1) ? 'http://'+fileUrl : fileUrl,
            urls = fileUrl.split(/\r*\n/),
            brokenUrls = [], validUrls = [];
        // Make urls check
        for(var i = 0; i < urls.length; ++i) {
          // Format: "http://someurl.is/here/file.dat -> newfilename.dat"
          var newTaskData = urls[i].split(" -> "),
              isSaveAsUrl = ($.isArray(newTaskData) && (newTaskData.length > 0) &&
                (typeof newTaskData[0] == 'string') && (newTaskData[0].length > 11) &&
                (typeof newTaskData[1] == 'string') && (newTaskData[1].length > 0)) ? true : false,
              newTaskUrl  = (isSaveAsUrl) ? newTaskData[0] : urls[i],
              newTaskSaveAs=(isSaveAsUrl) ? newTaskData[1] : '';
          if(DEBUG_MODE) console.log(isSaveAsUrl, newTaskUrl, newTaskSaveAs);
          // Source from: <http://stackoverflow.com/a/8317014>
          if(/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(newTaskUrl)) {
            addTasksLimitCount = (typeof addTasksLimitCount == 'number') && (addTasksLimitCount > 0) ? addTasksLimitCount : 5; /* default value */
            if(validUrls.length < addTasksLimitCount){
              validUrls.push({'url': newTaskUrl, 'saveAs': newTaskSaveAs});
            }
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
                    title: __('From_task','From task')+' "'+result.url+'" '+__('return_message','return message'),
                    msg: '<b>'+result.msg+'</b>',
                    timeout: 20000
                  });
                // If it is last task in stack - make sync
                if(result.isLast) syncTasksList();
              } else {
                // If returned error with correct message in answer
                if((result !== false) && (typeof result.url === 'string') && (typeof result.msg === 'string')) {
                  showNoty({
                    type: 'error',
                    title: __('From_task','From task')+' "'+result.url+'" '+__('return_message','return message'),
                    msg: '<b>'+result.msg+'</b>',
                    timeout: 20000
                  });
                // If all is bad =)
                } else {
                  showNoty({
                    type:  'error',
                    title: __('download_not_added','Download not added'),
                    msg:   __('server_error','Server error'),
                    timeout: 20000
                  });
                }
              }
            });
          }, 150 * i, taskData/* <--- pass settings object to timer */);
        }
        // And for broken
        if(brokenUrls.length)
          showNoty({
            type: 'warning',
            title: __('invalid_address', 'Invalid Address'),
            msg: __('Address', 'Address')+' "<b>'+brokenUrls.join("</b>, <b>")+'</b>" '+__('not_valid', 'is not valid')
          });
      },

      removeTask = function(taskID) {
        removeWgetTask(taskID, function(bool_result, msg){
          if(bool_result) {
            removeTaskGui(taskID);
            syncTasksList();
          } else {
            showNoty({
              type: 'error',
              title: __('download_task_not_removed', 'Download task not removed'),
              msg: '(ID'+taskID+', "'+msg+'")',
              timeout: 0
            });
          }
        });
      },

      updateHistoryList = function(){
        getHistoryList(function(list){
          var historyDiv = $('#historyList');
          if(list.length > 0) {
            var historyList = historyDiv.find('ul').first(),
                firstShow = (historyList.find('li').length == 0) ? true : false;
            if(firstShow) historyDiv.css({ opacity: 0 });
            historyDiv.show().css({ display: 'block' });
            historyList.empty();
            for(var i = 0; i < list.length; ++i) {
              var access_url_exists = ((typeof list[i].access_url !== 'undefined') && (list[i].access_url !== '')),
                  link = {
                    'css_class': (list[i].success === true) ? 'ok' : 'err',
                    'href': access_url_exists ? list[i].access_url : list[i].downloaded_url,
                    'size': access_url_exists && (typeof list[i].size !== 'undefined') ? list[i].size : 0,
                    'title': (list[i].success === true) ?
                      (access_url_exists ? __('open_dl_file_in_new_tab', 'Open downloaded file in a new tab') : list[i].downloaded_url) : __('task_completed_with_error', 'Task completed with error'),
                    'text': ((typeof list[i].saved_as === 'string') && (list[i].saved_as.length > 0)) ?
                      list[i].saved_as : getLabelTextFromUrl(list[i].downloaded_url)
                  };
              historyList.append('<li><a href="' + link.href + '" title="' + link.title + '" class="' + link.css_class + '" target="_blank"><i class="fa ' + getFAiconByFileName(link.href) + '"></i>' + link.text + '</a>' + (link.size > 0 ? ' ('+bytesToSize(link.size)+')' : ' <i class="fa external fa-external-link"></i>') + '</li>');
            }
            if(firstShow) historyDiv.animate({ opacity: 1 });
          } else {
            historyDiv.fadeOut();
          }
        });
      },

      updateDownloadedFilesList = function(){
        var guiFilesList = $downloadedFilesList.find('ul'),
            tempFilesList = $('<ul />'); // create temp object
        getDownloadedFilesList(function(filesListData){
          //console.warn(filesListData);
          if((typeof filesListData == 'object') && filesListData) {
            var convertFilesToHtmlList = function(list, obj){
                var isFile = function(obj){
                      return ((typeof obj == 'object') && obj.hasOwnProperty('type') && (obj.type == 'file'));
                    },
                    addItem = function(toList, obj, dirName) {
                      var access_url_exists = isFile(obj) && (typeof obj.access_url !== 'undefined') && (obj.access_url !== ''),
                        itemData = {
                          'css_class': isFile(obj) ? 'file' : 'dir',
                          'href': access_url_exists ? obj.access_url : obj.downloaded_url,
                          'size': access_url_exists && (typeof obj.size !== 'undefined') ? obj.size : 0,
                          'text': !isFile(obj) ? ((typeof dirName !== 'undefined') ? dirName : obj.name) : obj.name,
                        };
                      if(isFile(obj)) {
                        var a_tag = obj.hasOwnProperty('access_url') ? '<a href="' + itemData.href + '" ' +
                                     (itemData.size > 0 ? ' title="'+bytesToSize(itemData.size)+'"' : '') +
                                     ' target="_blank">' : '';
                        return $('<li class="' + itemData.css_class + '">' +
                                   '<i class="fa '+getFAiconByFileName(itemData.text)+'"></i>' +
                                   a_tag + itemData.text + (a_tag ? '</a>' : '') +
                                 '</li>').appendTo(toList);
                      } else {
                        return $('<li class="' + itemData.css_class + '">' +
                                   '<span>' + itemData.text + '</span><ul></ul>' +
                                 '</li>').appendTo(toList)
                                 .find('ul').first();
                      }
                    };
                jQuery.each(obj, function(name, data){
                  if(isFile(this)) {
                    addItem(list, this);
                  } else {
                    var newListItem = addItem(list, this, name);
                    convertFilesToHtmlList(newListItem, this);
                  }
                });
              };
            convertFilesToHtmlList(tempFilesList, filesListData);
            if(guiFilesList.html() !== tempFilesList.html()) {
              if(DEBUG_MODE) console.log('updateDownloadedFilesList() - Files list has been updated. Repaint');
              guiFilesList.empty().html(tempFilesList.html());
            }
            if(guiFilesList.find('li').length > 0) {
              if($downloadedFilesList.is(":hidden")) {
                $downloadedFilesList.fadeIn();
              }
            } else {
              if($downloadedFilesList.is(":visible")) {
                $downloadedFilesList.fadeOut();
              }
            }
          }
        });
      },

      syncTasksList = function() {
        /* Здесь всё таки нужен подробный комментарий. Функция для синхронизации данных полученных от сервера
           и тех, что отображены на GUI. Мы получаем список актуальных задач путем вызова 'getWgetTasksList',
           и далее пробегаемся по ним, выискивая какие вхождения есть там и тут. И если такие есть - заносим
           их ID в SyncedTasksIDs и обновляем данные в GUI (синхронизируем).
           Попутно записываем при каждом проходе по массиву Tasks - ID в RemoteTasksIDs.
           Далее - получаем ID всех задач, что у нас отображены в GUI.
           Далее - получаем РАЗНИЦУ между GuiTasksIDs и RemoteTasksIDs для того, чтоб получить ID задач,
           которые УДАЛЕНЫ, и сохраняем их в RemovedTasksIDs.
           Далее - выполняем аналогичное, но для получения ДОБАВЛЕННЫХ задач, с сохранением ID в AddedTasksIDs.

           Теперь, обладая всеми необходимыми данными для полноценной синхронизации - мы не актуальное - удаляем,
           а добавленное - отображаем. */
        getWgetTasksList(function(Tasks){
          var guiTasks = $taskList.find('div.task'),
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
          if(duplicatesFounded) guiTasks = $taskList.find('div.task'); // Refresh
          jQuery.each(Tasks, function() {
            var wgetTask = this;
            jQuery.each(guiTasks, function() {
              var guiTask = this, guiTaskData = $(guiTask).data('info');
              // if remote task id == GUI task id
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
          // +Get AddedTasksIDs
          var AddedTasksIDs = $(RemoteTasksIDs).not(GuiTasksIDs).get();
          // Refresh downloaded files list
          updateDownloadedFilesList();
          // Remove tasks from GUI
          for(var i = 0; i < RemovedTasksIDs.length; ++i) removeTaskGui(RemovedTasksIDs[i]);
          // Add tasks to GUI
          for(var i = 0; i < AddedTasksIDs.length; ++i)
            for(var j = 0; j < Tasks.length; ++j)
              if(Tasks[j].id == AddedTasksIDs[i])
                addTaskGui({'url': Tasks[j].url, 'progress': Tasks[j].progress, 'id': Tasks[j].id, 'name': Tasks[j].saveAs});
          // Set active tasks count in title
          if(RemoteTasksIDs.length > 0)
            $pageTitle.text('('+RemoteTasksIDs.length+') '+titleText);
          //if(DEBUG_MODE) console.info("Sync data:\n",
          //  'SyncedTasksIDs: '+SyncedTasksIDs+"\n",
          //  'RemoteTasksIDs: '+RemoteTasksIDs+"\n",
          //  'GuiTasksIDs: '+GuiTasksIDs+"\n",
          //  'RemovedTasksIDs: '+RemovedTasksIDs+"\n",
          //  'AddedTasksIDs: '+AddedTasksIDs
          //);
          // Init history list
          updateHistoryList();
          if((typeof updateStatusInterval === 'number') && updateStatusInterval > 0) {
            window.clearTimeout(timerHandler);
            timerHandler = setTimeout(function(){ return syncTasksList() }, updateStatusInterval);
          }
        });
      };

  /*
    GUI extended events & actions
    -----------------------------
  */
  if(!DEBUG_MODE) {
    // Disable 'not update window on F5' in debug mode
    var changeF5event = function(e) { // Source from: <http://stackoverflow.com/a/20009705>
      if ((e.which || e.keyCode) == 116 || (e.which || e.keyCode) == 82) {
        syncTasksList();
        showNoty({
          type: 'info',
          title: __('data_updated', 'Data updated'),
          showTime: true,
          timeout: 2000
        });
        e.preventDefault();
      }
    };
    $(document).on('keydown', changeF5event);
  }

  // Enable menu events
  var hideMenu = function(){
        $menu.removeClass('open').addClass('close');
        $menuButton.removeClass('open').addClass('close');
      },
      openMenu = function(){
        $menu.removeClass('close').addClass('open');
        $menuButton.removeClass('close').addClass('open');
      };
  $menuButton
    .on('click', function() {
      return ($menu.hasClass('open')) ? hideMenu() : openMenu();
    });

  // on press 'enter' in url text input
  $addTaskAddr.on('keypress', function(e) {
    var taskFieldsLinesCount = $(this).val().split("\n").length;
    addTasksLimitCount = (typeof addTasksLimitCount == 'number') && (addTasksLimitCount > 0) ? addTasksLimitCount : 5; // default value
    $addTaskAddr.attr('rows', $addTaskAddr.val().split(/\r*\n/).length);
    // [Ctrl] + [Enter] pressed
    if (e.ctrlKey && (e.keyCode == 10 || e.keyCode == 13)) {
      if(taskFieldsLinesCount >= addTasksLimitCount) { // maximum lines (tasks) count
        return false;
      }
      $addTaskAddr.val($addTaskAddr.val() + "\n");
      $addTaskAddr.trigger('keypress');
      return false;
    }
    // [Enter] pressed
    if (e.keyCode == 10 || e.keyCode == 13) {
      $addTaskAddr.trigger('keypress');
      $addTaskBtn.click();
      return false;
    }
    // Automatically replace vk.com iframe code to correct link (if one task only)
    var taskText = $(this).val();
    var vkLink = /\<iframe\s.*src=\"http.?\:\/\/.*vk\.com\/video_ext\.php\?.*\".*\>/i;
    if((taskFieldsLinesCount == 1) && vkLink.test(taskText)) {
      var vkVideoUrlParts = taskText.match(/\<iframe\s.*src=\"(.*?)\"/i),
          fileUrl = vkVideoUrlParts[1].replace("https", "http"),
          taskText = taskText.replace(vkLink, fileUrl);
      $(this).val(taskText);
    }
  }).on('keydown', function(e) {
    // any event on [Backspace] or [Del] not call 'keypress', and
    //   we need call it manually after some time
    if (e.keyCode == 8 || e.keyCode == 46) {
      setTimeout(function(){ $addTaskAddr.trigger('keypress'); }, 10);
    }
  }).on('paste', function() {
    // [Paste] text event
    setTimeout(function(){ $addTaskAddr.trigger('keypress'); }, 10);
  }).on('focus', function(){
    hideMenu(); // Hide side menu
  });

  // on press 'add task' button
  $addTaskBtn.on('click', function(){
    addTask($addTaskAddr.val());
  });

  // #taskExtended functions
  $addTaskAddr
    .on('focus',    function(){$('#taskExtended .multitask').animate({ opacity: 0.8 }, 200)})
    .on('focusout', function(){$('#taskExtended .multitask').animate({ opacity: 0 },   200)});

  // Print version to any gui element with class 'projectCurrentVersion'
  if((typeof WGET_GUI_LIGHT_VERSION == 'string') && WGET_GUI_LIGHT_VERSION !== '')
    $('.projectCurrentVersion').text(' v'+WGET_GUI_LIGHT_VERSION);

  // Enable feature 'Quick download bookmark'
  if(($.urlParam('action') == 'add')){
    $addTaskAddr.val($.urlParam('url')); $addTaskBtn.click();
  }
  $("#bookmark")
    .attr("href", "javascript:window.open('"+document.URL+"?action=add&url='+window.location.toString());void 0;")
    .on('click', function(){
      showNoty({
        type: 'info',
        title: __('bookmark', 'Bookmark'),
        msg: __('bookmark_dont_click', 'Move me to your bookmarks bar, don\'t click here :)'),
        timeout: 5000
      });
      return false;
    });

  /*
    Browser extension
    -----------------
  */
  if(CheckExtensionInstalled) {
    var chromeCheckExtensionInstalled = function(callback){
          $body.append('<img alt="" id="extensionImg" style="display:none" />');
          var extensionImg = $('#extensionImg');
          extensionImg
            .one('load',  function(){if($.isFunction(callback))callback(true);  extensionImg.remove()})
            .one('error', function(){if($.isFunction(callback))callback(false); extensionImg.remove(); if(!DEBUG_MODE) {console.clear(); console.info('Google chrome extension not installed, console cleared');}})
            .attr('src', 'chrome-extension://dbcjcjjjijkgihaddcmppppjohbpcail/img/icon.png');
        },
        isBrowser = (/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) ? 'chrome' : '';

    if(isBrowser === 'chrome') {
      chromeCheckExtensionInstalled(function(installed){
        if(!installed) {
          $menu.find('ul').first().append('<li><a href="#" id="browserExtension" style="display:none;">'+__('install_google_ext', 'Install Google Chrome Extension')+'</a></li>');
          var addExtension = $('#browserExtension');
          addExtension
            .show().addClass('chrome')
            .on('click', function(){
              window.open('https://chrome.google.com/webstore/detail/dbcjcjjjijkgihaddcmppppjohbpcail');
              return false;
            });
        }
      });
    }
  }

  /*
    Need Update Notification
    ------------------------
  */
  function checkProjectUpdate() {
    if(!((typeof CheckForUpdates == 'boolean') && CheckForUpdates)) return;
    // <http://stackoverflow.com/a/14540169>
    // @returns {Integer} 0: v1 == v2, -1: v1 < v2, 1: v1 > v2
    function versionCompare(n,t){var e,r,i,l=(""+n).split("."),a=(""+t).split("."),h=Math.min(l.length,a.length);
    for(i=0;h>i;i++)if(e=parseInt(l[i],10),r=parseInt(a[i],10),isNaN(e)&&(e=l[i]),isNaN(r)&&(r=a[i]),e!=r)return e>r?1:r>e?-1:0/0;
    return l.length===a.length?0:l.length<a.length?-1:1}
    // Disable update checking (read cookie value)
    if((typeof $.cookie !== 'undefined') && ($.cookie('DoNotCheckUpdate') !== 'true')) {
      // <http://rawgit.com/>
      try { // TODO: Comment while testing
        $.getScript('https://rawgit.com/tarampampam/wget-gui-light/master/lastversion.js', function(){
          // Check returned value in script. and local (declared in 'settings.php')
          if((typeof web_wgetguilight !== 'undefined') && (typeof web_wgetguilight.version == 'string') &&
             (web_wgetguilight.version !== '')) {
            // Compare local and web versions
            // If web version is newest then local
            if(versionCompare(WGET_GUI_LIGHT_VERSION, web_wgetguilight.version) < 0) {
              var webVer = web_wgetguilight;
              $menu.find('.bottom').last().append('<br /><a id="updateAvailable" href="'+webVer.download.page+'" title="'+webVer.lastUpdate.shortDesc+'" target="_blank">'+__('update_available', 'Update available')+'</a>');
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
                  .appendTo($head);
                // Create popup container details
                $body.append('<div id="updateDetails" style="display:none">' +
                               '<span class="button popupClose">' +
                                 '<span>X</span>' +
                               '</span>' +
                               '<h2 class="name">'+webVer.name+'</h2>' +
                               '<h3 class="curentver">'+__('current_version', 'Current version')+': '+WGET_GUI_LIGHT_VERSION+'</h3>' +
                               '<h3 class="availablever">'+__('available_version', 'Available version')+': <strong>'+webVer.version+'</strong></h3>' +
                               '<p class="desc">' + webVer.lastUpdate.shortDesc + ' // <a href="' + webVer.lastUpdate.fullDescUrl + '" target="_blank">'+__('full_text', 'Full text')+'</a></p>' +
                               '<div class="links">' +
                                 '<a class="page" href="'+webVer.download.page+'" target="_blank"><i class="fa fa-info-circle"></i><br />'+__('how_update', 'How update')+'?</a>' +
                                 '<a class="dl" href="'+webVer.download.file+'"><i class="fa fa-download"></i><br />'+__('download_update', 'Download update')+'</a>' +
                                 '<div class="clear"></div>' +
                               '</div>' +
                               '<p class="disable">' +
                                 '<a href="#" id="disableUpdateCheck">'+__('disable_upd_checking', 'Disable updates checking')+'</a>' +
                                 '<span>'+__('setting_store_in_cookie', 'This setting will be stored in cookies')+'</span>' +
                               '</p>' +
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
              if(DEBUG_MODE) console.log('Update not available');
            }
          }
        });
      } catch(e) {console.log('Error on checking update : ' + e)}// TODO: Comment while testing
    }
  }

  /*
    +--------------------+
    | +----------------+ |
    | | Initialization | |
    | +----------------+ |
    +--------------------+
  */
  // Output settings errors
  if((typeof settingsErrors == 'object') && (settingsErrors.length > 0)) {
    jQuery.each(settingsErrors, function(id, message) {
       showNoty({type: 'error', title: 'Settings error:', msg: '<br />'+message, timeout: 0});
    });
    setMode('disabled');
    return;
  }

  //showNoty({type: 'error', title: 'Title', msg: 'Message'}); // For debug 'Noty'
  if(DEBUG_MODE) updateStatusInterval = 0; // For debug disable automatic data update
  //addTaskGui({'url': 'http://foo.com/bar.dat', 'progress': 23, 'id': 12345, 'name': 'Filename.ext'}); // For debug 'Gui Task'

  setMode('bar_only'); // Set window mode and init favicon
  $addTaskAddr.focus(); // Set focus to input
  syncTasksList(); // Run timer // TODO: Uncomment
  checkProjectUpdate(); // Check new version, if this function is enabled
});