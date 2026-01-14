#!/usr/bin/env bash
paths=( api auth bthub socket-io swagger)

docker build . -t "ssb-backend"

for app in "${paths[@]}"
do
  cd "./apps/${app}"
  docker build . -t "ssb-backend-${app}"
  cd -
done
