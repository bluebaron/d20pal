'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .controller('CharactersCtrl', ['$scope', 'charactersService', function($scope, charactersService) {
    $scope.characters = [];

    charactersService.getCharacters().then(function(newCharacters) {
      $scope.characters = newCharacters;
    });
  }]);
