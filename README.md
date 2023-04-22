## install
- install latest docker ce, docker-compose
- postman
- node 10.x

# Repository uses Yarn workspaces for node

* All shared code is in shared folder (for now even connection is getting created there - which seems to be a bug and will fix later). 
* Any new entity needs to be added in createConnection() method of shared/bootstrap.ts
* All packages are currently hoisted
* Running requires following command to be run from services folder:
* Locally keep the env file within packages folder - this will ensure all packages read the env.
* All modules from shared package have to be exported again in shared/src/index.ts for them to be imported cleanly

```shell
$ yarn workspace <workspacename> <command>
```

For e.g.
```shell
$ yarn workspace datav2 build|serve

## project structure:

/services/packages: Negobot follows yarn workspaces to share the packages.
# Run ORM migrations (all commands in /services folder and using git bash):
Update .env with correct database credentials in /services/packages

Build Shared first (cd /services/packages/shared). This is generally only required first time.
```shell
$ yarn run build --Build first (cd ../services)
$ yarn workspace datav2 build
Now run migrations
$ yarn workspace datav2 migrations:show
$ yarn workspace datav2 migrations:run
```

# Generating a migration
here 0.2.35 is the version of typeORM that is being used in package.json of Datav2
```shell
$ cd packages/shared/src/database/migrations
$ npx typeorm@0.2.35 migration:create -n NameOfMigration
```

** Sometimes migrations just fail in between depending on how far away you are from the current tip - re-running the migrations generally fixes it.

# Running the Services:
##   Datav2
```shell
$ cd ./services
$ export PORT=4201
$ yarn workspace datav2 watch
```
* What port to run service on can be found out using k8s ingress file
# HELM install on k8s

REDIS on k8s
install

helm install redis stable/redis

To get your password run:

    export REDIS_PASSWORD=$(kubectl get secret --namespace default redis -o jsonpath="{.data.redis-password}" | base64 --decode)

To connect to your Redis server:

1. Run a Redis pod that you can use as a client:

   kubectl run --namespace default redis-client --rm --tty -i --restart='Never' \
    --env REDIS_PASSWORD=$REDIS_PASSWORD \
   --image docker.io/bitnami/redis:5.0.7-debian-9-r12 -- bash

2. Connect using the Redis CLI:
   redis-cli -h redis-master -a $REDIS_PASSWORD
   redis-cli -h redis-slave -a $REDIS_PASSWORD

To connect to your database from outside the cluster execute the following commands:

    kubectl port-forward --namespace default svc/redis-master 6379:6379 & redis-cli -h 127.0.0.1 -p 6379 -a $REDIS_PASSWORD

kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v0.12.0/cert-manager.yaml

# Local setup
* In every virtual env you have to install the negobot shared package.
```shell
$ python -m venv <<path-to-venv>> #activate the env
$ pip install -e negobot #in the root directory for each venv
$ cd services/<service-1>
$ pip install -r requirements.txt #do it for all services
$ ./run_service.sh #or the equivalent ps1 files if you are on windows
```
* Once the services are running, and if you want to debug it end to end. You would need ways to proxy Twilio chat to local

```shell
$  npx ngrok http 5005
```
take the ngrok url and set it as webhook in respective Twilio chat


# create GKE cluster 
# create Namespace
`kubectl create ns  nsname`

install https://k8slens.dev/ which helps in managing pods and secret's

# create Env as all .yml expects
`set ENV=prod/dev/staging`

# Execute all below cmds 
`kubectl  create negobot-secret.yml`
`kubectl create -f actionv2-deployment.yaml`
`kubectl create -f actionv2-service.yaml`
`kubectl create -f authv2-deployment.yaml`
`kubectl create -f authv2-service.yam`
`kubectl create -f datav2-deployment.yaml`
`kubectl create -f datav2-service.yaml`
`kubectl create -f jobs.yaml`
`kubectl create -f uat-ingress.yaml`

# netlyfy Ip map
we need to map ip with hostname using  netlyfy

`kubectl create -f certificate.yaml`
`kubectl create -f ssl-issuer.yaml`



