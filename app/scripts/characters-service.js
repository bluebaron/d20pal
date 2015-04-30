'use strict';

angular.module('d20palApp')
  .factory('charactersService', function($q) {
    var joe = new d20pal.dnd35.DND35Character('Joe');
    window.joe = joe;

    var characters = [];

    function getCharacters() {
      return $q(function(resolve, reject) {
        if (characters.length === 0) {
          characters = [joe]; // TODO fetch characters from the backend!
          resolve(characters);
        } else {
          resolve(characters);
        }
      });
    }

    function getCharacter(name) {
      return getCharacters().then(function(fetchedCharacters) {
        var foundCharacter = null;

        for (var i = 0; i < fetchedCharacters.length; i++) {
          if (fetchedCharacters[i].name === name) {
            foundCharacter = fetchedCharacters[i];
            break;
          }
        }

        if (!foundCharacter) {
          return $q(function(resolve, reject) {
            reject('Could not find character' + name);
          });
        } else {
          return $q(function(resolve, reject) {
            resolve(foundCharacter);
          });
        }
      });
    }

    return {
      getCharacters:  getCharacters,
      getCharacter:   getCharacter
    };
  });
