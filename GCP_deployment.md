## ---------------------------------- CODE DEPLOYMENT SETUP ON GCP -------------------------------
- Take this as a general idea to deploy the code into GCP, create project specific names and variables.

    Create a project on GCP and required service accounts.
    https://cloud.google.com/iam/docs/creating-managing-service-accounts

## Install gcloud sdk on local machine for initial setup.

    https://cloud.google.com/sdk/docs/downloads-interactive

    curl https://sdk.cloud.google.com | bash
    gcloud init
    gcloud auth login

    negobot-uat --- GCP project name

    Your project default Compute Engine zone has been set to [asia-northeast1-a].
    You can change it by running [gcloud config set compute/zone NAME].

    Your project default Compute Engine region has been set to [asia-northeast1].
    You can change it by running [gcloud config set compute/region NAME].

    gcloud iam service-accounts list

    To configure authentication with service account credentials, run the following command (take the command from service accounts in GCP):
    gcloud auth activate-service-account negobot-k8s-api@nego-staging.iam.gserviceaccount.com --key-file=./negbot-k8s.json


## Configure Docker with the following command:

    To connect to Kubernetes cluster from local

    $ gcloud auth configure-docker

    $ gcloud container clusters get-credentials nego-uat-cluster --zone asia-northeast1-a --project negobot-uat


## Create a project on Google cloud - negobot-uat

## Create a service account

    $ gcloud config set project negobot-uat

    $ gcloud container clusters get-credentials nego-uat-cluster --zone asia-northeast1-a --project negobot-uat

## Create GKE cluster
    Take care of number of nodes and virtual instance type for production redundancy without down time updates.

## Push to container registry
    https://cloud.google.com/container-registry/docs/pushing-and-pulling

    asia.gcr.io hosts images in data centers in Asia
    asia.gcr.io

## Deploying the code to GKE cluster:

- Create a namespace uat in new GKE cluster

    $kubectl create namespace uat
- There are 5 services need to deploy to GKE cluster, Auth-service, Data-service, Client-service, Actions-service, Negotiation service and Redis cluster.

## Install REDIS cluster on k8s

## Install helm
    $ curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash


    $ helm repo add bitnami https://charts.bitnami.com/bitnami
    $ helm install my-release bitnami/<chart>           ## Helm 3
    $ helm install --name my-release bitnami/<chart>    ## Helm 2


    $ helm install redis bitnami/redis -n uat

    To get your password run:

        export REDIS_PASSWORD=$(kubectl get secret --namespace default redis -o jsonpath="{.data.redis-password}" | base64 --decode)

    To connect to your Redis server:

    1. Run a Redis pod that you can use as a client:
    kubectl run --namespace default redis-client --rm --tty -i --restart='Never' \
        --env REDIS_PASSWORD=$REDIS_PASSWORD \
    --image docker.io/bitnami/redis:6.0.8-debian-10-r0 -- bash

    2. Connect using the Redis CLI:
    redis-cli -h redis-master -a $REDIS_PASSWORD
    redis-cli -h redis-slave -a $REDIS_PASSWORD

    To connect to your database from outside the cluster execute the following commands:

        kubectl port-forward --namespace default svc/redis-master 6379:6379 &
        redis-cli -h 127.0.0.1 -p 6379 -a $REDIS_PASSWORD

- Auth-service
    $ docker build --tag asia.gcr.io/negobot-uat/auth .
    $ docker push asia.gcr.io/negobot-uat/auth

- Data-service
    $ docker build --tag asia.gcr.io/negobot-uat/data .
    $ docker push asia.gcr.io/negobot-uat/data

- Client-service
    $ docker build --tag asia.gcr.io/negobot-uat/client .
    $ docker push asia.gcr.io/negobot-uat/client

- Actions-service
    $ docker build --tag asia.gcr.io/negobot-uat/client .
    $ docker push asia.gcr.io/negobot-uat/actions

- Negotiation service
    $ docker build --tag asia.gcr.io/negobot-uat/client .
    $ docker push asia.gcr.io/negobot-uat/negotiation

## Deploy the services and ingress with SSL to GKE cluster

    $ gcloud config set project negobot-uat
    $ helm repo add stable https://kubernetes-charts.storage.googleapis.com
    $ gcloud container clusters get-credentials negobot-uat-cluster --zone asia-northeast1-a --project negobot-uat
    $ kubectl apply -f auth-deployment.yaml
    $ kubectl apply -f data-deployment.yaml
    $ kubectl apply -f client-deployment.yaml
    $ kubectl apply -f actions-deployment.yaml
    $ kubectl apply -f negotiation-deployment.yaml
    $ helm install nginx stable/nginx-ingress --namespace uat --set rbac.create=true --set controller.publishService.enabled=true
    $ kubectl get svc -nuat
    $ kubectl apply -f uat-ingress.yaml

- SSL Part
    $ kubectl apply --validate=false -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.12/deploy/manifests/00-crds.yaml
    $ helm repo add jetstack https://charts.jetstack.io
    $ helm repo update
    $ helm install cert-manager --namespace uat --version v0.12.0 jetstack/cert-manager
    $ kubectl apply -f ssl-issuer.yaml 
    $ kubectl get certificaterequests.cert-manager.io --namespace uat
    $ kubectl get pods --namespace uat

    All the yaml files could be found in deployment_yaml folder in root.

- After updating code, to deploy the same build the container with docker command, push it and restart the pod.

    $ kubectl delete pod auth-deployment-0
    or just use the script available in root scripts folder.


## ---------------------------------- TWILIO -------------------------------

## Create Programmable Chat

- Base Configuration
    FRIENDLY NAME k8s - uat
    SERVICE SID:  ISdd42080a798143b39d473acc332b2825
    Default Service Role:  service user
    Default Channel Role:  channel user
    Default Channel Creator Role: channel admin
    Channel Members Limit: 100
    User Channels Limit: 250

    Message Read Status: Tick

    Consumption Report Timeout: 10
    Typing Indicator Timeout: 5

- Webhooks
    Post-Event Webhooks
    Post-Event Webhooks fire after any action taken on a Chat Service. This means they arrive after messages have been delivered, after channel membership has changed, etc. Learn more

    Callback URL: https://api-uat.negobot.co/client/negobot_channel/webhook  > HTTP POST

    Callback Events
    onMessageSent: Sent a Message
    onMessageUpdated: Edited Message Body / Attributes
    onMessageRemoved: Message Deleted
    onMediaMessageSent: Sent a Media Message
    onChannelAdded: Created a Channel
    onChannelUpdated: Edited Channel Properties
    onChannelDestroyed: Deleted Channel / Destroyed Channel
    onMemberAdded: Joined Channel / Channel Member Added
    onMemberUpdated: Channel Member Updated
    onMemberRemoved: Channel Member Removed / Channel Member Left
    onUserAdded: User Added
    onUserUpdated: User Updated

- Save the configuration.

## ---------------------------------- ElephantSQL -------------------------------

- Create a database to update the db connections details in code.

    Active Plan Simple Spider
    Server 	arjuna.db.elephantsql.com (arjuna-01)
    Region 	amazon-web-services::ap-northeast-1
    Created at 	2020-09-30 05:24
    User & Default database 	vubvedro
    Password 	w-wbfILrdLcikFbsOG_8zWHwKTYD44F2
    URL: postgres://vubvedro:w-wbfILrdLcikFbsOG_8zWHwKTYD44F2@arjuna.db.elephantsql.com:5432/vubvedro

    API Key: ac706db9-4247-425c-88f9-64f8b45e421c

- Initialise the database with the scripts available in < root >/services/data folder.

< Repo folder >
|---/services
    |---/data
        |---/init_db*.py files could be used to initialise database.

## ---------------------------------- GCP Storage -------------------------------

-Create Storage buckets on GCP
    Need 2 buckets for storing products images and Rasa model files.
    https://cloud.google.com/storage/docs/creating-buckets
