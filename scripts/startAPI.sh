#!/bin/bash

# ls -alh /duraark-storage/files

# Install 'e57-metadata' component:
docker pull paulhilbert/e57-metadata
# Tests component:
docker run --rm -t -v /duraark-storage:/duraark-storage paulhilbert/e57-metadata e57_metadata_extractor -i /duraark-storage/files/Nygade_Scan1001.e57 -o /duraark-storage/files/Nygade_Scan1001.json

# Install 'pc2bim' component, if available:
if [ -d /microservice/components/ubo-pc2bim ]
  then
    cd /microservice/components/ubo-pc2bim
    docker build -t ubo/pc2bim .

    # Tests component:
    docker run --rm -v /duraark-storage:/duraark-storage ubo/pc2bim pc2bim --input /duraark-storage/files/Nygade_Scan1001.e57 --output /duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED_DOCKER.ifc
fi

# Start API server:
(cd /microservice/src && npm install && sails lift)
