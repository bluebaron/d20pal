'use strict';

angular.module('d20palApp')
  .controller('ChainableCtrl', function($scope, $routeParams, charactersService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.chainable = $scope.character.getChainableByName($routeParams.chainable);
      $scope.chainable.getFinal();
    });
  });
