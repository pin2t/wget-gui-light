Wget GUI Light
=========

Web-интерфейс для [wget] - программы загрузки файлов по сети. Построен на Ajax+css3 с клиентской стороны, и php с серверной. Требования к системе, на которой разворачивается данное решение:

  - ***nix** (по крайней мере писалось именно под эту платформу; для запуска под иной - требуются рабочие порты `bash`, `wget`, `ps`, `rm` и `kill`);
  - **php5.x** (скорее всего работать будет и на php4.x, по под руками нет готовой системы для тестирования);
  - **Браузер** с поддержкой javascript (очень желательно - с поддержкой css3).

Скриншот интерфейса:
![screenshot](http://habrastorage.org/files/35b/291/c45/35b291c45ba4476ebf0517416efc01d2.png)

Особенности серверной части:
----
Как уже было сказано выше - в роли серверной части выступает скрипт, написанный на php. Он выполняет следующие задачи:
 * Получение информации о запущенных задачах;
 * Отмена запущенных задач;
 * Добавление новых задач;
 * Возвращение результатов в JSON формате (отвечает на на POST, так и GET запросы).

Для своей работы ему требуются `bash`, `wget`, `ps`, `rm` и `kill`. Для получения значения состояния закачки (на сколько процентов завершена) используется следующий принцип:
 * Задачи `wget` запускаются с флагом и `--progress=bar:force`;
 * Вывод лога загрузки производится в файл, установленный в параметре `--output-file=FILE`;
 * При запросе состояния задач с помощью `ps -ax` получаем путь к файлу, установленный в `--output-file=FILE`;
 * Читаем крайнюю строку этого файла, получая из него искомое значение.

После завершения закачки или её отмены - лог файл удаляется. Данную возможность можно отключить, закомментировав строку `define('tmp_path', '/tmp');`

Путь до директории, в которую будет происходить сохранение всех загружаемых файлов устанавливается в строке `define('download_path', BASEPATH.'/downloads');`.

Доступно удобное указание путей до `ps`, `wget` и `kill`. Для этого достаточно убрать комментарий вначале строки и указать свой путь, например: `define('wget', '/usr/bin/wget');`.

Возможна установка ограничения на скорость закачки из секции настроек. За это отвечает строка `define('wget_download_limit', '1024');`.

Для определения в списке задачи запущенной через GUI от любой другой используется определенный флаг, уникальный для GUI. Он установлен в строке  `define('wget_secret_flag', '--max-redirect=4321');` и его менять без необходимости не надо.

Скрипт отвечает как на POST, так и GET запросы. Разницы между ними нет. 

![screenshot](http://habrastorage.org/files/b34/4bf/aa2/b344bfaa2f0c42aea6bf046b102e13f9.png)

Особенности клиентской части:
----
Не используются новые html5 теги, но используются css3 для оформления прогресc-бара загрузок. Дизайн выполнен в минималистичном стиле _без изображений_ (исключением является favicon). При отсутствии задач в центре страницы располагается поле для добавления адреса закачки, если задачи имеются - это поле смещается вверх страницы, и ниже располагаются задачи.

Все запросы - асинхронные (без перезагрузки страницы). Дизайн страницы - адаптивный:

![screenshot](http://habrastorage.org/files/e7b/edf/de0/e7bedfde017b448394da4b33aa404170.png)

Изменение состояния отображается также в заголовке вкладки (окна):

![screenshot](http://habrastorage.org/files/6c6/d57/23b/6c6d5723b78d4c13a43b31c63988c398.png) ![screenshot](http://alpha.hstor.org/files/e5e/6de/040/e5e6de040eaf4e4d83aa663e1e774c68.png)

В нижней части документа располагается javascript-закладка ("Download this"), переместив которую в панель закладок браузера можно одним кликом добавлять новые задачи (при клике будет добавлена активная вкладка; если открыта вкладка с видеофайлом и будет нажата эта "закладка" на панели закладок - будет добавлена задача на скачивание этого видеофайла):

![screenshot](http://habrastorage.org/files/e96/7af/70f/e967af70fb8f49489daa19cd471b9125.png)

Весь javascript код документа расположен в файле `core.js`. В верхней его части располагаются основные настройки:
 * `updateStatusInterval` - интервал обновления данных на открытой вкладке (будьте аккуратны с этим параметром на слабых серверах);
 * `DebugMode` - режим отладки, выводится отладочная информация в console.log;
 * `prc` - путь до php скрипта серверной части.

Описывать функциональные момента смысла особого не вижу, но скажу - функции разделены на логические группы, скрипт не минифицирован, комментарии имеют место быть. Самое интересное на мой взгляд - это функция синхронизации данных, но рядом с ней и так написан комментарий (единственный на Русском).

Установка:
----

 * Скачать или склонировать крайнюю версию репозитория;
 * Распаковать в директорию, доступную "извне";
 * Изменить путь `define('download_path', BASEPATH.'/downloads');` в `rpc.php`;
 * Открыть в браузере, проверить работоспособность. В случае возникновения ошибок - [задайте вопрос].

### История изменений

* **0.0.4** - Исправлено автоматическое удаление лог-файлов `wget`-а, мелкие исправления
* **0.0.3** - Релиз на гитхабе

### Лицензия:

Copyright (c) 2014 Samoylov Nikolay

Данная лицензия разрешает лицам, получившим копию данного программного обеспечения и сопутствующей документации (в дальнейшем именуемыми «Программное Обеспечение»), безвозмездно использовать Программное Обеспечение без ограничений, включая неограниченное право на использование, копирование, изменение, добавление, публикацию, распространение, сублицензирование и/или продажу копий Программного Обеспечения, также как и лицам, которым предоставляется данное Программное Обеспечение, при соблюдении следующих условий:

Указанное выше уведомление об авторском праве и данные условия должны быть включены во все копии или значимые части данного Программного Обеспечения.

ДАННОЕ ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ», БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, ЯВНО ВЫРАЖЕННЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ, ВКЛЮЧАЯ, НО НЕ ОГРАНИЧИВАЯСЬ ГАРАНТИЯМИ ТОВАРНОЙ ПРИГОДНОСТИ, СООТВЕТСТВИЯ ПО ЕГО КОНКРЕТНОМУ НАЗНАЧЕНИЮ И ОТСУТСТВИЯ НАРУШЕНИЙ ПРАВ. НИ В КАКОМ СЛУЧАЕ АВТОРЫ ИЛИ ПРАВООБЛАДАТЕЛИ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ПО ИСКАМ О ВОЗМЕЩЕНИИ УЩЕРБА, УБЫТКОВ ИЛИ ДРУГИХ ТРЕБОВАНИЙ ПО ДЕЙСТВУЮЩИМ КОНТРАКТАМ, ДЕЛИКТАМ ИЛИ ИНОМУ, ВОЗНИКШИМ ИЗ, ИМЕЮЩИМ ПРИЧИНОЙ ИЛИ СВЯЗАННЫМ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ ИЛИ ИСПОЛЬЗОВАНИЕМ ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ ИЛИ ИНЫМИ ДЕЙСТВИЯМИ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ.

### 3rd party:

* Библиотека [jquery]
* Парсер ссылок [url.js]
* Плагин уведомлений [notifIt]
* [CSS3 progress bar]


[wget]:https://ru.wikipedia.org/wiki/Wget
[задайте вопрос]:https://github.com/tarampampam/wget-gui-light/issues/new
[notifIt]:https://dl.dropboxusercontent.com/u/19156616/ficheros/notifIt!-1.1/index.html
[jquery]:http://jquery.com/
[url.js]:http://habrahabr.ru/post/232073/
[CSS3 progress bar]:http://css-tricks.com/css3-progress-bars/
