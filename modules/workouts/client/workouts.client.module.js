(function (app) {
  'use strict';

  app.registerModule('workouts', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('workouts.services');
  app.registerModule('workouts.routes', ['ui.router', 'core.routes', 'workouts.services']);
}(ApplicationConfiguration));
