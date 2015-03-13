'use strict';

/** @module d20pal */
/* exported d20pal */
var d20pal = (function() {
  /**
   * Merge defaults with user options (courtesy of gomakethings.com)
   *
   * @private
   * @param {Object} defaults Default settings
   * @param {Object} options User options
   * @returns {Object} Merged values of defaults and options
   */
  var extend = function(defaults, options) {
      var extended = {};
      var prop;
      for (prop in defaults) {
          if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
              extended[prop] = defaults[prop];
          }
      }
      for (prop in options) {
          if (Object.prototype.hasOwnProperty.call(options, prop)) {
              extended[prop] = options[prop];
          }
      }
      return extended;
  };

  /**
   * Allows for objects to maintain a list of tags.
   *
   * @mixin
   */
  var Taggable = (function() {
    var initTags = function() {
      if (this.tags === undefined) {
        this.tags = [];
      }
    };

    /**
     * Tags an object with the first argument. Recurses through any arguments
     * that are arrays.
     *
     * @param {...(string|string[])} tagString - String object will be tagged with.
     */
    var tag = function(tagString) {
      this.initTags();
      var args = Array.prototype.slice.call(arguments);
      args.forEach(function(arg) {
        if (Array.isArray(arg)) {
          this.tag(arg);
        } else {
          this.tags.push(arg);
        }
      }, this);
    };

    /**
     * Checks if an object is tagged with tagString.
     *
     * @param {string} tagString - Tag to check for.
     * @returns {bool} Whether or not the object was tagged with the supplied tag.
     */
    var isTagged = function(tagString) {
      this.initTags();
      return this.tags.indexOf(tagString) !== -1;
    };

    return {
      tag: tag,
      isTagged: isTagged
    };
  })();

  /**
   * Creates a character.
   *
   * @constructor
   * @param {string} name - The name of the character.
   */
  var Character = function(name) {
    this.name = name;
  };

  /**
   * Changes a character's name.
   * @param {string} name - The name of the character.
   */
  Character.prototype.setName = function(name) {
    this.name = name;
  };
  
  /**
   * Returns a character's name.
   * @returns {String}
   */
  Character.prototype.getName = function() {
    return this.name;
  };

  // Make Characters taggable
  Character.prototype = extend(Character.prototype, Taggable);

  return {
    Character: Character
  };
})();
