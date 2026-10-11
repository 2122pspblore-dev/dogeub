#!/bin/sh
set -eu

# Railway mounts persistent volumes as root-owned. Give the application user
# ownership before starting, then drop privileges for the Node process.
data_dir="${DOGEUB_DATA_DIR:-${RAILWAY_VOLUME_MOUNT_PATH:-/tmp/dogeub-messages}}"
mkdir -p "$data_dir"
chown -R node:node "$data_dir"

exec su -s /bin/sh node -c 'exec node /app/server.js'
