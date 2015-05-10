'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .controller('NewChainableCtrl', function($scope, $routeParams, charactersService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.newChainableName = '';

      $scope.addChainable = function() {
        if ($scope.newChainableName !== '') {
          $scope.character.addChainable(new d20pal.Chainable($scope.newChainableName));       
        }
      };
    });
  });
