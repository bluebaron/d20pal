'use strict';

angular.module('d20palApp')
  .directive('dtpCharacter', function(charactersService) {
    var characterTemplatesDir = 'scripts/directives/views/';

    function getCharacterTemplate(elem, attr) {
      return characterTemplatesDir + 'default.html';
    }

    return {
      scope: {
        character: '=',
      },
      restrict: 'EA',
      templateUrl: getCharacterTemplate
    };
  });
