(function () {
  'use strict';

  angular
    .module('workouts')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    menuService.addMenuItem('topbar', {
      title: 'Workouts',
      state: 'workouts',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'workouts', {
      title: 'List Workouts',
      state: 'workouts.list'
    });

    // Add the dropdown create item
    menuService.addSubMenuItem('topbar', 'workouts', {
      title: 'Create Workout',
      state: 'workouts.create',
      roles: ['user']
    });
  }
}());
