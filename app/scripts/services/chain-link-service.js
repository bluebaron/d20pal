'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .factory('chainLinkService', function() {
    var editorsBaseDir = 'views/chain-link-editors/',
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

    return {
      linkTypes: knownLinkTypes
    };
  });
