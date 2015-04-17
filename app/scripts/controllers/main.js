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
    $scope.selectedCharacter = null;
    $scope.selectedChainable = null;
    $scope.selectedChainableIntermediaries = [];

    // Sets character highlighting in the UI
    var setCharacterHighlighted = function(character, hl) {
      if (character === null) {
        return;
      } else if (hl) {
        character.selected = true;
      } else {
        character.selected = false;
      }
    };

    // Selects character and highlights appropriately
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

    $scope.selectCharacter(0);

    $scope.selectChainable = function(index) {
      $scope.selectedChainable = $scope.selectedCharacter.chainables[index];
      $scope.selectedChainableIntermediaries = $scope.selectedChainable.getIntermediaries();
    };

    $scope.selectChainable(0);

    // Finds appropriate classes for stat fields based on name of chainable
    $scope.getApplicableClasses = function(name) {
      var applicableClasses = [];

      switch(name) {
        case 'strength':
        case 'dexterity':
        case 'constitution':
        case 'intelligence':
        case 'wisdom':
        case 'charisma':
        case 'strength-modifier':
        case 'dexterity-modifier':
        case 'constitution-modifier':
        case 'intelligence-modifier':
        case 'wisdom-modifier':
        case 'charisma-modifier':
          applicableClasses.push('ability');
          applicableClasses.push('ability-' + name);
          break;
        case 'hp':
          applicableClasses.push('hp');
          break;
        default:
          break;
      }

      return applicableClasses.join(' ');
    };

    $scope.getAbbreviation = function(name) {
      var idx = null; 
      $scope.selectedCharacter.chainables.forEach(function(chain, i) {
        if (chain.name === name) idx = i;
      });

      if (idx !== null) {
        var chain = $scope.selectedCharacter.chainables[idx];
        switch (chain.name) {
          case 'strength':
          case 'dexterity':
          case 'constitution':
          case 'intelligence':
          case 'wisdom':
          case 'charisma':
            return chain.name.substr(0,3).toUpperCase();
            break;
          case 'hp':
          case 'ac': 
            return chain.name.toUpperCase();
            break;
          default:
            return;
        }
      }
    };

  });
