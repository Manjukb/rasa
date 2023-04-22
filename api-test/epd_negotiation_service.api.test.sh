#!/bin/bash
export SERVICE="epd_negotiation_service"
if [ -z "$1" ]; then
    echo "use ${ENV}"
else
    export ENV=$1
fi

if [ "${ENV}" = "dev" ]; then
    export ENVIRONMENT_VARS="api-dev.negobot.co.postman_environment.json"
fi
if [ "${ENV}" = "stg" ]; then
    export ENVIRONMENT_VARS="api.negobot.co.postman_environment.json"
fi
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "SERVICE ${SERVICE}, ENVIRONMENT VAR ${ENVIRONMENT_VARS}"
newman run ${DIR}/collections/${SERVICE}.test.postman_collection.json --environment ${DIR}/collections/${ENVIRONMENT_VARS}