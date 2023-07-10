#!/bin/bash -e
docker-compose build xemproxy-dev
docker-compose run --rm --service-ports xemproxy-dev
