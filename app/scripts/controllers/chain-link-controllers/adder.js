'use strict';

angular.module('d20palApp')
  .controller('EditAdderChainLinkCtrl', function($scope, $routeParams, charactersService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.chainable = character.getChainableByName($routeParams.chainable);
      $scope.chainLink = $scope.chainable.chainTuples[$routeParams.link][0];
      $scope.addendType = (typeof $scope.chainLink.addend === 'number')?'static':'dynamic';

      if ($scope.addendType === 'static') {
        $scope.staticAddend = $scope.chainLink.getAddend();
      } else {
        $scope.dynamicAddend = $scope.chainLink.getAddendName();
      }

      $scope.saveLink = function() {
        var addend = null;
        if ($scope.addendType === 'static') {
          addend = $scope.staticAddend;
        } else {
          addend = $scope.dynamicAddend;
        }

        $scope.chainLink.setAddend(addend);
      };
    });
  });
