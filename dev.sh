#!/bin/bash
docker compose -f compose.yaml -f compose.dev.yaml --env-file .env.dev "$@"