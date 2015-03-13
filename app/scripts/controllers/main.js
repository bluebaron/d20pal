'use strict';

/**
 * @ngdoc function
 * @name d20palApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the d20palApp
 */
/* global d20pal: false */
angular.module('d20palApp')
  .controller('MainCtrl', function ($scope) {
    var joe = new d20pal.Character('Joe');
    $scope.characters = [joe];
  });
