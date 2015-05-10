angular.module('d20palApp')
  .controller('EditMultiplierChainLinkCtrl', function($scope, $routeParams, charactersService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.chainable = character.getChainableByName($routeParams.chainable);
      $scope.chainLink = chainable.chainTuples[$routeParams.link][0];
      $scope.multiplier = $scope.chainLink.getMultiplier();

      $scope.saveLink = function() {
        $scope.chainLink.setMultiplier($scope.multiplier);
      });
    });
  });
