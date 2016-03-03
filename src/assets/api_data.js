define({ "api": [
  {
    "type": "post",
    "url": "/compression/",
    "title": "Compress E57 file",
    "version": "1.0.0",
    "name": "PostCompress",
    "group": "Compression",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Schedule the compression of an E57 point cloud file.</p>",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "String",
            "optional": false,
            "field": "inputFile",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p>"
          }
        ],
        "Ratio": [
          {
            "group": "Ratio",
            "type": "Number",
            "optional": false,
            "field": "ratio",
            "description": "<p>Compression Ratio (between 0-1)</p>"
          }
        ],
        "Restart": [
          {
            "group": "Restart",
            "type": "String",
            "optional": false,
            "field": "restart",
            "description": "<p>Perform a new compression, even if there is a cached result in the database.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"inputFile\": \"/duraark-storage/sessions/Nygade1001/Nygade_Scan1001.e57\",\n   \"ratio\": 0.5,\n   \"status\": \"finished\",\n   \"createdAt\": \"2016-01-03T12:47:23.519Z\",\n   \"updatedAt\": \"2016-01-03T12:47:23.546Z\",\n   \"id\": 1,\n   \"downloadUrl\": \"/sessions/Nygade1001/Nygade_Scan1001.e57\"\n }",
          "type": "json"
        }
      ]
    },
    "filename": "api/controllers/CompressionController.js",
    "groupTitle": "Compression"
  },
  {
    "type": "post",
    "url": "/differencedetection/",
    "title": "Perform difference detection",
    "version": "1.0.0",
    "name": "PostDifferenceDetection",
    "group": "DifferenceDetection",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Schedule the difference detection between E57/IFC of E57/E57 files.</p>",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "String",
            "optional": false,
            "field": "fileIdA",
            "description": "<p>Location of file A as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p>"
          },
          {
            "group": "File",
            "type": "String",
            "optional": false,
            "field": "fileIdB",
            "description": "<p>Location of file B as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p>"
          }
        ],
        "Restart": [
          {
            "group": "Restart",
            "type": "String",
            "optional": false,
            "field": "restart",
            "description": "<p>Perform a new difference detection, even if there is a cached result in the database.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"inputFileA\": \"/duraark-storage/sessions/fixed/CITA_Byg72/master/CITA_Byg72_1st_Scan-0.02.e57n\",\n  \"inputFileB\": \"/duraark-storage/sessions/fixed/CITA_Byg72/master/CITA_Byg72_2nd_Scan-0.02.e57n\",\n  \"status\": \"finished\",\n  \"createdAt\": \"2016-01-03T20:14:13.836Z\",\n  \"updatedAt\": \"2016-01-03T20:14:14.016Z\",\n  \"id\": 1,\n  \"viewerUrl\": \"/sessions/fixed/CITA_Byg72/potree/CITA_Byg72_1st_Scan-0.02.e57n-CITA_Byg72_2nd_Scan-0.02.e57n/examples/CITA_Byg72_1st_Scan-0.02.e57n-CITA_Byg72_2nd_Scan-0.02.e57n.html\"\n }",
          "type": "json"
        }
      ]
    },
    "filename": "api/controllers/DifferenceDetectionController.js",
    "groupTitle": "DifferenceDetection"
  },
  {
    "type": "post",
    "url": "/pc2bim/",
    "title": "Extract BIM model",
    "version": "1.0.0",
    "name": "PostPc2bim",
    "group": "PC2BIM",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Schedule the extraction of a BIM model as IFC file from a given E57 point cloud file.</p>",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "String",
            "optional": false,
            "field": "inputFile",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p>"
          }
        ],
        "none": [
          {
            "group": "none",
            "type": "String",
            "optional": false,
            "field": "restart",
            "description": "<p>Perform a new reconstruction, even if there is a cached result in the database.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n {\n   \"inputFile\": \"/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n\",\n   \"bimFilePath\": \"/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/derivative_copy/CITA_NikolajKunsthal-0_04_RECONSTRUCTED.ifc\",\n   \"wallsFilePath\": \"/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/tmp/CITA_NikolajKunsthal-0_04_wall.json\",\n   \"status\": \"finished\",\n   \"bimDownloadUrl\": \"/sessions/fixed/CITA_NikolajKunsthal/derivative_copy/CITA_NikolajKunsthal-0_04_RECONSTRUCTED.ifc\",\n   \"createdAt\": \"2016-03-03T20:25:40.554Z\",\n   \"updatedAt\": \"2016-03-03T20:25:40.587Z\",\n   \"id\": 1,\n   \"wallsDownloadUrl\": \"/sessions/fixed/CITA_NikolajKunsthal/tmp/CITA_NikolajKunsthal-0_04_wall.json\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "api/controllers/Pc2bimController.js",
    "groupTitle": "PC2BIM"
  },
  {
    "type": "post",
    "url": "/rise",
    "title": "Extract electrical appliances",
    "version": "1.0.0",
    "name": "PostRise",
    "group": "RISE",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Extract BIM model as IFC file with in-wall electrical appliances from given E57 point cloud file.</p>",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "String",
            "optional": false,
            "field": "e57master",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p>"
          }
        ]
      }
    },
    "filename": "api/controllers/RiseController.js",
    "groupTitle": "RISE"
  },
  {
    "type": "post",
    "url": "/uploadFile",
    "title": "Upload geometry file",
    "version": "1.0.0",
    "name": "PostUploadFile",
    "group": "RISE",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Upload a new geometry file for RISE.</p>",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "String",
            "optional": false,
            "field": "path",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p>"
          }
        ],
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "ID",
            "description": "<p>of the internal Session the file should be added to.</p>"
          }
        ]
      }
    },
    "filename": "api/controllers/RiseController.js",
    "groupTitle": "RISE"
  },
  {
    "type": "post",
    "url": "/uploadPanoramas",
    "title": "Upload panorama file",
    "version": "1.0.0",
    "name": "PostUploadPanorama",
    "group": "RISE",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Upload a new panorama file for RISE.</p>",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "File",
            "optional": false,
            "field": "file",
            "description": "<p>Upload of file via form data.</p>"
          }
        ],
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "ID",
            "description": "<p>of the internal Session the file should be added to.</p>"
          }
        ]
      }
    },
    "filename": "api/controllers/RiseController.js",
    "groupTitle": "RISE"
  }
] });
