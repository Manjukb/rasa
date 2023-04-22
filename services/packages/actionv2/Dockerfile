FROM goavega/nodex:fermium
ENV APP_DIR /var/www/
ENV BUILD_DIR /home/www/
WORKDIR ${BUILD_DIR}
RUN set -ex && \
    apk add --no-cache --virtual build-deps alpine-sdk python
COPY ./services/packages/actionv2/ ${BUILD_DIR}/packages/actionv2/
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
    yarn workspace actionv2 run build && \
    cp -r ./packages/actionv2/dist/ ${APP_DIR} && \
    rm -rf ./node_modules/@negobot/shared && \
    cp -r ./node_modules ${APP_DIR} && \
    cp ./ormconfig.js ${APP_DIR} && \
    cp ./newrelic.js ${APP_DIR}
WORKDIR ${BUILD_DIR}packages
RUN set -ex && \
    mkdir ${APP_DIR}node_modules/@negobot/shared && \
    cp -r ./shared/dist/* ${APP_DIR}node_modules/@negobot/shared/
RUN set -ex && \
    echo "fixing supervisor start script" && \
    sed -i -e "s,index.js,dist/server.js,g" ${SUPERVISOR_CONF_FILE} && \
    echo "fixing nginx conf" && \
    sed -i -e "s,/var/www/;,/var/www/public/;,g" /etc/nginx/conf.d/default.conf && \
    sed -i -e "s,localhost:3000,localhost:4201,g" /etc/nginx/conf.d/default.conf && \
    echo "removing build files" && \
    rm -rf /home/www/ && \
    echo "all done."
