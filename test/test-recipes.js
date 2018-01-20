const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

// this lets us use *expect* style syntax in our tests
// so we can do things like `expect(1 + 1).to.equal(2);`
// http://chaijs.com/api/bdd/
const expect = chai.expect;

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);


describe('Recipes List', function() {

  before(function() {
    return runServer();
  });

  after(function() {
    return closeServer();
  });

  it('should list recipes on GET', function() {

    return chai.request(app)
      .get('/recipes')
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body.length).to.be.at.least(1);
        const expectedKeys = ['name', 'ingredients', 'id'];
        res.body.forEach(function(recipe) {
          expect(recipe).to.be.a('object');
          expect(recipe).to.include.keys(expectedKeys);
        });
      });
  });

  it('should add a recipe on POST', function() {
    const newRecipe = {name: 'tomatoe puree', ingredients: ['tomatoes', 'salt']};
    return chai.request(app)
      .post('/recipes')
      .send(newRecipe)
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('name', 'ingredients', 'id');
        expect(res.body.id).to.not.equal(null);
        expect(res.body).to.deep.equal(Object.assign(newRecipe, {id: res.body.id}));
      });
  });

  // test strategy:
  //  1. initialize some update data (we won't have an `id` yet)
  //  2. make a GET request so we can get a recipe to update
  //  3. add the `id` to `updateData`
  //  4. Make a PUT request with `updateData`
  //  5. Inspect the response object to ensure it
  //  has right status code and that we get back an updated
  //  recipes with the right data in it.
  it('should update recipes on PUT', function() {
    // we initialize our updateData here and then after the initial
    // request to the app, we update it with an `id` property so
    // we can make a second, PUT call to the app.
    const updateData = {
      name: 'tomatoe soup',
      ingredients: ['tomatoes', 'salt', 'water']
    };

    return chai.request(app)
      // first have to get so we have an idea of object to update
      .get('/recipes')
      .then(function(res) {
        updateData.id = res.body[0].id;
        // this will return a promise whose value will be the response
        // object, which we can inspect in the next `then` block. Note
        // that we could have used a nested callback here instead of
        // returning a promise and chaining with `then`, but we find
        // this approach cleaner and easier to read and reason about.
        return chai.request(app)
          .put(`/recipes/${updateData.id}`)
          .send(updateData);
      })

      // prove that the PUT request has right status code
      // and returns updated recipes
      .then(function(res) {
        expect(res).to.have.status(204);
        //expect(res).to.be.json;
        // expect(res.body).to.be.a('object');
        // expect(res.body).to.deep.equal(updateData);
      });
  });

  // test strategy:
  //  1. GET recipe items so we can get ID of one
  //  to delete.
  //  2. DELETE a recipe and ensure we get back a status 204
  it('should delete recipes on DELETE', function() {
    return chai.request(app)
      // first have to get so we have an `id` of recipe
      // to delete
      .get('/recipes')
      .then(function(res) {
        return chai.request(app)
          .delete(`/recipes/${res.body[0].id}`);
      })
      .then(function(res) {
        expect(res).to.have.status(204);
      });
  });
});
