# Ubuntu安装VNCServer



### Step1 （安装GNOME桌面）
```bash
sudo apt-get update 
sudo apt-get install gnome-session-flashback 
sudo apt-get install ubuntu-desktop gnome-panel gnome-settings-daemon metacity nautilus gnome-terminal -y
```

### Step2
```bash
sudo apt-get -y install xfonts-100dpi xfonts-100dpi-transcoded xfonts-75dpi xfonts-75dpi-transcoded xfonts-base
```
### Step3
```bash
sudo apt install tigervnc-standalone-server
```
### Step4：配置密码
```bash
vncpasswd
```
### Step5：配置XStartup
```bash
vim ~/.vnc/xstartup
```
内容如下：
```bash
#!/bin/sh
# Start Gnome 3 Desktop
[ -x /etc/vnc/xstartup ] &amp;&amp; exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] &amp;&amp; xrdb $HOME/.Xresources
vncconfig -iconic &amp;
dbus-launch --exit-with-session gnome-session &amp;
```

### Step6:重启TigerVNC
```bash
tightvncserver -kill :1 
vncserver -depth 24 -name mydesktop -localhost no :1
```


---

> 作者:   
> URL: https://deembear.top/posts/technology/vnc_server/  
