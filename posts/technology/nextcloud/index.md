# Nextcloud配置

## nextcloud网盘相关问题
### 网盘配置
#### （1）配置环境
- Linux &#43; Apache2 &#43; Mysql &#43; Php(LAMP)
[Example installation on Ubuntu 20.04 LTS — Nextcloud latest Administration Manual latest documentation](https://docs.nextcloud.com/server/latest/admin_manual/installation/example_ubuntu.html)
-  配置Linux &#43; Nginx &#43; Mysql &#43; Php(LNMP)环境
```bash
sudo apt update &amp;&amp; sudo apt upgrade
sudo apt install mariadb-server nginx php-gd php-mysql php-fpm \
php-curl php-mbstring php-intl php-gmp php-bcmath php-xml php-imagick php-zip
```

#### （2）安装nextcloud
[Installation on Linux — Nextcloud latest Administration Manual latest documentation](https://docs.nextcloud.com/server/latest/admin_manual/installation/source_installation.html)

#### （3）Nginx配置解析php
- Nginx配置上传大小
```bash
# /etc/nginx/nginx.conf
http {

	client_max_body_size 20480M;
	client_body_buffer_size 10M;
}
```
- 修改配置
```bash
# /etc/nginx/conf.d/nextcloud.conf
##
# You should look at the following URL&#39;s in order to grasp a solid understanding
# of Nginx configuration files in order to fully unleash the power of Nginx.
# https://www.nginx.com/resources/wiki/start/
# https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/
# https://wiki.debian.org/Nginx/DirectoryStructure
#
# In most cases, administrators will remove this file from sites-enabled/ and
# leave it as reference inside of sites-available where it will continue to be
# updated by the nginx packaging team.
#
# This file will automatically load configuration files provided by other
# applications, such as Drupal or Wordpress. These applications will be made
# available underneath a path with that package name, such as /drupal8.
#
# Please see /usr/share/doc/nginx-doc/examples/ for more detailed examples.
##

# Default server configuration
#
upstream php-handler {
	#server 127.0.0.1:9000;
	server unix:/run/php/php8.1-fpm.sock;
}

server {
    listen 80;
    listen [::]:80;
    server_name nextcloud.laais.cn;

    # Path to the root of your installation
    root /var/www/nextcloud;

    # Enable gzip but do not remove ETag headers
    gzip on;
    gzip_vary on;
    gzip_comp_level 4;
    gzip_min_length 256;
    gzip_proxied expired no-cache no-store private no_last_modified no_etag auth;
    gzip_types application/atom&#43;xml application/javascript application/json application/ld&#43;json application/manifest&#43;json application/rss&#43;xml application/vnd.geo&#43;json application/vnd.ms-fontobject application/wasm application/x-font-ttf application/x-web-app-manifest&#43;json application/xhtml&#43;xml application/xml font/opentype image/bmp image/svg&#43;xml image/x-icon text/cache-manifest text/css text/plain text/vcard text/vnd.rim.location.xloc text/vtt text/x-component text/x-cross-domain-policy;

    # Pagespeed is not supported by Nextcloud, so if your server is built
    # with the `ngx_pagespeed` module, uncomment this line to disable it.
    #pagespeed off;

    # HTTP response headers borrowed from Nextcloud `.htaccess`
    add_header Referrer-Policy                      &#34;no-referrer&#34;   always;
    add_header X-Content-Type-Options               &#34;nosniff&#34;       always;
    add_header X-Download-Options                   &#34;noopen&#34;        always;
    add_header X-Frame-Options                      &#34;SAMEORIGIN&#34;    always;
    add_header X-Permitted-Cross-Domain-Policies    &#34;none&#34;          always;
    add_header X-Robots-Tag                         &#34;none&#34;          always;
    add_header X-XSS-Protection                     &#34;1; mode=block&#34; always;

    # Remove X-Powered-By, which is an information leak
    fastcgi_hide_header X-Powered-By;

    # Specify how to handle directories -- specifying `/index.php$request_uri`
    # here as the fallback means that Nginx always exhibits the desired behaviour
    # when a client requests a path that corresponds to a directory that exists
    # on the server. In particular, if that directory contains an index.php file,
    # that file is correctly served; if it doesn&#39;t, then the request is passed to
    # the front-end controller. This consistent behaviour means that we don&#39;t need
    # to specify custom rules for certain paths (e.g. images and other assets,
    # `/updater`, `/ocm-provider`, `/ocs-provider`), and thus
    # `try_files $uri $uri/ /index.php$request_uri`
    # always provides the desired behaviour.
    index index.php index.html /index.php$request_uri;


    # Rule borrowed from `.htaccess` to handle Microsoft DAV clients
    location = / {
        if ( $http_user_agent ~ ^DavClnt ) {
            return 302 /remote.php/webdav/$is_args$args;
        }
    }

    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }

    # Ensure this block, which passes PHP files to the PHP process, is above the blocks
    # which handle static assets (as seen below). If this block is not declared first,
    # then Nginx will encounter an infinite rewriting loop when it prepends `/index.php`
    # to the URI, resulting in a HTTP 500 error response.
    location ~ \.php(?:$|/) {
        # Required for legacy support
        rewrite ^/(?!index|remote|public|cron|core\/ajax\/update|status|ocs\/v[12]|updater\/.&#43;|oc[ms]-provider\/.&#43;|.&#43;\/richdocumentscode\/proxy) /index.php$request_uri;

        fastcgi_split_path_info ^(.&#43;?\.php)(/.*)$;
        set $path_info $fastcgi_path_info;

        try_files $fastcgi_script_name =404;

        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $path_info;

        fastcgi_param modHeadersAvailable true;         # Avoid sending the security headers twice
        fastcgi_param front_controller_active true;     # Enable pretty urls
        fastcgi_pass php-handler;

        fastcgi_intercept_errors on;
        fastcgi_request_buffering off;

        fastcgi_max_temp_file_size 0;
    }

    # Rule borrowed from `.htaccess`
    location /remote {
        return 301 /remote.php$request_uri;
    }

    location / {
        try_files $uri $uri/ /index.php$request_uri;
    }

    set $jellyfin 127.0.0.1;
    location /video {
        # Proxy main Jellyfin traffic
	rewrite ^/video/(.*)$ /$1 break;
        proxy_pass http://$jellyfin:8096;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;

        # Disable buffering when the nginx proxy gets very resource heavy upon streaming
        proxy_buffering off;
    }

    # location block for /web - This is purely for aesthetics so /web/#!/ works instead of having to go to /web/index.html/#!/
    location = /video/web/ {
        # Proxy main Jellyfin traffic
        proxy_pass http://$jellyfin:8096/web/index.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
    }

}

```
- 生效服务
```bash
sudo service nginx restart
sudo service php8.1-fpm restart
```


### 请更改权限为 0770 以避免其他用户查看目录

config.php

```bash
.
&#39;check_data_directory_permissions&#39; =&gt; false,
...
```

### 安装配置启动aria2

- #### 安装aria2

```bash
sudo apt install aria2
cd /etc/ &amp;&amp; mkdir aria2 &amp;&amp; cd aria2 &amp;&amp; touch aria2c.conf &amp;&amp; touch aria2.session
```

- #### 创建配置文件

```bash
#aria2c.conf
## 文件保存相关 ##

# 文件保存目录
dir=/var/www/nextcloud/data/nextcloud/files/Video
# 启用磁盘缓存, 0为禁用缓存, 需1.16以上版本, 默认:16M
disk-cache=32M
# 断点续传
continue=true

# 文件预分配方式, 能有效降低磁盘碎片, 默认:prealloc
# 预分配所需时间: none &lt; falloc ? trunc &lt; prealloc
# falloc和trunc则需要文件系统和内核支持
# NTFS建议使用falloc, EXT3/4建议trunc, MAC 下需要注释此项
file-allocation=trunc

## 下载连接相关 ##

# 最大同时下载任务数, 运行时可修改, 默认:5
#max-concurrent-downloads=10
# 同一服务器连接数, 添加时可指定, 默认:1
# 官方的aria2最高设置为16, 如果需要设置任意数值请重新编译aria2
max-connection-per-server=16
# 整体下载速度限制, 运行时可修改, 默认:0（不限制）
#max-overall-download-limit=0
# 单个任务下载速度限制, 默认:0（不限制）
#max-download-limit=0
# 整体上传速度限制, 运行时可修改, 默认:0（不限制）
#max-overall-upload-limit=0
# 单个任务上传速度限制, 默认:0（不限制）
#max-upload-limit=0
# 禁用IPv6, 默认:false
# disable-ipv6=true

# 最小文件分片大小, 添加时可指定, 取值范围1M -1024M, 默认:20M
# 假定size=10M, 文件为20MiB 则使用两个来源下载; 文件为15MiB 则使用一个来源下载
min-split-size=10M
# 单个任务最大线程数, 添加时可指定, 默认:5
# 建议同max-connection-per-server设置为相同值
split=16

## 进度保存相关 ##

# 从会话文件中读取下载任务
input-file=/etc/aria2/aria2.session
# 在Aria2退出时保存错误的、未完成的下载任务到会话文件
save-session=/etc/aria2/aria2.session
# 定时保存会话, 0为退出时才保存, 需1.16.1以上版本, 默认:0
save-session-interval=60

## RPC相关设置 ##

# 启用RPC, 默认:false
enable-rpc=true
# 允许所有来源, 默认:false
rpc-allow-origin-all=true
# 允许外部访问, 默认:false
rpc-listen-all=true
# RPC端口, 仅当默认端口被占用时修改
# rpc-listen-port=6800
# 设置的RPC授权令牌, v1.18.4新增功能, 取代 --rpc-user 和 --rpc-passwd 选项
rpc-secret=passwd #在访问的时候要使用到的密码
# 启动SSL
#rpc-secure=true
# 证书文件, 如果启用SSL则需要配置证书文件, 例如用https连接aria2
#rpc-certificate=/var/snap/nextcloud/current/certs/live/fullchain.pem
#rpc-private-key=/var/snap/nextcloud/current/certs/live/privkey.pem

## BT/PT下载相关 ##

# 当下载的是一个种子(以.torrent结尾)时, 自动开始BT任务, 默认:true
follow-torrent=true
# 客户端伪装, PT需要
peer-id-prefix=-TR2770-
user-agent=Transmission/2.77
# 强制保存会话, 即使任务已经完成, 默认:false
# 较新的版本开启后会在任务完成后依然保留.aria2文件
#force-save=false
# 继续之前的BT任务时, 无需再次校验, 默认:false
bt-seed-unverified=true
# 保存磁力链接元数据为种子文件(.torrent文件), 默认:false
# bt-save-metadata=true
# 单个种子最大连接数, 默认:55 0表示不限制
bt-max-peers=0
# 最小做种时间, 单位:分
seed-time = 1
# 分离做种任务
bt-detach-seed-only=true
on-download-complete=/home/filesscan.sh
```

- #### 启动aria2

```bash
nohup aria2c --conf-path=/etc/aria2/aria2.conf &gt; /home/linux/aria2.log 2&gt;&amp;1 &amp;
```


- #### 配置aria2 自动更新bt tracker

```bash
# startaria.sh
while(true)
do
sudo kill -9 $(ps -ef|grep aria2|gawk &#39;$0 !~/grep/ {print $2}&#39; |tr -s &#39;\n&#39; &#39; &#39;)
list=`wget -qO- https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt|awk NF|sed &#34;:a;N;s/\n/,/g;ta&#34;`
echo $list
if [ -z &#34;`grep &#34;bt-tracker&#34; /etc/aria2/aria2.conf`&#34; ]; then
   sudo sed -i &#39;$a bt-tracker=&#39;${list}  /etc/aria2/aria2.conf
   echo add......
else
    sudo sed -i &#34;s@bt-tracker.*@bt-tracker=$list@g&#34; /etc/aria2/aria2.conf
    echo update......
fi
sudo aria2c --conf-path=/etc/aria2/aria2.conf
sleep 24h
#sleep 10
done
```
- #### 配置nextcloud启动脚本

```bash
# startserver.sh
sudo service apache2 stop
sudo service apache2 start
sudo /etc/init.d/mysql start
# 运行aria2脚本更新bt trackers
sudo nohup bash startaria.sh &gt; /home/linux/log/aria2.log 2&gt;&amp;1 &amp;
# 监控文件变化
while(true)
do
        sudo -u www-data php /var/www/nextcloud/occ files:scan --all
        sleep 60
done
```
```bash
# runserver.sh
# 删除aria相关的程序
sudo kill -9 $(ps -ef|grep startserver|gawk &#39;$0 !~/grep/ {print $2}&#39; |tr -s &#39;\n&#39; &#39; &#39;)
sudo kill -9 $(ps -ef|grep startaria|gawk &#39;$0 !~/grep/ {print $2}&#39; |tr -s &#39;\n&#39; &#39; &#39;)
sudo kill -9 $(ps -ef|grep aria2|gawk &#39;$0 !~/grep/ {print $2}&#39; |tr -s &#39;\n&#39; &#39; &#39;)
sudo nohup bash startserver.sh &gt; /home/linux/log/nextcloud.log 2&gt;&amp;1 &amp;
```

- #### 配置aria2NG

```bash
# 下载aria2ng
cd /var/www/
wget https://github.com/mayswind/AriaNg/releases/download/1.2.3/AriaNg-1.2.3.zip
mkdir ariang
unzip AriaNg-1.2.3.zip
```
- #### 配置apache2网页

```bash
# 创建/etc/apache2/sites-available/ariang.conf
```
```html
Alias /ariang &#34;/var/www/ariang/&#34;

&lt;Directory /var/www/ariang/&#34;&gt;
  Require all granted
  AllowOverride All
  Options FollowSymLinks MultiViews

  &lt;IfModule mod_dav.c&gt;
    Dav off
  &lt;/IfModule&gt;
&lt;/Directory&gt;
```

```bash
# 访问http://host.example.com/ariang
```

![image-20211213104533533](https://cdn.jsdelivr.net/gh/SivanLaai/image-store-rep@master/note/image-20211213104533533.png)

### Nextcloud镜像安装
- 创建文件夹```nextcloud```
```
mkdir nextcloud
```
- 创建文件```docker-compose.yml```
```yaml
---
version: &#39;2&#39;

volumes:
  nextcloud:
  db:

services:
  db:
    image: mariadb
    restart: always
    command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW
    volumes:
      - db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_PASSWORD=passwd
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud

  app:
    image: nextcloud
    restart: always
    ports:
      - 8080:80
    links:
      - db
    volumes:
      - nextcloud:/var/www/html
    environment:
      - MYSQL_PASSWORD=passwd
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_HOST=db

```
- 启动镜像
```
sudo docker-compose up -d
```

# 常见问题
- ### apache2解析失败php
	- 重新安装php
	```
	sudo apt-get purge php8.*
	sudo apt install php
	```
- ### apache2提示找不到```apache.conf```
	- 重新安装apache2
```
sudo dpkg -P apache2
apt-get remove apache2
apt-get install apache2
```

---

> 作者:   
> URL: https://deembear.top/posts/technology/nextcloud/  

