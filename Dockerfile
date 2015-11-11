FROM duraark/microservice-base

MAINTAINER Martin Hecher <martin.hecher@fraunhofer.at>

COPY ./ /opt/duraark-geometricenrichment

##
## Build and install 'orthogen'
## FIXXME: 'orthogen' should be used via docker!
##
RUN mkdir -p /opt/orthogen/build
COPY ./orthogen /opt/orthogen

WORKDIR /opt/orthogen/build

RUN cmake -DEIGEN3_INCLUDE_DIR=/usr/include/eigen3 ../ && make -j2
RUN cp /opt/orthogen/build/orthogen /usr/local/bin

## Install OpenCV
RUN (cd /opt/duraark-geometricenrichment/scripts/Install-OpenCV/Ubuntu && ./opencv_latest.sh)

RUN mkdir -p /opt/elecdetect/build
COPY ./elecdetect /opt/elecdetect

WORKDIR /opt/elecdetect/build
RUN cmake ../ && make -j6
RUN cp /opt/orthogen/build/bin/Elecdetec /usr/local/bin

##
## Install microservice:
##
WORKDIR /opt/duraark-geometricenrichment/src

RUN npm install

EXPOSE 5014

CMD ["/opt/duraark-geometricenrichment/scripts/startAPI.sh"]
