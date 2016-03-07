var request = require('supertest'),
  assert = require('chai').assert;

describe('The public PC2BIM endpoint', function() {
  var testFile = '/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n';
  request = request.bind(request, 'http://mimas.cgv.tugraz.at/api/v0.7/geometricenrichment');


  describe('GET /pc2bim', function() {
    it('should return an array', function(done) {
      request(sails.hooks.http.app)
        .get('/pc2bim')
        .expect(200, done);
    });
  });

  describe('POST a testfile to /pc2bim', function() {
    it('should return a pc2bim record', function(done) {
      request(sails.hooks.http.app)
        .post('/pc2bim')
        .send({
          inputFile: testFile
        })
        .expect(function(res) {
          var result = res.body;

          assert.isDefined(result.inputFile, '"inputFile" not present');
          assert.isDefined(result.bimFilePath, '"bimFilePath" not present');
          assert.isDefined(result.wallsFilePath, '"wallsFilePath" not present');
          assert.isDefined(result.status, '"status" not present');
          assert.isDefined(result.bimDownloadUrl, '"bimDownloadUrl" not present');
          assert.isDefined(result.createdAt, '"createdAt" not present');
          assert.isDefined(result.updatedAt, '"updatedAt" not present');
          assert.isDefined(result.id, '"id" not present');
        })
        .expect(200, done)
    });
  });
});
