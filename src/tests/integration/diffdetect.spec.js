var request = require('supertest'),
  assert = require('chai').assert;

describe('The public DiffDetect endpoint', function() {
  var testFileA = '/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n';
  var testFileB = '/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n/duraark-storage/sessions/fixed/CITA_NikolajKunsthal/master/CITA_NikolajKunsthal-0_04.e57n';
  request = request.bind(request, 'http://mimas.cgv.tugraz.at/api/v0.7/geometricenrichment');


  describe('GET /differencedetection', function() {
    it('should return an array', function(done) {
      request(sails.hooks.http.app)
        .get('/differencedetection')
        .expect(200, done);
    });
  });

  describe('POST a testfile to /differencedetection', function() {
    it('should return a differencedetection record', function(done) {
      request(sails.hooks.http.app)
        .post('/differencedetection')
        .send({
          inputFileA: testFileA,
          inputFileB: testFileB
        })
        .expect(function(res) {
          var result = res.body;

          assert.isDefined(result.inputFileA, '"inputFileA" not present');
          assert.isDefined(result.inputFileB, '"inputFileB" not present');
          assert.isDefined(result.status, '"status" not present');
          assert.isDefined(result.createdAt, '"createdAt" not present');
          assert.isDefined(result.updatedAt, '"updatedAt" not present');
          assert.isDefined(result.id, '"id" not present');
        })
        .expect(200, done)
    });
  });
});
