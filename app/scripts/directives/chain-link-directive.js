'use strict';

angular.module('d20palApp')
  .directive('dtpChainLink', function($compile, $http, chainLinkService) {
    var linkTypes = chainLinkService.linkTypes;

    function getChainLinkTemplateUrl(chainLink) {
      var keys = Object.keys(linkTypes);
      for (var i = 0; i < keys.length; i++) {
        if (chainLink instanceof linkTypes[keys[i]]['class']) {
          return linkTypes[keys[i]].viewUrl;
        }
      }

      return null;
    }

    function link(scope, elem, attrs) {
      var url = getChainLinkTemplateUrl(scope.chainLink);

      if (url) {
        $http.get(url).then(function(response) {
          console.log(response.data);
          elem.html(response.data).show();
          $compile(elem.contents())(scope);
        }, function(err) {
          console.log('Could not load template!');
        });
      }
    }

    return {
      scope: {
        chainLink: '='
      },
      link: link
    };
  });
