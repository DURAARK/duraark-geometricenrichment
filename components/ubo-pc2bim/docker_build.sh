#!/bin/sh

PROJECT="$1"
ARCHIVE=${PROJECT}_latest.tar.gz

cd /tmp
curl -O http://0x00.cc/pc2bim/${ARCHIVE}
tar -C / -xf ${ARCHIVE}
rm ${ARCHIVE}
