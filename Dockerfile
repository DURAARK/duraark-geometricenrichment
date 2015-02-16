# Base system on DURAARK's 'bootstrap' system for microservices,
# which provides a SailsJS setup
FROM duraark/microservice-base

# Install system dependencies
RUN DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y git build-essential cmake vim unzip wget scons
RUN apt-get install -y libboost-filesystem1.55-dev libboost-system1.55-dev \
                       libboost-thread1.55-dev libboost-program-options1.55-dev \
		       libeigen3-dev libxerces-c-dev

# Copy sources and dependencies for the 'e57metadata' binary:
COPY ./e57extract /e57extract

# Extract dependencies from local archives:
WORKDIR /e57extract/aux_
RUN unzip E57RefImpl_src-1.1.312.zip
RUN unzip cereal-v1.0.0.zip

# Compile E57RefImpl library:
WORKDIR /e57extract/aux_/E57RefImpl_src-1.1.312
RUN cmake .
RUN make -j2

# Perform user-local install:
RUN make install
RUN cp libtime_conversion.a /usr/local/E57RefImpl-1.1.unknown-x86_64-linux-gcc48/lib/
RUN cp include/time_conversion/*.h /usr/local/E57RefImpl-1.1.unknown-x86_64-linux-gcc48/include/e57
RUN export PATH=$PATH:/usr/local/E57RefImpl-1.1.unknown-x86_64-linux-gcc48/bin

# Perform system-wide installation:
RUN cp -r /usr/local/E57RefImpl-1.1.unknown-x86_64-linux-gcc48/include/e57 /usr/include
RUN cp -r /usr/local/E57RefImpl-1.1.unknown-x86_64-linux-gcc48/lib/* /usr/lib

# Compile E57SimpleImpl library:
WORKDIR /e57extract/aux_/E57SimpleImpl-src-1.1.312_fixed
RUN scons .

# Perform system-wide installation:
RUN cp libE57SimpleImpl.so /usr/lib
RUN cp -r include/* /usr/include/e57

# Compile e57metadata binary:
WORKDIR /e57extract
#RUN wget https://github.com/USCiLab/cereal/archive/v1.0.0.zip
RUN mkdir build
WORKDIR build
RUN CEREAL_ROOT=./aux_/cereal-1.0.0 cmake ../
RUN make -j2
RUN make install

# Perform system-wide installation as 'e57metadata':
RUN cp /usr/local/bin/test_cpplib /usr/bin/e57metadata
RUN echo $(pwd) > /etc/ld.so.conf.d/e57metadata.conf
RUN ldconfig
#RUN e57metadata --help

# Pull in microservice (a SailsJS API) and install it:
COPY ./src /microservice
WORKDIR /microservice
RUN npm install

EXPOSE 5003

CMD ["sails", "lift"]
