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
    //////////////////////////////////////////////////
    // Character Management
    //////////////////////////////////////////////////
    var joe = new d20pal.dnd35.DND35Character('Joe');
    window.joe = joe;
    $scope.characters = [joe];
    $scope.selectedCharacter = null;
    $scope.selectedChainable = null;
    $scope.addableChainLinkTypes = [
      {
        $constructor: d20pal.util.MultiplierChainLink,
        typeName:     'Multiplier'
      }
    ];

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

    //////////////////////////////////////////////////
    // Stat Display
    //////////////////////////////////////////////////
    $scope.statRows = [];
    var defaultStatDisplayTemplate = [
      ['hp', 'strength', 'strength-modifier'],
      ['ac', 'dexterity', 'dexterity-modifier'],
      ['initiative', 'constitution', 'constitution-modifier'],
      ['fortitude', 'intelligence', 'intelligence-modifier'],
      ['reflex', 'wisdom', 'wisdom-modifier'],
      ['will', 'charisma', 'charisma-modifier']
    ];
    function setStatRows(character) {
      $scope.statRows = defaultStatDisplayTemplate.map(function(row) {
        return row.map(function(cell) {
          return character.getChainableByName(cell);
        });
      });
    }

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
      setStatRows(character);
    };

    $scope.selectCharacter(0);

    $scope.selectChainable = function(name) {
      $scope.selectedChainable = $scope.selectedCharacter.getChainableByName(name);
    };

    $scope.selectChainable('hp');

    function getRating(modifier) {
      var rating = '';
      if (modifier > 0) {
        rating = 'good';
      } else if (modifier > 5) {
        rating = 'better';
      } else if (modifier > 10) {
        rating = 'great';
      } else if (modifier > 15) {
        rating = 'awesome';
      }

      return rating;
    }

    // Finds appropriate classes for stat fields based on name of chainable
    $scope.getApplicableClasses = function(name) {
      var applicableClasses = [];

      switch(name) {
        case 'strength-modifier':
        case 'dexterity-modifier':
        case 'constitution-modifier':
        case 'intelligence-modifier':
        case 'wisdom-modifier':
        case 'charisma-modifier':
          applicableClasses.push(getRating($scope.selectedCharacter.getChainableByName(name).getFinal()));
        case 'strength':
        case 'dexterity':
        case 'constitution':
        case 'intelligence':
        case 'wisdom':
        case 'charisma':
        case 'fortitude':
        case 'reflex':
        case 'will':
          applicableClasses.push(name);
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
        if (chain.name === name) {
          idx = i;
        }
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
          case 'reflex':
            return chain.name.substr(0,3).toUpperCase();
          case 'fortitude':
          case 'will':
          case 'initiative':
            return chain.name.substr(0,4).toUpperCase();
          case 'hp':
          case 'ac': 
            return chain.name.toUpperCase();
          default:
            return;
        }
      }
    };
    
    //////////////////////////////////////////////////
    // Chain management
    //////////////////////////////////////////////////
    $scope.addChainLink = function() {
      alert($scope.newChainLinkType);
    };
  });
