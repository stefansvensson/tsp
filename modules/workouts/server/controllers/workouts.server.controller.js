'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Workout = mongoose.model('Workout'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create an workout
 */
exports.create = function (req, res) {
  var workout = new Workout(req.body);
  workout.user = req.user;

  workout.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(workout);
    }
  });
};

/**
 * Show the current workout
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var workout = req.workout ? req.workout.toJSON() : {};

  // Add a custom field to the Workout, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Workout model.
  workout.isCurrentUserOwner = !!(req.user && workout.user && workout.user._id.toString() === req.user._id.toString());

  res.json(workout);
};

/**
 * Update an workout
 */
exports.update = function (req, res) {
  var workout = req.workout;

  workout.title = req.body.title;
  workout.content = req.body.content;

  workout.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(workout);
    }
  });
};

/**
 * Delete an workout
 */
exports.delete = function (req, res) {
  var workout = req.workout;

  workout.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(workout);
    }
  });
};

/**
 * List of Workouts
 */
exports.list = function (req, res) {
  Workout.find().sort('-created').populate('user', 'displayName').exec(function (err, workouts) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(workouts);
    }
  });
};

/**
 * Workout middleware
 */
exports.workoutByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Workout is invalid'
    });
  }

  Workout.findById(id).populate('user', 'displayName').exec(function (err, workout) {
    if (err) {
      return next(err);
    } else if (!workout) {
      return res.status(404).send({
        message: 'No workout with that identifier has been found'
      });
    }
    req.workout = workout;
    next();
  });
};
