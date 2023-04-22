FROM goavega/nodex:fermium
ENV APP_DIR /var/www/
ENV BUILD_DIR /home/www/
WORKDIR ${BUILD_DIR}
RUN set -ex && \
    apk add --no-cache --virtual build-deps alpine-sdk python
COPY ./services/packages/jobs/ ${BUILD_DIR}/packages/jobs/
COPY ./services/packages/shared/ ${BUILD_DIR}/packages/shared/
COPY ./services/*.json ${BUILD_DIR}
COPY ./services/*.js ${BUILD_DIR}
COPY ./services/yarn.lock ${BUILD_DIR}
WORKDIR ${BUILD_DIR}
RUN set -ex && \
    rm -rf ./packages/shared/dist/ && \
    echo "setting up server..." && \
    yarn install && \
    yarn workspace @negobot/shared run build && \
    yarn workspace jobs run build && \
    cp -r ./packages/jobs/dist/ ${APP_DIR} && \
    rm -rf ./node_modules/@negobot/shared && \
    cp -r ./node_modules ${APP_DIR} && \
    cp ./ormconfig.js ${APP_DIR} && \
    cp ./newrelic.js ${APP_DIR}
WORKDIR ${BUILD_DIR}packages
RUN set -ex && \
    mkdir ${APP_DIR}node_modules/@negobot/shared && \
    cp -r ./shared/dist/* ${APP_DIR}node_modules/@negobot/shared/
COPY ./services/packages/jobs/dockersupport/start.sh /usr/local/bin/
RUN chmod u+x /usr/local/bin/start.sh
