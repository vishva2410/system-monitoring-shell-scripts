#!/bin/bash

# Get free memory pages
free_pages=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')

# Convert pages to MB (macOS page size = 4096 bytes)
free_mb=$(( free_pages * 4096 / 1024 / 1024 ))

threshold=500   # threshold in MB

if [[ $free_mb -lt $threshold ]]
then
    echo " Low RAM: ${free_mb} MB free"
else
    echo " RAM is sufficient: ${free_mb} MB free"
fi

