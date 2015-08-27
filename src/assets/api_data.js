define({ "api": [
  {
    "type": "post",
    "url": "/pc2bim/",
    "title": "Extract BIM model",
    "version": "0.8.0",
    "name": "PostPc2bim",
    "group": "PC2BIM",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Schedule the extraction of a BIM model as IFC file from a given E57 point cloud file.</p> ",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "path",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"input\": \"/duraark-storage/files/Nygade_Scan1001.e57\",\n   \"output\": \"/duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED.ifc\",\n   \"error\": null\n }",
          "type": "json"
        }
      ],
      "fields": {
        "Response": [
          {
            "group": "Response",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "input",
            "description": "<p>Location of the input file.</p> "
          },
          {
            "group": "Response",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "output",
            "description": "<p>Location of the reconstructed output file.</p> "
          },
          {
            "group": "Response",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "error",
            "description": "<p>'null' if extraction was successfull, otherwise contains error message.</p> "
          }
        ]
      }
    },
    "filename": "api/controllers/Pc2bimController.js",
    "groupTitle": "PC2BIM"
  },
  {
    "type": "post",
    "url": "/rise",
    "title": "Extract electrical appliances",
    "version": "0.7.0",
    "name": "PostRise",
    "group": "RISE",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Extract BIM model as IFC file with in-wall electrical appliances from given E57 point cloud file.</p> ",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "path",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p> "
          }
        ]
      }
    },
    "filename": "api/controllers/SessionsController.js",
    "groupTitle": "RISE"
  },
  {
    "type": "post",
    "url": "/uploadFile",
    "title": "Upload geometry file",
    "version": "0.7.0",
    "name": "PostUploadFile",
    "group": "RISE",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Upload a new geometry file for RISE.</p> ",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "path",
            "description": "<p>Location of the File as provided by the <a href=\"http://data.duraark.eu/services/api/sessions/\">DURAARK Sessions API</a>.</p> "
          }
        ],
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>Number</p> ",
            "optional": false,
            "field": "ID",
            "description": "<p>of the internal Session the file should be added to.</p> "
          }
        ]
      }
    },
    "filename": "api/controllers/SessionsController.js",
    "groupTitle": "RISE"
  },
  {
    "type": "post",
    "url": "/uploadPanoramas",
    "title": "Upload panorama file",
    "version": "0.7.0",
    "name": "PostUploadPanorama",
    "group": "RISE",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Upload a new panorama file for RISE.</p> ",
    "parameter": {
      "fields": {
        "File": [
          {
            "group": "File",
            "type": "<p>File</p> ",
            "optional": false,
            "field": "file",
            "description": "<p>Upload of file via form data.</p> "
          }
        ],
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>Number</p> ",
            "optional": false,
            "field": "ID",
            "description": "<p>of the internal Session the file should be added to.</p> "
          }
        ]
      }
    },
    "filename": "api/controllers/SessionsController.js",
    "groupTitle": "RISE"
  }
] });