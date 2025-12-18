#!/bin/bash

# Disk Space Monitoring Script for macOS
# Alerts when free disk space goes below a threshold

THRESHOLD=20   # threshold in percentage

# Get used disk percentage for root filesystem
USED_PERCENT=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

FREE_PERCENT=$((100 - USED_PERCENT))

echo "Disk usage: ${USED_PERCENT}%"
echo "Free space: ${FREE_PERCENT}%"

if [[ $FREE_PERCENT -lt $THRESHOLD ]]
then
    echo "⚠️ Low Disk Space: Only ${FREE_PERCENT}% free"
    exit 1
else
    echo "✅ Disk space is sufficient"
    exit 0
fi

