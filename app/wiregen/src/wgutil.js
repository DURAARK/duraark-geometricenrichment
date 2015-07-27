"use strict";
// wiregen utils
// ulrich.krispel@vc.fraunhofer.at

function removeArrObj(array, object) {
    var index = array.indexOf(object);
    if (index > -1) { array.splice(index, 1); }
}

module.exports =
{
    removeArrObj : removeArrObj
}
