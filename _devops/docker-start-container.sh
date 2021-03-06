#!/bin/sh

NAMESPACE="local"
CONTAINERNAME="microservice-orthogen"
IMAGENAME=$NAMESPACE/$CONTAINERNAME
DEFAULTPORT=5010

echo $IMAGENAME

HOSTPORT=$1

if [ -z "$1" ]
  then
    HOSTPORT=$DEFAULTPORT
    echo "Usage  ./docker-run HOSTPORT\n"
    echo "No HOSTPORT provided, assuming default port $DEFAULTPORT\n"
fi

echo "Removing "
docker rm -f $CONTAINERNAME

echo "\nStarted as "
#docker run -d -p $HOSTPORT:$DEFAULTPORT --name $CONTAINERNAME --volumes-from microservice-files --link microservice-files:files --link microservice-ifcmetadata:ifcmetadata --link microservice-e57metadata:e57metadata $IMAGENAME
docker run -d -p $HOSTPORT:$DEFAULTPORT --name $CONTAINERNAME $IMAGENAME
