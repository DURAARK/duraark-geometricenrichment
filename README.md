[![ZenHub](https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png)](https://zenhub.io)

# microservice-e57metadata

This microservice provides an API for extracting metadata from e57 (pointcloud) files.

The easiest way to test the microservice is to install docker (http://docker.io) and pull the latest version via

```shell
docker pull duraark/microservice-e57metadata
```

You can start a container afterwards via 

```shell
docker run -d -p 1337:1337 -v /my_e57_files:/storage duraark/microservice-e57metadata
```

The container exposes port 1337. To bring your e57 files into the container use the "-v" flag and link the desired folder as "/storage".

The following API endpoints are available:

* http://localhost:1337/files -> lists all the files from the folder linked into the container
* http://localhost:1337/e57m/extract -> schedules the metadata extraction for a given file
* http://localhost:1337/e57m -> lists all pending and finished jobs
* http://localhost:1337/e57m/:id -> lists a single job ('id' starts with 1, not 0)

First, check which files are known to the system in querying the "files" endpoint:

```shell
curl http://localhost:1337/files
```

which results in a JSON response similar to:

```json
{
    "files": [
        "/storage/bunny.e57"
    ],
    "directories": []
}
```

In this case the system has access to a single file: "/storage/bunny.e57"

To schedule the metadata extraction for that file POST the filename to the "e57m/extract" endpoint like so:

```shell
curl -H "Content-Type: application/json" -d '{"files": ["/storage/bunny.e57"]}' http://localhost:1337/e57m/extract
```

The payload is an array, so it is possible to extract data from multiple files in one request.

To see a list of all scheduled jobs GET the "e57m" endpoint via curl or directly in the webbrowser. The curl command line is:

```shell
curl http://localhost:1337/e57m
```

The JSON response looks like:

```json
[{
    "originatingFile": "/storage/bunny.e57",
    "status": "finished",
    "metadata": {
        "e57_metadata": {
            ... lots of metadata ...
        }
    },
    "createdAt": "2015-01-21T22:51:40.429Z",
    "updatedAt": "2015-01-21T22:51:40.480Z",
    "id": 1
}]
```

If the job is still processing the JSON the "status" entry says "pending" and the "metadata" entry is an empty object, e.g.

```json
[{
    "originatingFile": "/storage/bunny.e57",
    "status": "pending",
    "metadata": {},
    "createdAt": "2015-01-21T22:51:40.429Z",
    "updatedAt": "2015-01-21T22:51:40.480Z",
    "id": 1
}]
```

Example e57 files can be found at http://www.libe57.org/data.html.

Enjoy!
