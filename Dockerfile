# Base system on DURAARK's 'bootstrap' system for microservices,
# which provides a SailsJS setup
FROM duraark/microservice-base

# Install system dependencies
RUN DEBIAN_FRONTEND=noninteractive
RUN apt-get update
##RUN apt-get install -y git build-essential cmake vim --fix-missing
##RUN apt-get install -y libboost-program-options1.55-dev libeigen3-dev
##RUN apt-get install --fix-missing

# Copy sources and dependencies for the 'orthogen' binary:
##COPY ./OrthoGen /orthogen

# Compile orthogen binary:
##WORKDIR /orthogen
##RUN mkdir build
##WORKDIR build
##RUN EIGEN3_INCLUDE_DIR=/usr/include/eigen3 cmake ../
##RUN make

# Perform system-wide installation as 'orthogen':
##RUN cp /orthogen/build/orthogen /usr/local/bin
##RUN orthogen --help

# Pull in microservice (a SailsJS API) and install it:
COPY ./src /microservice
WORKDIR /microservice
RUN npm install

EXPOSE 5015

CMD ["sails", "lift"]
