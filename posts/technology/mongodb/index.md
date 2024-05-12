# Mongodb总结

# Mongodb安装
#### （1）导入公匙
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
```
#### （2）创建mongodb列表文件
```bash
echo &#34;deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/5.0 multiverse&#34; | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
```
#### （3）重新加载包数据
```bash
sudo apt-get update
```
#### （4）重新加载包数据
```bash
sudo apt-get install -y mongodb-org=5.0.2 mongodb-org-database=5.0.2 mongodb-org-server=5.0.2 mongodb-org-shell=5.0.2 mongodb-org-mongos=5.0.2 mongodb-org-tools=5.0.2
```
#### （5）服务启动
```bash
sudo systemctl start mongod
```

# Mongodb配置修改
#### （1）打开配置
```
sudo vim /etc/mongod.conf
```
#### （2）修改配置
```bash
# mongod.conf

# for documentation of all options, see:
#   http://docs.mongodb.org/manual/reference/configuration-options/

# Where and how to store data.
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
#  engine:
#  wiredTiger:

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# network interfaces
net:
  port: 10095
  bindIp: 0.0.0.0


# how the process runs
processManagement:
  timeZoneInfo: /usr/share/zoneinfo
  
# 登录是否需要密码
#security:
#  authorization: enabled
#operationProfiling:

#replication:

#sharding:

## Enterprise-Only Options:


```
# Mongodb添加用户
#### （1）连接Mongodb
```bash
mongo mongodb://127.0.0.1:10095
```
#### （2）创建普通用户
```bash
use Production
db.createUser(
   {
     user: &#34;production&#34;,
     pwd: &#34;production@123&#34;,  // passwordPrompt() Or  &#34;&lt;cleartext password&gt;&#34;
     roles: [ &#34;readWrite&#34;, &#34;dbAdmin&#34; ]
   }
)
```
#### （3）创建超级用户
```bash
use admin
db.createUser(
   {
     user: &#34;mongoAdmin&#34;,
     pwd: passwordPrompt(),  // passwordPrompt() Or  &#34;&lt;cleartext password&gt;&#34;
     roles: [ &#34;readWriteAnyDatabase&#34;, &#34;userAdminAnyDatabase&#34;, &#34;dbAdminAnyDatabase&#34;]
   }
)
```
#### （4）登录
```bash
db.auth(&#34;production&#34;)
```
# Mongodb更新用户权限
#### （1）连接Mongodb
```bash
mongo mongodb://127.0.0.1:10095
```
#### （2）更新用户权限
```bash
use Production
# 更新用户权限
db.updateUser(&#34;production&#34;,{roles : [{&#34;role&#34; : &#34;readWriteAnyDatabase&#34;,&#34;db&#34; : &#34;Stock&#34;},{&#34;role&#34; : &#34;dbAdminAnyDatabase&#34;,&#34;db&#34; : &#34;Stock&#34;}]})
readWriteAnyDatabase
```

---

> 作者:   
> URL: https://deembear.top/posts/technology/mongodb/  

