'use strict';

/**
 * @ngdoc overview
 * @name d20palApp
 * @description
 * # d20palApp
 *
 * Main module of the application.
 */
angular
  .module('d20palApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/characters', {
        templateUrl: 'views/characters.html',
        controller: 'CharactersCtrl'
      })
      .when('/characters/new', {
        templateUrl: 'views/character-new.html',
        controller: 'NewCharacterCtrl'
      })
      .when('/characters/:character', {
        templateUrl: 'views/character.html',
        controller: 'CharacterCtrl'
      })
      .when('/characters/:character/edit', {
        templateUrl: 'views/character-edit.html',
        controller: 'EditCharacterCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
