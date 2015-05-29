[![ZenHub](https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png)](https://zenhub.io)

# microservice-rise

This microservice provides an API for detecting in-wall electrical applicances out of point cloud files and panorama images of the scanned rooms.

The easiest way to test the microservice is to install docker (http://docker.io) and pull the latest version via

```shell
docker pull duraark/microservice-rise
```

You can start a container afterwards via 

```shell
docker run -d -p 5010:1337 -v /my_e57_files:/storage duraark/microservice-rise
```

The container exposes port 5010. To bring your e57 files into the container use the "-v" flag and link the desired folder as "/storage".

The following API endpoints are available:

* Sessions -> For creating sessions and start the algorithmic.
* Files -> For managing files on the storage

### Sessions

The following actions are available on the sessions endpoint:

* createSession --> For creating a new session.
* uploadFile --> For uploading a panorama image or object file to your created session
* startOrthogen --> Calculate the orthogen planes on your image & object file
* startElecdetec --> Search for power sockets in the orthogen images
* (getOrthogenImage) --> Not needed you can access the image files directly
* (uploadPanoramas) --> Not needed use UploadFile

##### createSession

Creates a new session on the server. 
A new folder will be created on the storage with the SessionUUID. All further actions require the responding sessionUUID.

*Example:*

```shell
POST http://localhost:5010/sessions/createSession
```

The response looks like:
```json
{
    "session": {
        "homeDir": "\\tmp\\19ec3cb1-993e-48db-b041-e2a1c02ed341",
        "sessionId": "session",
        "status": "pending",
        "createdAt": "2015-05-29T12:15:51.313Z",
        "updatedAt": "2015-05-29T12:15:51.317Z",
        "id": 10
    }
}
```

##### uploadFile

Uploads a file to the storage. This function should be used for uploading the panorama and object files into the storage.
Important: The session must be the first item which should be sent, the file itself the second.
The response filename should then be used for the Orthogen creation.

*Example:*

```shell
POST http://localhost:5010/Sessions/uploadFile

Content-Type: multipart/form-data
session: 19ec3cb1-993e-48db-b041-e2a1c02ed341 (Text)
file: <yourbinary image> (File)

```

The response looks like:
```json
{
    "files": [
        {
            "fd": "e:\\tmp\\19ec3cb1-993e-48db-b041-e2a1c02ed341\\9ab8d494-3edb-4e6f-9034-6dbcbd0a70bf.jpg",
            "size": 50810,
            "type": "image/jpeg",
            "filename": "1394327_431841983594119_2046804090_n.jpg",
            "status": "bufferingOrWriting",
            "field": "file"
        }
    ],
    "fileName": "9ab8d494-3edb-4e6f-9034-6dbcbd0a70bf.jpg",
    "message": "File uploaded successfully!"
}
```

##### startOrthogen

Starts the creation of Orthogen images. This action serves as endpoint for the. [Orthogen tool](https://github.com/DURAARK/orthogen)
For the command line arguments please refer to their Readme. The files can be directly accessed. The link of these files are in the response.

*Example:*

```shell
POST http://localhost:5010/sessions/startOrthogen

Content-Type: application/json
{
    "session" : "19ec3cb1-993e-48db-b041-e2a1c02ed341",
    "proxyGeometry": "8be13e82-9000-449a-8bba-b4101499646b.obj",
    "panoImage": "9ab8d494-3edb-4e6f-9034-6dbcbd0a70bf.jpg",
    "poseInformation": {
        "translationX": 0,
        "translationY": 0,
        "translationZ": 0,
        "rotationW": 0.0266818,
        "rotationX": 0.00336098,
        "rotationY": 0.00221603,
        "rotationZ": 0.999636,
        "res": 1,
        "scale": "mm",
        "elevationX": -1.5707963,
        "elevationY": 1.5707963,
        "exgeom": 1,
        "exsphere": 1,
        "exquad": 1
    },
    "clusteringOpts": {
        "normalDirection": true,
        "distanceClustering": true
    } 
}
```

The response looks like:
```json
{
    "session": {
        "sessionId": "19ec3cb1-993e-48db-b041-e2a1c02ed341",
        "homeDir": "\\tmp\\19ec3cb1-993e-48db-b041-e2a1c02ed341",
        "config": {
            ... config from the request ...
        },
        "status": "finished",
        "resultImages": [
            {
                "file": "4a728c71-b4d6-4df7-8c90-854149688afb.jpg",
                "link": "http://localhost:5010/public/19ec3cb1-993e-48db-b041-e2a1c02ed341/4a728c71-b4d6-4df7-8c90-854149688afb.jpg"
            },
            ... some more files ...

            {
                "file": "test2.png",
                "link": "http://localhost:5010/public/19ec3cb1-993e-48db-b041-e2a1c02ed341/test2.png"
            }
        ]
    },
    "nextStep": "/sessions/startElecdetect"
}

```

##### startElecdetec

Searches in the Orthogonal images for power sockets. This action serves as endpoint for the. [ElecDetec tool](https://github.com/DURAARK/elecdetect)
In the request the sessionID and the images which should be searched have to be entered.

*Example:*

```shell
POST http://localhost:5010/sessions/startElecdetec

Content-Type: application/json
{
    "session": "0e275b45-2258-4abd-ba5b-70c8418b3b37",
    "files": [
        "4a728c71-b4d6-4df7-8c90-854149688afb.jpg",
        "test2.png"
    ]
}
```

The response looks like:
```json
{
    "session": {
        "sessionId": "0e275b45-2258-4abd-ba5b-70c8418b3b37",
        "homeDir": "\\tmp\\0e275b45-2258-4abd-ba5b-70c8418b3b37",
        "files": [
            "4a728c71-b4d6-4df7-8c90-854149688afb.jpg",
            "test2.png"
        ],
        "status": "finished",
        "elecDir": "elecdetect-test-set",
        "elecResultsDir": "results",
        "elecdetecPath": "\\tmp\\0e275b45-2258-4abd-ba5b-70c8418b3b37\\elecdetect-test-set",
        "elecdetecExecutable": "e:\\ccaldera\\projects\\Duraark\\microservice-rise\\app\\ElecDetec-windows\\",
        "elecdetecResults": "\\tmp\\0e275b45-2258-4abd-ba5b-70c8418b3b37\\elecdetect-test-set\\results",
        "resultImages": [
            {
                "file": "4a728c71-b4d6-4df7-8c90-854149688afb-result-probmap1.png",
                "link": "http://localhost:5010/public/0e275b45-2258-4abd-ba5b-70c8418b3b37/elecdetect-test-set/results/4a728c71-b4d6-4df7-8c90-854149688afb-result-probmap1.png"
            },
            ... more files ...
            {
                "file": "test2-result.png",
                "link": "http://localhost:5010/public/0e275b45-2258-4abd-ba5b-70c8418b3b37/elecdetect-test-set/results/test2-result.png"
            }
        ]
    },
    "nextStep": "startWiregen"
}
```

Enjoy!
