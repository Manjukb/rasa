#!/bin/sh
echo 'INFO: starting node'
set -ex && cd /var/www/ && node dist/server.js
echo 'INFO: Nothing to see here, move along'