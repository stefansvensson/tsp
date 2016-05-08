(function () {
  'use strict';

  angular
    .module('workouts.services')
    .factory('WorkoutsService', WorkoutsService);

  WorkoutsService.$inject = ['$resource'];

  function WorkoutsService($resource) {
    return $resource('api/workouts/:workoutId', {
      workoutId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
