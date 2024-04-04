# Tapo

## Docker

```
docker build -t tapo-image . 
docker build -t tapo-image . --no-cache
```

```
docker run -p 3057:3057 tapo-image
```

```
docker ps # get container id
docker stop <id>
```



## Url

For high quality stream1: rtsp://IP Address/stream1
For low quality stream2: rtsp:// IP Address/stream2

Note: when the connection is secured you should use:
RTSP_URL="rtsp://<username>:<password>@<ip_address>/stream1"

The IP Address is available in the advanced settings of Tapo

## View it remotely

> If you want to view the live stream of the Tapo camera with a third-party app remotely, you will need to open port 554 for the camera on your host router first. Please enable the TCP forwarding for port 554.

In Google Home,

Paramètres réseau avancés > Paramètres avancés > Paramètre WAN
=> IP du WAN 192.168.1.51

RTSP_URL="rtsp://<username>:<password>@<ip_address>:554/stream1"

NB: default port is 554 but could be configured during the port forwarding done on the app (for simplicity, I have use extern 554 -> 554 intern on Tapo)


## Kill all process (and be sure about it)

```
pkill ffmpeg
```


chmod +x stream_control.sh

