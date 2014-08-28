Как обновить мою версию Wget GUI Light?
=========

 1. Перейти в директорию, где установлен "**Wget GUI Light**" (`cd \var\www\`);
 2. Сделать копию директории, в которой в данный момент установлен "Wget GUI Light", очистив содержимое (`mv ./wget-gui/ ./wget-gui-backup/; mkdir ./wget-gui/` или `cp -R ./wget-gui/ ./wget-gui-backup/; rm -R ./wget-gui/*`);
 3. Скачать [крайнюю версию] (`wget -O master.zip http://goo.gl/Glxyfo`);
 4. Распаковать архив в текущую директорию (`unzip master.zip`);
 5. Скопировать содержимое директории `/wget-gui-light-master/wget-gui-light/*` в директорию, где ранее был установлен "Wget GUI Light" (`cp -R ./wget-gui-light-master/wget-gui-light/* ./wget-gui/`);
 6. Внести необходимые изменения в секции настроек файлов `./wget-gui/rpc.php` и `./wget-gui/core.js` (предыдущие значения можно подсмотреть в сохраненной копии по пути `./wget-gui-backup/`);
 7. Проверить работоспособность путем открытия в браузере (если сразу не заработает - в строке добавления закачки ввести `test` и проанализировать вывод).

###### Если будет обнаружена какая либо ошибка, или вам потребуется дополнительный функционал - пожалуйста, сообщите об этом, **[перейдя по этой ссылке]**, или на электронную почту, указанную в [аккаунте].

![Octocat](https://octodex.github.com/images/dojocat.jpg)

[крайнюю версию]:https://github.com/tarampampam/wget-gui-light/archive/master.zip
[перейдя по этой ссылке]:https://github.com/tarampampam/wget-gui-light/issues/new
[аккаунте]:https://github.com/tarampampam