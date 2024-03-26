#!/bin/bash
DEFAULT_DURATION=$((5*60)) # 5 minutes

if [[ -f .env.local ]]; then
    source .env.local
else
    echo "Error: .env.local file not found"
    exit 1
fi

STREAM_QUALITY=stream1 # High
# STREAM_QUALITY=stream2 # Low
RTSP_URL="rtsp://$TAPO_USERNAME:$TAPO_PASSWORD!@$TAPO_REMOTE_IP:$TAPO_REMOTE_PORT/$STREAM_QUALITY"

generate_output_file_name() {
    date +"%Y_%m_%d_%H_%M_%S.mp4"
}

generate_log_file_name() {
    date +"%Y_%m_%d_%H_%M_%S.log"
}

# Output file name
OUTPUT_FILE=$(generate_output_file_name)


start_stream() {
    OUTPUT_FILE=$(generate_output_file_name)
    LOG_FILE=$(generate_log_file_name)
    nohup ffmpeg -i "$RTSP_URL" -c:v copy -an -f mp4 "$OUTPUT_FILE" >"$LOG_FILE" 2>&1 &
    PID=$! # Save the PID of the ffmpeg process
    echo "Stream started with PID: $PID for $DURATION seconds. Log: $LOG_FILE"
    echo "$PID" > /tmp/ffmpeg_pid  # Save PID to a temporary file
    
    # Start a background process to stop the stream after the specified duration
    (sleep "$DURATION"; ./stream_control.sh stop >/dev/null 2>&1) &
}


# Function to stop capturing the RTSP stream
stop_stream() {
    if [ -f /tmp/ffmpeg_pid ]; then
        PID=$(cat /tmp/ffmpeg_pid)
        kill $PID
        rm /tmp/ffmpeg_pid  # Remove the temporary file
        echo "Stream stopped (PID $PID)" >> "$LOG_FILE"
    else
        echo "Stream is not running"
    fi
}

killall() {
    pkill ffmpeg
}

# Main script
case "$1" in
    start)
        DURATION=${2:-$DEFAULT_DURATION} # Set duration to provided value or default
        start_stream
        ;;
    stop)
        stop_stream
        ;;
    killall)
        killall
        ;;
    check_duration)
        check_file_duration
        ;;
    *)
        echo "Usage: $0 {start|stop|check_duration}"
        exit 1
        ;;
esac

