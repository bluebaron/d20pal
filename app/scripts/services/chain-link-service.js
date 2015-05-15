'use strict';

/* global d20pal: false */
angular.module('d20palApp')
  .factory('chainLinkService', function() {
    var editorsBaseDir = 'views/',
        knownLinkTypes = {
          'static': {
            'class': d20pal.util.StaticChainLink,
            'viewUrl': editorsBaseDir + 'static-chain-link.html'
          },
          'adder': {
            'class': d20pal.util.AdderChainLink,
            'viewUrl': editorsBaseDir + 'adder-chain-link.html'
          },
          'multiplier': {
            'class': d20pal.util.MultiplierChainLink,
            'viewUrl': editorsBaseDir + 'multiplier-chain-link.html'
          }
        };

    return {
      linkTypes: knownLinkTypes
    };
  });
