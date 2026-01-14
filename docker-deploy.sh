#!/usr/bin/env bash

apps=( api socket-io )
for app in "${apps[@]}"
do
  ssh root@46.41.140.61 -- "cd signalbot-system && docker-compose pull signalbot-${app} && docker-compose up -d signalbot-${app}"
done
