'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .controller('EditChainLinkCtrl', function($scope, $routeParams, charactersService) {
    $scope.getChainLinkEditView = function() {
      var chainLink = $scope.chainTuple[0],
          editorsBaseDir = 'views/chain-link-editors/',
          knownLinkTypes = {
            'static': {
              'class': d20pal.util.StaticChainLink,
              'viewUrl': editorsBaseDir + 'static.html'
            },
            'adder': {
              'class': d20pal.util.AdderChainLink,
              'viewUrl': editorsBaseDir + 'adder.html'
            },
            'multiplier': {
              'class': d20pal.util.MultiplierChainLink,
              'viewUrl': editorsBaseDir + 'multiplier.html'
            }
          };
      
      for (var i = 0, typeNames = Object.keys(knownLinkTypes);
           i < typeNames.length;
           i++) {
        if (chainLink instanceof knownLinkTypes[typeNames[i]]['class']) {
          return knownLinkTypes[typeNames[i]].viewUrl;
        }
      }

      return null;
    };

    $scope.saveName = function() {
      $scope.chainTuple[0].setName($scope.linkName);
    };

    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.chainable = character.getChainableByName($routeParams.chainable);
      $scope.chainTuple = $scope.chainable.chainTuples[$routeParams.link];
      $scope.linkName = $scope.chainTuple[0].getName();
    });
  });
