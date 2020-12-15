#!/bin/bash

cat > ~/.python-gitlab.cfg << EOM
[global]
default = gitlab
ssl_verify = true
timeout = 5

[gitlab]
url = $CI_SERVER_URL
private_token = $GITLAB_ACCESS_TOKEN
api_version = 4
EOM