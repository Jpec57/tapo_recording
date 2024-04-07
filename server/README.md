# Tapo

```
docker build -t tapo-base -f BaseDockerfile .
docker build -t tapo-image . --no-cache
```



## Docker

```
docker build -t tapo-image . 
docker build -t tapo-image . --no-cache
```

```
docker run -p 3057:3057 tapo-image
```

```
# In Terminal
docker run -v /home/jpec/recordings:/usr/src/app/recordings --restart=on-failure -p 3057:3057 tapo-image
# Detached 
docker run -d -v /home/jpec/recordings:/usr/src/app/recordings --restart=on-failure -p 3057:3057 tapo-image
```

- no: This is the default value. It means that Docker will not automatically restart the container. You need to manually restart it if it exits.
- always: Docker will always restart the container regardless of the exit status.
- on-failure: Docker will only restart the container if it exits with a non-zero exit status.
- unless-stopped: Docker will always restart the container unless it is explicitly stopped by the user.



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


## ffprob

```
ffprobe -show_error -i 'rtsp://Jpec57:LightweightBaby!@192.168.1.51:554/stream1' -loglevel debug
```

```
[tcp @ 0x14be3b080] No default whitelist set
[tcp @ 0x14be3b080] Original list of addresses:
[tcp @ 0x14be3b080] Address 192.168.1.51 port 554
[tcp @ 0x14be3b080] Interleaved list of addresses:
[tcp @ 0x14be3b080] Address 192.168.1.51 port 554
[tcp @ 0x14be3b080] Starting connection attempt to 192.168.1.51 port 554
[tcp @ 0x14be3b080] Successfully connected to 192.168.1.51 port 554
[rtsp @ 0x14be35bf0] SDP:
v=0
o=- 14665860 31787219 1 IN IP4 192.168.86.36
s=Session streamed by "TP-LINK RTSP Server"
i=stream2
t=0 0
a=tool:TP-LINK Streaming Media v2015.05.12
a=type:broadcast
a=control:*
a=x-qt-text-nam:Session streamed by "TP-LINK RTSP Server"
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:4096
a=range:npt=0-
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1; profile-level-id=4D0032; sprop-parameter-sets=J00AMudAKALdNQEBAfAAAAMAEAAAAwHjeQPoBd3//Ao=,KO48gA==
a=control:track1
m=audio 0 RTP/AVP 8
a=rtpmap:8 PCMA/8000
c=IN IP4 0.0.0.0
b=AS:64
a=control:track2

Failed to parse interval end specification ''
[rtsp @ 0x14be35bf0] video codec set to: h264
[rtsp @ 0x14be35bf0] RTP Packetization Mode: 1
[rtsp @ 0x14be35bf0] RTP Profile IDC: 4d Profile IOP: 0 Level: 32
[rtsp @ 0x14be35bf0] Extradata set to 0x14c806150 (size: 44)
[rtsp @ 0x14be35bf0] audio codec set to: pcm_alaw
[rtsp @ 0x14be35bf0] audio samplerate set to: 8000
[rtsp @ 0x14be35bf0] audio channels set to: 1
[rtp @ 0x14c806620] No default whitelist set
[udp @ 0x14bf04080] No default whitelist set
[udp @ 0x14bf04080] end receive buffer size reported is 393216
[udp @ 0x14bf04120] No default whitelist set
[udp @ 0x14bf04120] end receive buffer size reported is 393216
[rtsp @ 0x14be35bf0] setting jitter buffer size to 500
[rtp @ 0x14c8070f0] No default whitelist set
[udp @ 0x14c8077e0] No default whitelist set
[udp @ 0x14c8077e0] end receive buffer size reported is 393216
[udp @ 0x14c807880] No default whitelist set
[udp @ 0x14c807880] end receive buffer size reported is 393216
[rtsp @ 0x14be35bf0] setting jitter buffer size to 500
[rtsp @ 0x14be35bf0] hello state=0
Failed to parse interval end specification ''
[h264 @ 0x14c806270] nal_unit_type: 7(SPS), nal_ref_idc: 1
[h264 @ 0x14c806270] nal_unit_type: 8(PPS), nal_ref_idc: 1
[h264 @ 0x14c806270] Decoding VUI
[h264 @ 0x14c806270] nal_unit_type: 7(SPS), nal_ref_idc: 1
[h264 @ 0x14c806270] nal_unit_type: 8(PPS), nal_ref_idc: 1
[h264 @ 0x14c806270] Decoding VUI
    Last message repeated 1 times
[h264 @ 0x14c806270] nal_unit_type: 7(SPS), nal_ref_idc: 1
[h264 @ 0x14c806270] nal_unit_type: 8(PPS), nal_ref_idc: 1
[h264 @ 0x14c806270] nal_unit_type: 5(IDR), nal_ref_idc: 1
[h264 @ 0x14c806270] Decoding VUI
[h264 @ 0x14c806270] Format yuv420p chosen by get_format().
[h264 @ 0x14c806270] Reinit context to 1280x720, pix_fmt: yuv420p
[h264 @ 0x14c806270] nal_unit_type: 1(Coded slice of a non-IDR picture), nal_ref_idc: 1
    Last message repeated 5 times
[rtsp @ 0x14be35bf0] first_dts 37980 not matching first dts NOPTS (pts NOPTS, duration 6000) in the queue
[rtsp @ 0x14be35bf0] All info found
[rtsp @ 0x14be35bf0] rfps: 16.333333 0.017191
[rtsp @ 0x14be35bf0] rfps: 16.416667 0.009792
    Last message repeated 1 times
[rtsp @ 0x14be35bf0] rfps: 16.500000 0.004479
    Last message repeated 1 times
[rtsp @ 0x14be35bf0] rfps: 16.583333 0.001253
    Last message repeated 1 times
[rtsp @ 0x14be35bf0] rfps: 16.666667 0.000114
[rtsp @ 0x14be35bf0] rfps: 16.750000 0.001061
    Last message repeated 1 times
[rtsp @ 0x14be35bf0] rfps: 16.833333 0.004094
    Last message repeated 1 times
[rtsp @ 0x14be35bf0] rfps: 16.916667 0.009214
    Last message repeated 1 times
[rtsp @ 0x14be35bf0] rfps: 17.000000 0.016420
[rtsp @ 0x14be35bf0] rfps: 33.000000 0.017918
[rtsp @ 0x14be35bf0] rfps: 50.000000 0.001025
```

Allow RTSP Traffic:



```
sudo iptables -A INPUT -p tcp --dport 554 -j ACCEPT
sudo iptables-save
```

Verify changes

```
sudo iptables -L
```
