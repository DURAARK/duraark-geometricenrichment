FROM duraark/microservice-base

MAINTAINER Martin Hecher <martin.hecher@fraunhofer.at>

RUN mkdir -p /opt/orthogen/build

COPY ./orthogen /opt/orthogen

WORKDIR /opt/orthogen/build
RUN cmake -DEIGEN3_INCLUDE_DIR=/usr/include/eigen3 ../ && make -j2

RUN cp /opt/orthogen/build/orthogen /usr/local/bin && orthogen --help

COPY ./ /opt/duraark-geometricenrichment
WORKDIR /opt/duraark-geometricenrichment/src

RUN npm install

EXPOSE 5014

CMD ["//opt/duraark-geometricenrichment/scripts/startAPI.sh"]
