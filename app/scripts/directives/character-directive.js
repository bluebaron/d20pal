'use strict';

angular.module('d20palApp')
  .directive('dtpCharacter', function(charactersService) {
    var characterTemplatesDir = 'views/';

    function getCharacterTemplate(elem, attr) {
      return characterTemplatesDir + 'character-' + 'default.html';
    }

    return {
      scope: {
        character: '=',
      },
      restrict: 'EA',
      templateUrl: getCharacterTemplate
    };
  });
