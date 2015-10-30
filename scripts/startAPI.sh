#!/bin/bash

echo ""
echo "'fha-rise' component found, installing ..."
echo "Installed 'fha-rise' component."

docker pull paulhilbert/e57-metadata

echo ""
echo "Installed 'paulhilbert/e57-metadata' component."
echo ""

docker pull ochi/duraark_pc2bim

echo ""
echo "Installed 'ochi/duraark_pc2bim' component."
echo ""

# Start API server:
(cd /opt/duraark-geometricenrichment/src && npm install && cd /opt/duraark-geometricenrichment/_devops && ./serve-dev.sh)
