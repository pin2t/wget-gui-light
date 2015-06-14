Как обновить мою версию Wget GUI Light?
=========

* Перейти в директорию, где установлен "**Wget GUI Light**":
```shell
cd \var\www\
```
* Сделать копию директории, в которой в данный момент установлен "Wget GUI Light", очистив содержимое оригинальной директории:
```shell
mv ./wget-gui/ ./wget-gui-backup/
mkdir ./wget-gui/
## --- или ---
cp -R ./wget-gui/ ./wget-gui-backup/
rm -R ./wget-gui/*
```
* Скачать [крайнюю версию](https://github.com/tarampampam/wget-gui-light/archive/master.zip) 
```shell
wget -O master.zip http://goo.gl/Glxyfo
```
* Распаковать архив в текущую директорию
```shell
unzip master.zip
```
* Скопировать содержимое директории `/wget-gui-light-master/wget-gui-light/*` в директорию, где ранее был установлен "Wget GUI Light"
```shell
cp -R ./wget-gui-light-master/wget-gui-light/* ./wget-gui/
```
* Внести необходимые изменения файл настроек `./wget-gui/settings.php`  (предыдущие значения можно подсмотреть в сохраненной копии по пути `./wget-gui-backup/`)
* Проверить работоспособность путем открытия в браузере (если сразу не заработает - в строке добавления закачки ввести `test` и проанализировать вывод)
* **После** завершения всех настроек и проверок - удалить директории `./wget-gui-backup/`, `./wget-gui-light-master/` и файл `./master.zip`
```shell
rm -R ./wget-gui-backup/
rm -R ./wget-gui-light-master/
rm  ./master.zip
```

##### Для новой установки проделать все пункты, кроме второго.

###### Если будет обнаружена какая либо ошибка, или вам потребуется дополнительный функционал - пожалуйста, сообщите об этом, **[перейдя по этой ссылке]**, или на электронную почту, указанную в [аккаунте].

![Octocat](https://octodex.github.com/images/dojocat.jpg)

[перейдя по этой ссылке]:https://github.com/tarampampam/wget-gui-light/issues/new
[аккаунте]:https://github.com/tarampampam
