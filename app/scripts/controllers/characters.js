'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .controller('CharactersCtrl', function($scope, charactersService) {
    $scope.characters = [];

    charactersService.getCharacters().then(function(newCharacters) {
      $scope.characters = newCharacters;
      window.characters = newCharacters;
    });
  });
