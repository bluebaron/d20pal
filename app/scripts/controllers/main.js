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
    $scope.filledStatDisplayTemplate = [];

    var fillStatDisplayTemplate = function() {
      var indices = [];
      $scope.filledStatDisplayTemplate = defaultStatDisplayTemplate.map(
        function(row) {
          return row.map(function(cell) {
            var idx = $scope.selectedCharacter.chainables.map(
                        function(chainable) {
                          return chainable.name;
                        }
                      ).indexOf(cell);
            if (idx !== -1) {
              indices.push(idx);
              return $scope.selectedCharacter.chainables[idx];
            } else {
              return null;
            }
          });
        }
      ).concat($scope.selectedCharacter.chainables.filter(function(chainable, i) {
        return indices.indexOf(i) === -1;
      }).map(function(chainable) {
        return [chainable];
      }));
      console.log(indices);
    };

    $scope.isNonTemplateStat = function(index) {
      if (index >= 18) { // recursive length of defaultStatDisplayTemplate
        return true;
      } else {
        return false;
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
      fillStatDisplayTemplate();
    };

    $scope.selectCharacter(0);

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
        case 'strength':
        case 'dexterity':
        case 'constitution':
        case 'intelligence':
        case 'wisdom':
        case 'charisma':
        case 'hp':
        case 'initiative':
        case 'fortitude':
        case 'reflex':
        case 'will':
          applicableClasses.push(name);
          break;
        case 'strength-modifier':
        case 'dexterity-modifier':
        case 'constitution-modifier':
        case 'intelligence-modifier':
        case 'wisdom-modifier':
        case 'charisma-modifier':
          applicableClasses.push(name);
          applicableClasses.push(getRating($scope.selectedCharacter.getChainableByName(name).getFinal()));
          break;
        default:
          applicableClasses.push('non-template-stat');
          break;
      }

      return applicableClasses.join(' ');
    };

    window.testing = $scope;

    $scope.getDisplayName = function(name) {
      switch (name) {
        case 'strength':
        case 'dexterity':
        case 'constitution':
        case 'intelligence':
        case 'wisdom':
        case 'charisma':
        case 'reflex':
          return name.substr(0,3).toUpperCase();
        case 'strength-modifier':
        case 'dexterity-modifier':
        case 'constitution-modifier':
        case 'intelligence-modifier':
        case 'wisdom-modifier':
        case 'charisma-modifier':
          return null;
        case 'reflex':
        case 'fortitude':
        case 'will':
        case 'initiative':
          return name.substr(0,4).toUpperCase();
        case 'hp':
        case 'ac': 
          return name.toUpperCase();
        default:
          return name.toUpperCase();
      }
    };
    
    //////////////////////////////////////////////////
    // Chain management
    //////////////////////////////////////////////////
    $scope.selectedChainable = null;

    $scope.selectChainable = function(name) {
      $scope.selectedChainable = $scope.selectedCharacter.getChainableByName(name);
    };

    $scope.selectChainable('hp');

    $scope.addableChainLinkTypes = [
      {
        $constructor: d20pal.util.MultiplierChainLink,
        typeName:     'Multiplier',
        props: [
          {
            name: 'multiplier',
            type: 'number',
            representationKey: 'multiplier'
          }
        ]
      }
    ];

    $scope.addChainLink = function() {
      var args = {};
      $scope.newChainLinkType.props.forEach(function(prop) {
        args[prop.representationKey] = prop.value;
      });

      var newlink = $scope.newChainLinkType.$constructor.fromRepresentation(args);
      $scope.selectedChainable.addLink(newlink);
    };
  });
