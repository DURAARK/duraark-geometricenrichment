#!/bin/bash

# ls -alh /duraark-storage/files

echo ""
echo "'fha-rise' component found, installing ..."
echo "Installed 'fha-rise' component."

echo ""
echo "'ubo-e57-metadata' component found, installing ..."
echo ""

# Install 'e57-metadata' component:
docker pull paulhilbert/e57-metadata
# Tests component:
##docker run --rm -t -v /duraark-storage:/duraark-storage paulhilbert/e57-metadata e57_metadata_extractor -i /duraark-storage/files/Nygade_Scan1001.e57 -o /duraark-storage/files/Nygade_Scan1001.json

echo ""
echo "Installed 'ubo-e57-metadata' component."
echo ""

# Install 'ubo-pc2bim' component, if available:
if [ -d /microservice/components/ubo-pc2bim ]
  then
    echo ""
    echo "'ubo-pc2bim' component found, installing ..."
    echo ""

    cd /microservice/components/ubo-pc2bim
    docker build -t ubo/pc2bim .

    # Tests component:
    ##docker run --rm -v /duraark-storage:/duraark-storage ubo/pc2bim pc2bim --input /duraark-storage/files/Nygade_Scan1001.e57 --output /duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED_DOCKER.ifc

    echo ""
    echo "Installed 'ubo-pc2bim' component."
    echo ""
  else
    echo "No 'ubo-pc2bim' component found. Safely continuing without it ..."
fi

# Start API server:
(cd /microservice/src && npm install && cd /microservice/_devops && ./serve-dev.sh)
