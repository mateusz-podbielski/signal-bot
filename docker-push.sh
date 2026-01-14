#!/usr/bin/env bash

apps=( api socket-io )
for app in "${apps[@]}"
do
  docker tag "signalbot-backend-${app}" "ghcr.io/telemedis/signalbot-backend-${app}:latest"
  docker push "ghcr.io/telemedis/signalbot-backend-${app}:latest"
done

