#!/bin/bash
export SERVICE="auth"
if [ -z "$1" ]; then
    echo "use ${ENV}"
else
    export ENV=$1
fi

if [ "${ENV}" = "localhost-dev" ]; then
    export ENVIRONMENT_VARS="localhost-dev.postman_environment.json"
fi
if [ "${ENV}" = "localhost-stg" ]; then
    export ENVIRONMENT_VARS="api.negobot.co.postman_environment.json"
fi

DIR="$( cd "$( dirname "${BASH_SOURCE}")" >/dev/null 2>&1 && pwd )"
echo ${DIR}
if [ "$DIR" = "/home/circleci/project" ]; then 
    DIR="/home/circleci/project/services/api-test"
fi 
DIR='/app'
while ! nc -z auth-service 5900; do   
  sleep 15 
  echo "wait for 5900"
done 
echo "count 3"
sleep 3
echo "count 2"
sleep 3
echo "count 1"
newman run ${DIR}/collections/${SERVICE}.test.postman_collection.json --environment ${DIR}/collections/${ENVIRONMENT_VARS}