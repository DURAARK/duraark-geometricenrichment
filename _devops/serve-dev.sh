#!/bin/sh

# TODO: read all necessary data from file!

SERVICENAME=$(cat ./service-info.txt)
INDEXFILE="app.js"
FOLDER="../src"

#(cd $FOLDER; pm2 delete $SERVICENAME; pm2 start $INDEXFILE -x --name $SERVICENAME)
#pm2 logs
(cd $FOLDER; nodemon -w api -w config -w bindings)
