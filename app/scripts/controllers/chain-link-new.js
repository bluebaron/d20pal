'use strict';

angular.module('d20palApp')
  .controller('NewChainLinkCtrl', function($scope, $routeParams, charactersService, chainLinkService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.chainable = character.getChainableByName($routeParams.chainable);
      $scope.testings = ['blah', 'blee', 'bloo'];

      $scope.linkTypes = Object.keys(chainLinkService.linkTypes).map(function(key) {
        return chainLinkService.linkTypes[key];
      });
      console.log($scope.linkTypes);
      $scope.newChainLinkType = null;
    });
  });
