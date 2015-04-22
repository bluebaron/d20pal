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

    $scope.$watch(function(scope) {
      return $scope.selectedCharacter;
    }, function(scope) {
      $scope.fillStatDisplayTemplate();
    });

    $scope.selectedCharacter = joe;

    $scope.deleteCurrentCharacter = function() {
      if (window.confirm(
        'Are you sure you would like to delete character "' +
        $scope.selectedCharacter.getName() + '"?')) {
        $scope.characters.splice($scope.characters.indexOf($scope.selectedCharacter), 1);
        if ($scope.characters.length === 0) {
          $scope.characters.push(joe);
        }
        $scope.selectedCharacter = $scope.characters[0];
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

    $scope.fillStatDisplayTemplate = function() {
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
    };

    $scope.isNonTemplateStat = function(index) {
      if (index >= 18) { // recursive length of defaultStatDisplayTemplate
        return true;
      } else {
        return false;
      }
    };

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

    $scope.addNewChainable = function() {
      if ($scope.newChainableName && $scope.newChainableName.length > 0) {
        var newChainable = new d20pal.Chainable($scope.newChainableName);
        newChainable.addLink(new d20pal.util.StaticChainLink('default first link', 0));

        $scope.selectedCharacter.addChainable(newChainable);
        $scope.filledStatDisplayTemplate.push([newChainable]);
        console.log($scope.selectedCharacter);
      }
    };
  });
