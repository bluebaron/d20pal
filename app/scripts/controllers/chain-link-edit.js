'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .controller('EditChainLinkCtrl', function($scope, $routeParams, charactersService, chainLinkService) {
    $scope.getChainLinkEditView = function() {
      var chainLink = $scope.chainTuple[0],
          linkTypes = chainLinkService.linkTypes;
      
      for (var i = 0, typeNames = Object.keys(linkTypes);
           i < typeNames.length;
           i++) {
        if (chainLink instanceof linkTypes[typeNames[i]]['class']) {
          return linkTypes[typeNames[i]].viewUrl;
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
