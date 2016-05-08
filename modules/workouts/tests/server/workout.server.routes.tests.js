'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Workout = mongoose.model('Workout'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  workout;

/**
 * Workout routes tests
 */
describe('Workout CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new workout
    user.save(function () {
      workout = {
        title: 'Workout Title',
        content: 'Workout Content'
      };

      done();
    });
  });

  it('should be able to save an workout if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new workout
        agent.post('/api/workouts')
          .send(workout)
          .expect(200)
          .end(function (workoutSaveErr, workoutSaveRes) {
            // Handle workout save error
            if (workoutSaveErr) {
              return done(workoutSaveErr);
            }

            // Get a list of workouts
            agent.get('/api/workouts')
              .end(function (workoutsGetErr, workoutsGetRes) {
                // Handle workout save error
                if (workoutsGetErr) {
                  return done(workoutsGetErr);
                }

                // Get workouts list
                var workouts = workoutsGetRes.body;

                // Set assertions
                (workouts[0].user._id).should.equal(userId);
                (workouts[0].title).should.match('Workout Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an workout if not logged in', function (done) {
    agent.post('/api/workouts')
      .send(workout)
      .expect(403)
      .end(function (workoutSaveErr, workoutSaveRes) {
        // Call the assertion callback
        done(workoutSaveErr);
      });
  });

  it('should not be able to save an workout if no title is provided', function (done) {
    // Invalidate title field
    workout.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new workout
        agent.post('/api/workouts')
          .send(workout)
          .expect(400)
          .end(function (workoutSaveErr, workoutSaveRes) {
            // Set message assertion
            (workoutSaveRes.body.message).should.match('Title cannot be blank');

            // Handle workout save error
            done(workoutSaveErr);
          });
      });
  });

  it('should be able to update an workout if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new workout
        agent.post('/api/workouts')
          .send(workout)
          .expect(200)
          .end(function (workoutSaveErr, workoutSaveRes) {
            // Handle workout save error
            if (workoutSaveErr) {
              return done(workoutSaveErr);
            }

            // Update workout title
            workout.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing workout
            agent.put('/api/workouts/' + workoutSaveRes.body._id)
              .send(workout)
              .expect(200)
              .end(function (workoutUpdateErr, workoutUpdateRes) {
                // Handle workout update error
                if (workoutUpdateErr) {
                  return done(workoutUpdateErr);
                }

                // Set assertions
                (workoutUpdateRes.body._id).should.equal(workoutSaveRes.body._id);
                (workoutUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of workouts if not signed in', function (done) {
    // Create new workout model instance
    var workoutObj = new Workout(workout);

    // Save the workout
    workoutObj.save(function () {
      // Request workouts
      request(app).get('/api/workouts')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single workout if not signed in', function (done) {
    // Create new workout model instance
    var workoutObj = new Workout(workout);

    // Save the workout
    workoutObj.save(function () {
      request(app).get('/api/workouts/' + workoutObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', workout.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single workout with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/workouts/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Workout is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single workout which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent workout
    request(app).get('/api/workouts/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No workout with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an workout if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new workout
        agent.post('/api/workouts')
          .send(workout)
          .expect(200)
          .end(function (workoutSaveErr, workoutSaveRes) {
            // Handle workout save error
            if (workoutSaveErr) {
              return done(workoutSaveErr);
            }

            // Delete an existing workout
            agent.delete('/api/workouts/' + workoutSaveRes.body._id)
              .send(workout)
              .expect(200)
              .end(function (workoutDeleteErr, workoutDeleteRes) {
                // Handle workout error error
                if (workoutDeleteErr) {
                  return done(workoutDeleteErr);
                }

                // Set assertions
                (workoutDeleteRes.body._id).should.equal(workoutSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an workout if not signed in', function (done) {
    // Set workout user
    workout.user = user;

    // Create new workout model instance
    var workoutObj = new Workout(workout);

    // Save the workout
    workoutObj.save(function () {
      // Try deleting workout
      request(app).delete('/api/workouts/' + workoutObj._id)
        .expect(403)
        .end(function (workoutDeleteErr, workoutDeleteRes) {
          // Set message assertion
          (workoutDeleteRes.body.message).should.match('User is not authorized');

          // Handle workout error error
          done(workoutDeleteErr);
        });

    });
  });

  it('should be able to get a single workout that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new workout
          agent.post('/api/workouts')
            .send(workout)
            .expect(200)
            .end(function (workoutSaveErr, workoutSaveRes) {
              // Handle workout save error
              if (workoutSaveErr) {
                return done(workoutSaveErr);
              }

              // Set assertions on new workout
              (workoutSaveRes.body.title).should.equal(workout.title);
              should.exist(workoutSaveRes.body.user);
              should.equal(workoutSaveRes.body.user._id, orphanId);

              // force the workout to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the workout
                    agent.get('/api/workouts/' + workoutSaveRes.body._id)
                      .expect(200)
                      .end(function (workoutInfoErr, workoutInfoRes) {
                        // Handle workout error
                        if (workoutInfoErr) {
                          return done(workoutInfoErr);
                        }

                        // Set assertions
                        (workoutInfoRes.body._id).should.equal(workoutSaveRes.body._id);
                        (workoutInfoRes.body.title).should.equal(workout.title);
                        should.equal(workoutInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single workout if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new workout model instance
    workout.user = user;
    var workoutObj = new Workout(workout);

    // Save the workout
    workoutObj.save(function () {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new workout
          agent.post('/api/workouts')
            .send(workout)
            .expect(200)
            .end(function (workoutSaveErr, workoutSaveRes) {
              // Handle workout save error
              if (workoutSaveErr) {
                return done(workoutSaveErr);
              }

              // Get the workout
              agent.get('/api/workouts/' + workoutSaveRes.body._id)
                .expect(200)
                .end(function (workoutInfoErr, workoutInfoRes) {
                  // Handle workout error
                  if (workoutInfoErr) {
                    return done(workoutInfoErr);
                  }

                  // Set assertions
                  (workoutInfoRes.body._id).should.equal(workoutSaveRes.body._id);
                  (workoutInfoRes.body.title).should.equal(workout.title);

                  // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                  (workoutInfoRes.body.isCurrentUserOwner).should.equal(true);

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should be able to get a single workout if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new workout model instance
    var workoutObj = new Workout(workout);

    // Save the workout
    workoutObj.save(function () {
      request(app).get('/api/workouts/' + workoutObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', workout.title);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single workout, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create temporary user creds
    var _creds = {
      username: 'temp',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create temporary user
    var _user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'temp@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _user.save(function (err, _user) {
      // Handle save error
      if (err) {
        return done(err);
      }

      // Sign in with the user that will create the Workout
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user._id;

          // Save a new workout
          agent.post('/api/workouts')
            .send(workout)
            .expect(200)
            .end(function (workoutSaveErr, workoutSaveRes) {
              // Handle workout save error
              if (workoutSaveErr) {
                return done(workoutSaveErr);
              }

              // Set assertions on new workout
              (workoutSaveRes.body.title).should.equal(workout.title);
              should.exist(workoutSaveRes.body.user);
              should.equal(workoutSaveRes.body.user._id, userId);

              // now signin with the temporary user
              agent.post('/api/auth/signin')
                .send(_creds)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the workout
                  agent.get('/api/workouts/' + workoutSaveRes.body._id)
                    .expect(200)
                    .end(function (workoutInfoErr, workoutInfoRes) {
                      // Handle workout error
                      if (workoutInfoErr) {
                        return done(workoutInfoErr);
                      }

                      // Set assertions
                      (workoutInfoRes.body._id).should.equal(workoutSaveRes.body._id);
                      (workoutInfoRes.body.title).should.equal(workout.title);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (workoutInfoRes.body.isCurrentUserOwner).should.equal(false);

                      // Call the assertion callback
                      done();
                    });
                });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Workout.remove().exec(done);
    });
  });
});
