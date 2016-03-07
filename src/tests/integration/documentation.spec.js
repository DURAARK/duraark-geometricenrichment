var request = require('supertest');

describe('The public API endpoint', function() {
  request = request.bind(request, 'http://mimas.cgv.tugraz.at/api/v0.7/geometricenrichment');
  describe('when navigating to the API documentation', function() {
    it('should display the page', function(done) {
      request(sails.hooks.http.app)
        .get('/')
        .expect(200, done);
    });
  });
});
