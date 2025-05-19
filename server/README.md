# Tapo

## Docker

```
docker build -t tapo-image . --no-cache
docker run -p 3057:3057 -p 9999:9999 tapo-image
```

```
# In Terminal
docker run -v /root/recordings:/usr/src/app/recordings --restart=on-failure -p 3057:3057 -p 9999:9999 tapo-image
# Detached
docker run -d -v /root/recordings:/usr/src/app/recordings --restart=on-failure -p 3057:3057 -p 9999:9999 tapo-image
```

- no: This is the default value. It means that Docker will not automatically restart the container. You need to manually restart it if it exits.
- always: Docker will always restart the container regardless of the exit status.
- on-failure: Docker will only restart the container if it exits with a non-zero exit status.
- unless-stopped: Docker will always restart the container unless it is explicitly stopped by the user.

```
docker ps # get container id
docker stop <id>
```

## Local test

Make sure `.env.local` is correctly set up

### ffprobe
```
brew install ffmpeg
```

On the same WLAN

```
ffprobe -show_error -i 'rtsp://<TAPO_USERNAME>:<TAPO_PASSWORD>@<TAPO_LOCAL_IP>:554/stream1' -loglevel debug
```

Example:
```
ffprobe -show_error -i 'rtsp://Jpec57:LightweightBaby!@192.168.86.36:554/stream1' -loglevel debug
ffprobe -show_error -i 'rtsp://Jpec91:LightweightBaby!@192.168.86.49:554/stream1' -loglevel debug
```

### View 
```
pnpm dev
```

## Url

For high quality stream1: rtsp://IP Address/stream1
For low quality stream2: rtsp:// IP Address/stream2

Note: when the connection is secured you should use:
RTSP_URL="rtsp://<tapo_username>:<tapo_password>@<ip_address>/stream1"

The IP Address is available in the advanced settings of Tapo

## View it remotely

> If you want to view the live stream of the Tapo camera with a third-party app remotely, you will need to open port 554 for the camera on your host router first. Please enable the TCP forwarding for port 554.

In Google Home,

Paramètres réseau avancés > Paramètres avancés > Paramètre WAN
=> IP du WAN 192.168.1.51

RTSP_URL="rtsp://<username>:<password>@<ip_address>:554/stream1"

NB: default port is 554 but could be configured during the port forwarding done on the app (for simplicity, I have use extern 554 -> 554 intern on Tapo)

### Get the remote IP

Go on the same wifi and go to `https://www.whatismyip.com/`

### Port forwarding (orange)

Go to http://192.168.1.1/
Network > NAT/PAT 

> Port address translation (PAT) is a type of network address translation (NAT) that maps a network's private internal IPv4 addresses to a single public IP address.

FTP Server	554	554	TCP/UDP	Device-9	Toutes

Where device-9 is the google wifi router in the dhcp section
with its own ip address (Baux DHCP statiques)
Device-9	192.168.1.51



## Kill all process (and be sure about it)

```
pkill ffmpeg
```

chmod +x stream_control.sh

## ffprob

Allow RTSP Traffic:

```
sudo iptables -A INPUT -p tcp --dport 554 -j ACCEPT
sudo iptables-save
```

Verify changes

```
sudo iptables -L
```

```
ffmpeg -i 'rtsp://Jpec57:LightweightBaby!@83.112.33.9:554/stream1' -f null -
```

# Wss

To use wss instead of ws on tls connection (https), we have to add the two "/websocket" blocks in nginx

```
server {
    listen 80;
    server_name tapo.enter-train-me.fr;

    location / {
        proxy_pass http://147.93.63.253:3057;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /websocket {
        proxy_pass http://147.93.63.253:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name tapo.enter-train-me.fr;

    ssl_certificate /etc/ssl/certs/cloudflare.crt;
    ssl_certificate_key /etc/ssl/private/cloudflare.key;

    location / {
        proxy_pass http://147.93.63.253:3057;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /websocket {
        proxy_pass http://147.93.63.253:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
```

We can now access it via

```
    player = new JSMpeg.Player('wss://tapo.enter-train-me.fr/websocket', {
      canvas: document.getElementById('canvas'), // Canvas should be a canvas DOM element
    })
```
