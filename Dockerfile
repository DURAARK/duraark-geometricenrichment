# Base system on DURAARK's 'bootstrap' system for microservices,
# which provides a SailsJS setup
FROM ubuntu:14.04

# Install system dependencies
RUN DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -qqy git software-properties-common build-essential cmake vim libboost-program-options1.55-dev libeigen3-dev apt-transport-https ca-certificates curl iptables && apt-get install --fix-missing
RUN add-apt-repository ppa:chris-lea/node.js -y && apt-get update -y && apt-get -y install nodejs -y && npm install -g grunt-cli sails nodemon
# Copy sources and dependencies for the 'orthogen' binary:
COPY ./orthogen /orthogen

# Compile orthogen binary:
##RUN mkdir -p /orthogen/build && cd /orthogen/build
##WORKDIR /orthogen/build
##RUN cmake -DEIGEN3_INCLUDE_DIR=/usr/include/eigen3 ../ && make -j2

# Perform system-wide installation as 'orthogen':
##RUN cp /orthogen/build/orthogen /usr/local/bin && orthogen --help

# Pull in microservice (a SailsJS API) and install it:
COPY ./ /microservice
WORKDIR /microservice/src
RUN npm install sails nodemon -g && npm install

RUN curl -sSL https://get.docker.com/ubuntu/ | sh
#ADD ./scripts/wrapdocker /usr/local/bin/wrapdocker
#RUN chmod +x /usr/local/bin/wrapdocker
ADD ./scripts/startAPI.sh /microservice/scripts/startAPI.sh
RUN chmod +x /microservice/scripts/startAPI.sh

EXPOSE 5014

#VOLUME /var/lib/docker
VOLUME /var/run/docker.sock
VOLUME /duraark-storage

CMD ["/microservice/scripts/startAPI.sh"]
