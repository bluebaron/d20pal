'use strict';

/** @module d20pal */
var d20pal = (function() {
  /**
   * Merge defaults with user options (courtesy of gomakethings.com)
   *
   * @private
   * @param {Object} defaults Default settings
   * @param {Object} options User options
   * @returns {Object} Merged values of defaults and options
   * @memberof module:d20pal
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
   * @memberof module:d20pal
   */
  var Taggable = (function() {

    /**
     * Initializes the internal array of tags.
     * @param {Object} obj - Object whose array is to be initialized.
     * @memberof module:d20pal.Taggable
     */
    function initTags(obj) {
      if (obj.tags === undefined) {
        obj.tags = [];
      }
    }

    /**
     * Tags an object with the first argument. Recurses through any arguments
     * that are arrays.
     *
     * @param {...(string|string[])} tagString - String object will be tagged with.
     * @memberof module:d20pal.Taggable
     */
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
     * @memberof module:d20pal.Taggable
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
   * @param {ChainLink~modifierCallback | *} - A function accepting a value
   * appropriate for the Chainable that performs some calculation on it
   * and returns the new value. If a non-function is supplied, this chain
   * link will simply return the value, no matter what the arguments are.
   * @memberof module:d20pal
   */
  var ChainLink = function(modifierCallback) {
    console.log('Instantiating ChainLink.');
    if (typeof modifierCallback !== 'function') {
      console.log('Non-function modifierCallback.');
      this.modifierCallback = function(oldVal) {
        console.log('ChainLink default non-function modifierCallback called; returning value ' + modifierCallback);
        return modifierCallback; // actually returns the number
      };
    } else {
      console.log('Typical modifierCallback.');
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
  ChainLink.prototype.evaluate = function(oldVal, params) {
    console.log('ChainLink evaluate method called.');

    var ret = this.modifierCallback(oldVal, params);
    console.log(oldVal, params, ret);
    return ret;
  };

  /**
   * Callback used as part of the ChainLink class.
   * @callback ChainLink~modifierCallback
   * @param {*} oldVal - value passed to this function from prior ChainLink.
   * @param {object} params - Parameters used in calculation.
   * @returns {*} Value returned should, in almost all cases, be the same
   * type as `oldVal`.
   * @alias module:d20pal.ChainLink~modifierCallback
   */

  /**
   * Creates a Chainable with the supplied name.
   *
   * @constructor
   * @param {string} name - Name of the property that is chainable.
   * @param {Chainable} [startsWith] - Another Chainable whose final value is
   * found before beginning to evaluate the current one; the result is passed
   * to the first ChainLink in the created Chainable instance each time its
   * value is requested.
   * 
   * @classdesc Chainables are properties than can be calculated by taking
   * some base value and passing it through multiple functions in a defined
   * order determined by each link's priority.
   * @memberof module:d20pal
   */
  var Chainable = function(name) {
    console.log('Instantiating Chainable ' + name + '.');
    this.name = name;
    if (arguments.length > 1) {
      this.startChain = arguments[1];
      console.log('Start chain included: ' + arguments[1].name);
    } else {
      this.startChain = null;
      console.log('Independent chain.');
    }

    this.chainLinks = [];
  };

  Chainable.prototype.addLink = function(newLink, priority) {
    console.log('Adding link to Chainable "' + this.name + '"');
    newLink.priority = priority;

    var res = this.chainLinks.every(function(curLink, i) {
      if (priority > curLink.priority) {
        return true;
      } else {
        if (priority === curLink.priority) {
          // Priorities are the same; try again with next highest
          this.addLink(newLink, priority+1);
          return false;
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

  Chainable.prototype.getFinal = function(params) {
    var curVal = null;
    if (this.startChain) {
      curVal = this.startChain.getFinal(params);
    }
    this.chainLinks.forEach(function(link) {
      curVal = link.evaluate(curVal, params);
    }, this);

    return curVal;
  };

  /**
   * Creates a character.
   *
   * @constructor
   * @param {string} name - The name of the character.
   * @mixes module:d20pal.Taggable
   * @memberof module:d20pal
   */
  var Character = function(name) {
    this.name = name;

    var defaultAbilityScore = new ChainLink(10);
    var doubler = new ChainLink(function(oldVal){return oldVal*2});
    var abilityModifier = new ChainLink(function(oldVal){return Math.floor(oldVal/2)-5});

    this.strength         = new Chainable('strength');
    this.strengthmod      = new Chainable('strength-modifier', this.strength);
    this.dexterity        = new Chainable('dexterity');
    this.dexteritymod     = new Chainable('dexterity-modifier', this.dexterity);
    this.constitution     = new Chainable('constitution');
    this.constitutionmod  = new Chainable('constitution-modifier', this.constitution);
    this.intelligence     = new Chainable('intelligence');
    this.intelligencemod  = new Chainable('intelligence-modifier', this.intelligence);
    this.wisdom           = new Chainable('wisdom');
    this.wisdommod        = new Chainable('wisdom-modifier', this.wisdom);
    this.charisma         = new Chainable('charisma');
    this.charismamod      = new Chainable('charisma-modifier', this.charisma);

    this.strength.addLink(defaultAbilityScore, 0);
    this.strengthmod.addLink(abilityModifier, 0);
    this.dexterity.addLink(defaultAbilityScore, 0);
    this.dexteritymod.addLink(abilityModifier, 0);
    this.constitution.addLink(defaultAbilityScore, 0);
    this.constitutionmod.addLink(abilityModifier, 0);
    this.intelligence.addLink(defaultAbilityScore, 0);
    this.intelligencemod.addLink(abilityModifier, 0);
    this.wisdom.addLink(defaultAbilityScore, 0);
    this.wisdommod.addLink(abilityModifier, 0);
    this.charisma.addLink(defaultAbilityScore, 0);
    this.charismamod.addLink(abilityModifier, 0);

    this.abilities = [
      this.strength, this.strengthmod,
      this.dexterity, this.dexteritymod,
      this.constitution, this.constitutionmod,
      this.intelligence, this.intelligencemod,
      this.wisdom, this.wisdommod,
      this.charisma, this.charismamod
    ];
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
