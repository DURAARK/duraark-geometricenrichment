var request = require('supertest'),
  assert = require('chai').assert;

describe('The public Compression endpoint', function() {
  var testFile = '/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n';
  request = request.bind(request, 'http://mimas.cgv.tugraz.at/api/v0.7/geometricenrichment');


  describe('GET /compression', function() {
    it('should return an array', function(done) {
      request(sails.hooks.http.app)
        .get('/compression')
        .expect(200, done);
    });
  });

  describe('POST a testfile to /compression', function() {
    it('should return a compression record', function(done) {
      request(sails.hooks.http.app)
        .post('/compression')
        .send({
          inputFile: testFile
        })
        .expect(function(res) {
          var result = res.body;

          assert.isDefined(result.inputFile, '"inputFile" not present');
          assert.isDefined(result.ratio, '"ratio" not present');
          assert.isDefined(result.status, '"status" not present');
          assert.isDefined(result.downloadUrl, '"downloadUrl" not present');
          assert.isDefined(result.createdAt, '"createdAt" not present');
          assert.isDefined(result.updatedAt, '"updatedAt" not present');
          assert.isDefined(result.id, '"id" not present');
        })
        .expect(200, done)
    });
  });
});
