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

The session controller has the function "rise", which is the geometric enrichment part of Duraark.

Currently Rise requires the Wall.json, a panorama picture hardcoded somewhere in the storage and the pose information.
At a later stage the panorama picture and the pose information will be extracted from the given files.

One example JSON request for rise is in the folder testdata.

After this post is done rise does the following requests in this specific order:
* createSession(session) --> Creates a new session for this request and generates folders.
*  .then(createObjectFiles) --> Extracts object files from the pose information.
*  .then(startOrthogen) --> Start the Orthogen toolkit which extracts orthogonal pictures from the panorama image.
*  .then(startElecdetec) --> Starts the Elecdeted toolkit which is an electrical switches/socket detection.
*  .then(startWiregen) --> Starts the Wiregen toolkit which connects the electrical switches and sockets in the room
*  .then(reOrderResult) --> reorders the pictures in the output to form a "beautiful" room.

Each of these requests can also be requested separately and they require the response of the previous step.

Eg.: It is possible to request "startOrthogen" in the session controller. and the post data requires the response of createObjectFiles.

Enjoy!
