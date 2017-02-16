/*
  In this object we declare all locales. See example below:
*/

var l10n = {
  /*
  // TRANSLATE EXAMPLE

  // @translator  Somename Somesurname <someemail@domain.ltd>
  // @homepage    <https://somename_homepage.ltd>
  // @language    English (en)
  // @ready_for   0.1.7
  'en': {
    'download_file':       'Download file',                                       // since 0.1.6
    'add_task':            'Add Task',                                            // since 0.1.6
    'recent_tasks':        'Recent tasks',                                        // since 0.1.6
    'press':               'Press',                                               // since 0.1.6
    'cancel':              'Cancel',                                              // since 0.1.6
    'add_more_task':       'if you want add more than one task',                  // since 0.1.6
    'close':               'Сlose',                                               // since 0.1.6
    'bookmark_download':   'Bookmark "Download"',                                 // since 0.1.6
    'bookmark':            'Bookmark',                                            // since 0.1.6
    'bookmark_dont_click': 'Move me to your bookmarks bar, don\'t click here :)', // since 0.1.6
    'downloaded_files':    'Downloaded files',                                    // since 0.1.6
    'install_google_ext':  'Install Google Chrome Extension',                     // since 0.1.6

    'request_rpc_failed':     'Request to "rpc" failed',                          // since 0.1.6
    'http_code':              'http code',                                        // since 0.1.6
    'get_tasks_list_error':   'Get tasks list error',                             // since 0.1.6
    'add_task_error':         'Add task error',                                   // since 0.1.6
    'remove_task_error':      'Remove task error',                                // since 0.1.6
    'get_history_list_error': 'Get history list error',                           // since 0.1.6
    'server_test_error':      'Server test error',                                // since 0.1.6
    'get_files_list_error':   'Get files list error',                             // since 0.1.6

    'server_test_result':        'Server test result',                            // since 0.1.6
    'check_url':                 'Check url',                                     // since 0.1.6
    'addr_cannot_be_empty':      'Address cannot be empty',                       // since 0.1.6
    'link_format_not_supported': 'This link format is not supported',             // since 0.1.6
    'use_this_format':           'use this fromat',                               // since 0.1.6

    'From_task':      'From_task',                                                // since 0.1.6
    'return_message': 'return message',                                           // since 0.1.6
    'bytes':          'Bytes',                                                    // since 0.1.6
    'kb':             'KB',                                                       // since 0.1.7
    'mb':             'MB',                                                       // since 0.1.7
    'gb':             'GB',                                                       // since 0.1.7
    'tb':             'TB',                                                       // since 0.1.7
    'data_updated':   'Data updated',                                             // since 0.1.6

    'download_not_added': 'Download not added',                                   // since 0.1.6
    'server_error':       'Server error',                                         // since 0.1.6
    'invalid_address':    'Invalid Address',                                      // since 0.1.6
    'address':            'address',                                              // since 0.1.6
    'Address':            'Address',                                              // since 0.1.6
    'not_valid':          'is not valid',                                         // since 0.1.6

    'download_task_not_removed': 'Download task not removed',                     // since 0.1.6
    'open_dl_file_in_new_tab':   'Open downloaded file in a new tab',             // since 0.1.6
    'task_completed_with_error': 'Task completed with error',                     // since 0.1.6

    'update_available':        'Update available',                                // since 0.1.6
    'current_version':         'Current version',                                 // since 0.1.6
    'available_version':       'Available version',                               // since 0.1.6
    'full_text':               'Full text',                                       // since 0.1.6
    'how_update':              'How update',                                      // since 0.1.6
    'download_update':         'Download update',                                 // since 0.1.6
    'disable_upd_checking':    'Disable updates checking',                        // since 0.1.6
    'setting_store_in_cookie': 'This setting will be stored in cookies',          // since 0.1.6
  },
  */

  // @translator  github.com/tarampampam <github.com/tarampampam>
  // @homepage    <http://blog.kplus.pro/>
  // @language    Russian (ru)
  // @ready_for   0.1.7
  'ru': {
    'download_file':       'Скачать файл',
    'add_task':            'Скачать',
    'recent_tasks':        'Последние задачи',
    'press':               'Нажмите',
    'cancel':              'Отмена',
    'add_more_task':       'если требуется добавить более одной задачи',
    'close':               'Закрыть',
    'bookmark_download':   'Закладка "Скачать"',
    'bookmark':            'Закладка',
    'bookmark_dont_click': 'Перемести меня на панель закладок браузера, а не нажимай прямо здесь :)',
    'downloaded_files':    'Загруженные файлы',
    'install_google_ext':  'Установить плагин для браузера Google Chrome',

    'request_rpc_failed':     'Запрос к "rpc" завершился неудачей',
    'http_code':              'код http',
    'get_tasks_list_error':   'Ошибка получения списка задач',
    'add_task_error':         'Ошибка добавления задачи',
    'remove_task_error':      'Ошибка отмены задачи',
    'get_history_list_error': 'Ошибка получения списка закачек',
    'server_test_error':      'Ошибка тестирования сервера',
    'get_files_list_error':   'Ошибка получения списка загруженных файлов',

    'server_test_result':        'Результат тестирования сервера',
    'check_url':                 'Проверьте URL адрес',
    'addr_cannot_be_empty':      'Адрес не может быть пустым',
    'link_format_not_supported': 'Данный формат ссылки не поддерживается',
    'use_this_format':           'используйте следующий формат',

    'From_task':      'От задачи',
    'return_message': 'вернулось сообщение',
    'bytes':          'Байт',
    'kb':             'Кб',
    'mb':             'Мб',
    'gb':             'Гб',
    'tb':             'Тб',
    'data_updated':   'Данные обновлены',

    'download_not_added': 'Задача не добавлена',
    'server_error':       'Ошибка сервера',
    'invalid_address':    'Ошибочный адрес',
    'address':            'адрес',
    'Address':            'Адрес',
    'not_valid':          'не корректен',

    'download_task_not_removed': 'Задача не была удалена',
    'open_dl_file_in_new_tab':   'Открыть загруженный файл в новой вкладке',
    'task_completed_with_error': 'Загрузка файла завершилась с ошибкой',

    'update_available':        'Доступно обновление',
    'current_version':         'Текущая версия',
    'available_version':       'Доступна версия',
    'full_text':               'Полный текст',
    'how_update':              'Как обновить',
    'download_update':         'Скачать обновленную версию',
    'disable_upd_checking':    'Отменить проверку на наличие новых версии',
    'setting_store_in_cookie': 'Эта настройка будет сохранена в файле cookie',
  },

  // @translator  Florian M <flo.siteweb@free.fr>
  // @homepage    <http://flothegeek.fr/>
  // @language    French (fr)
  // @ready_for   0.1.7
  'fr': {
    'download_file':       'Télécharger un fichier',
    'add_task':            'Ajouter',
    'recent_tasks':        'Téléchargements récents',
    'press':               'Pressez',
    'cancel':              'Annuler',
    'add_more_task':       'pour ajouter plusieurs fichiers',
    'close':               'Fermer',
    'bookmark_download':   'Ajouter en marque-page',
    'bookmark':            'Marque-page',
    'bookmark_dont_click': 'Déplacez-moi vers vos marques-pages, ne pas cliquer ici :)',
    'downloaded_files':    'Fichiers téléchargés',
    'install_google_ext':  'Installer le plug-in pour Google Chrome',

    'request_rpc_failed':     'La requête RPC à échouée',
    'http_code':              'code HTTP',
    'get_tasks_list_error':   'Impossible d\'obtenir la liste des téléchargements',
    'add_task_error':         'Impossible d\'ajouter le téléchargement',
    'remove_task_error':      'Impossible de retirer le téléchargement',
    'get_history_list_error': 'Impossible de récupérer l\'historique',
    'server_test_error':      'Erreur du serveur de test',
    'get_files_list_error':   'Impossible de récupérer la liste des fichiers téléchargés',

    'server_test_result':        'Résultat du serveur de test',
    'check_url':                 'Vérifier l\'URL',
    'addr_cannot_be_empty':      'L\'adresse ne peut pas être vide',
    'link_format_not_supported': 'Ce format de lien n\'est pas pris en charge',
    'use_this_format':           'Utilisez le format suivant',

    'From_task':      'De la tâche',
    'return_message': 'Message retourné',
    'bytes':          'Octets',
    'kb':             'Ko',
    'mb':             'Mo',
    'gb':             'Go',
    'tb':             'To',
    'data_updated':   'Mis à jour',

    'download_not_added': 'Téléchargement non ajouté',
    'server_error':       'Erreur du serveur',
    'invalid_address':    'Adresse invalide',
    'address':            'adresse',
    'Address':            'Adresse',
    'not_valid':          'Incorrect',

    'download_task_not_removed': 'Le téléchargement n\'a pas été retiré',
    'open_dl_file_in_new_tab':   'Ouvrir le fichier téléchargé dans un nouvel onglet',
    'task_completed_with_error': 'Le téléchargement est terminé avec erreur(s)',

    'update_available':        'Mise à jour disponible',
    'current_version':         'Version actuelle',
    'available_version':       'Version disponible',
    'full_text':               'Texte intégral',
    'how_update':              'Comment puis-je mettre à niveau',
    'download_update':         'Télécharger la mise à jour',
    'disable_upd_checking':    'Désactiver la vérification des nouvelles versions',
    'setting_store_in_cookie': 'Paramètre(s) enregistré en cookie',
  },

  // @translator  Olga Kleinknecht <olga.klein0106@gmail.com>
  // @homepage    <http://spinachcandy.me/>
  // @language    Deutsch (de)
  // @ready_for   0.1.7
  'de': {
    'download_file':       'Datei herunterladen',
    'add_task':            'Herunterladen',
    'recent_tasks':        'Letzte Aufgaben',
    'press':               'Drücken',
    'cancel':              'Abbrechen',
    'add_more_task':       'wenn Sie mehr als eine Aufgabe eingeben wollen',
    'close':               'Schließen',
    'bookmark_download':   'Leseteichen "Herunterladen"',
    'bookmark':            'Lesezeichen',
    'bookmark_dont_click': 'Verschieben Sie mich in Lesezeichenmenü, hier nicht drücken :)',
    'downloaded_files':    'Heruntergeladene Dateien',
    'install_google_ext':  'Installieren Sie Google Chrome Extension',

    'request_rpc_failed':     'Anfrage zu "rpc" fehlgeschlagen',
    'http_code':              'Code http',
    'get_tasks_list_error':   'Beim Senden der Aufgabenliste ist ein Fehler aufgetreten',
    'add_task_error':         'Beim Hinzufügen der Aufgabe ist ein Fehler aufgetreten ',
    'remove_task_error':      'Dbeim Abbrechen der Aufgabenausführung ist e’in Fehler aufgetreten',
    'get_history_list_error': 'Beim Senden der Downloads-Liste ist ein Fehler aufgetreten',
    'server_test_error':      'Server-Test ist fehlgeschlagen',
    'get_files_list_error':   'Beim Senden der Liste der heruntergeladenen Dateien ist ein Fehler aufgetreten',

    'server_test_result':        'Server-Test-Ergebniss',
    'check_url':                 'Prüfen Sie URL-Adresse',
    'addr_cannot_be_empty':      'Adresse kann nicht leer sein',
    'link_format_not_supported': 'Dieses Link-Format wird nicht akzeptiert',
    'use_this_format':           'nutzen Sie das folgende Format',

    'From_task':      'Von der Aufgabe',
    'return_message': 'die Nachricht ist zurück',
    'bytes':          'Bytes',
    'kb':             'KB',
    'mb':             'MB',
    'gb':             'GB',
    'tb':             'TB',
    'data_updated':   'Daten aktualisiert',

    'download_not_added': 'Die Aufgabe ist nicht hinzugefügt',
    'server_error':       'Server fehlgeschlagen',
    'invalid_address':    'Falsche Adresse',
    'address':            'Adresse',
    'Address':            'Adresse',
    'not_valid':          'falsch',

    'download_task_not_removed': 'Die Aufgabe wurde nicht entfernt',
    'open_dl_file_in_new_tab':   'Geladene Datei in neuem Tab öffnen',
    'task_completed_with_error': 'Das Herunterladen der Datei ist fehlgeschlagen',

    'update_available':        'Das Update ist verfügbar',
    'current_version':         'Aktuelle Version',
    'available_version':       'Verfügbare Version',
    'full_text':               'Volle Text',
    'how_update':              'Wie aktualisieren',
    'download_update':         'Aktuelle Version herunterladen',
    'disable_upd_checking':    'Die Update-Suche ausschalten',
    'setting_store_in_cookie': 'Diese Einstellung wird in cookie gespeichert',
  },
};
