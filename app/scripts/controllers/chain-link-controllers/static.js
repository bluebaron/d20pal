angular.module('d20palApp')
  .controller('EditStaticChainLinkCtrl', function($scope, $routeParams, charactersService) {
    charactersService.getCharacter($routeParams.character).then(function(character) {
      $scope.character = character;
      $scope.chainable = character.getChainableByName($routeParams.chainable);
      $scope.chainLink = $scope.chainable.chainTuples[$routeParams.link][0];
      $scope.staticVal = $scope.chainLink.getValue();

      $scope.saveLink = function() {
        $scope.chainLink.setValue($scope.staticVal);
      };
    })
  });
