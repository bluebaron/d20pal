'use strict';

angular.module('d20palApp')
  .controller('CharacterCtrl', function($scope, $routeParams, charactersService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
    }, function(err) {
      console.log('Could not find specified character!');
    });
  });
