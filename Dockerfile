FROM php:5.6-apache
COPY wget-gui-light/ /var/www/html
RUN chown -R www-data:www-data /var/www/html
VOLUME /var/www/html/downloads
COPY wget_1.18-5+deb9u3_amd64.deb /
RUN apt-get install libssl1.0.2
RUN dpkg -i /wget_1.18-5+deb9u3_amd64.deb
