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
    /**
     * Tags an object with the first argument. Recurses through any arguments
     * that are arrays.
     *
     * @param {...(string|string[])} tagString - String object will be tagged with.
     */

    function initTags(obj) {
      if (obj.tags === undefined) {
        obj.tags = [];
      }
    }

    var tag = function(tagString) {
      initTags(this);
      var args = Array.prototype.slice.call(arguments);
      args.forEach(function(arg) {
        if (Array.isArray(arg)) {
          this.tag.apply(this, arg);
        } else {
          if (this.tags.indexOf(arg) === -1) {
            this.tags.push(arg);
          }
        }
      }, this);
    };

    /**
     * Checks if an object is tagged with the supplied tags. Will check all
     * arrays, including nested arrays. Can't see why that'd be necessary
     * though.
     *
     * @param {...(string|string[])} tagString - Tags to check for.
     * @returns {bool} Whether or not the object was tagged with the supplied tags.
     */
    var isTagged = function(tagString) {
      initTags(this);
      var args = Array.prototype.slice.call(arguments);
      return args.every(function(arg) {
        if (Array.isArray(arg)) {
          // Recurse into array
          return isTagged.apply(this, arg);
        } else {
          // Base case
          if (this.tags.indexOf(arg) !== -1) {
            return true;
          } else {
            return false;
          }
        }
      }, this);
    };

    return {
      tag: tag,
      isTagged: isTagged
    };
  })(); // end of Taggable definition

  /**
   * Creates a ChainLink for use with Chainable instances.
   * 
   * @constructor
   * @param {ChainLink~modifierCallback | number} - A function accepting a value
   * appropriate for the Chainable that performs some calculation on it
   * and returns the new value. If a number is supplied, a function will be
   * created that only returns that number.
   */
  var ChainLink = function(modifierCallback) {
    if (typeof modifierCallback === 'number') {
      this.modifierCallback = function(oldVal) {
        return modifierCallback; // actually returns the number
      };
    } else {
      this.modifierCallback = modifierCallback;
    }
  };

  /**
   * Evaluates the link's callback on the supplied value and returns the
   * new value.
   * 
   * @param {*} oldVal - Prior value, handed to this link.
   * @returns {*} Value after evaluating callback on parameter.
   */
  ChainLink.prototype.evaluate = function(oldVal) {
    return this.modifierCallback(oldVal);
  };

  /**
   * Creates a Chainable with the supplied name.
   *
   * @constructor
   * @param {string} name - Name of the property that is chainable.
   * 
   * @classdesc Chainables are properties than can be calculated by taking
   * some base value and passing it through multiple functions in a defined
   * order determined by each link's priority.
   */
  var Chainable = function(name) {
    this.name = name;
    this.chainLinks = [];
  };

  Chainable.prototype.addLink = function(newLink, priority) {
    newLink.priority = priority;

    var res = this.chainLinks.every(function(curLink, i) {
      if (priority > curLink.priority) {
        return true;
      } else {
        if (priority === curLink.priority) {
          // Priorities are the same; try again with next highest
          return this.addLink(newLink, priority+1);
        }

        this.chainLinks.splice(i, 0, newLink);
        return false;
      }
    }, this);

    if (res) { // newLink is lowest priority
      this.chainLinks.push(newLink);
    }

    return newLink;
  };

  /**
   * Creates a character.
   *
   * @constructor
   * @param {string} name - The name of the character.
   */
  var Character = function(name) {
    this.name = name;
    this.strength = new Chainable('strength');
    this.initstrength = new ChainLink(100);
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
