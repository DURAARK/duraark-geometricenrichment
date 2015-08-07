define({ "api": [
  {
    "type": "post",
    "url": "/ifcreconstruction",
    "title": "Extract BIM model",
    "version": "0.7.0",
    "name": "PostIFCReconstruction",
    "group": "IFCReconstruction",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>Extracts BIM model as IFC file from given E57 point cloud file.</p> ",
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
    "groupTitle": "IFCReconstruction"
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