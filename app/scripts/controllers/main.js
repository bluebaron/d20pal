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
    window.joe = joe;
    $scope.characters = [joe];
    $scope.selectedCharacter = $scope.characters[0];

    // Sets character highlighting in the UI
    var setCharacterHighlighted = function(character, hl) {
      if (character === null) return;
      if (hl) {
        character.selected = true;
      } else {
        character.selected = false;
      }
    };

    $scope.selectCharacter = function(characterIndex) {
      var character = $scope.characters[characterIndex];
      if (character === undefined || character === null) {
        console.log('Null character.');
        return;
      }

      console.log('Selecting character ' + character.name  +'.');

      setCharacterHighlighted($scope.selectedCharacter, false);
      $scope.selectedCharacter = character;
      setCharacterHighlighted(character, true);
    };
  });
