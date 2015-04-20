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
      tag:          tag,
      isTagged:     isTagged
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
  var ChainLink = function(name, modifierCallback) {
    this.name = name || 'chainlink';
    this.modifierCallback = modifierCallback || function(){return null;};
  };

  /**
   * Evaluates the link's callback on the supplied value and returns the
   * new value.
   * 
   * @param {*} oldVal - Prior value, handed to this link.
   * @returns {*} Value after evaluating callback on parameter.
   */
  ChainLink.prototype.evaluate = function(oldVal, params) {
    //console.log('ChainLink evaluate method called.');

    var ret = this.modifierCallback(oldVal, params);
    //console.log(oldVal, params, ret);
    return ret;
  };

  /**
   * Gets an object representation of the ChainLink to be used in the
   * serialization of a character.
   *
   * @returns {Object} Object representation of the ChainLink.
   */
  ChainLink.prototype.getRepresentation = function() {
    this.tag(); // initializes tags in case they weren't already

    var obj = {
      name: this.name,
      tags: this.tags
    };

    return obj;
  };

  ChainLink.registerType = function(name, $constructor) {
    if (ChainLink.types === undefined) {
      ChainLink.types = [];
    }

    ChainLink.types.push({
      name: name,
      $constructor: $constructor
    });
  };

  ChainLink.fromRepresentation = function(rep, character) {
    var type = 'default',
        res = ChainLink.types.filter(function(type) {
          return rep.tags.indexOf(type.name) !== -1;
        }),
        chainlink = null;
    if (res.length > 0) {
      chainlink = res[0].$constructor.fromRepresentation(rep, character);
    } else {
      chainlink = new ChainLink(rep.name);
    }

    chainlink.tag(rep.tags);

    return chainlink;
  };

  // Make ChainLinks taggable

  ChainLink.prototype = extend(ChainLink.prototype, Taggable);

  /**
   * Callback used as part of the ChainLink class.
   * @callback ChainLink~modifierCallback
   * @param {*} oldVal - value passed to this function from prior ChainLink.
   * @param {object} params - Parameters used in calculation.
   * @returns {*} Value returned should, in almost all cases, be the same
   * type as `oldVal`.
   * @alias module:d20pal.ChainLink~modifierCallback
   */

  // End of ChainLink class

  /**
   * Namespace for extra classes useful for most d20-based games
   * @namespace
   * @memberof module:d20pal
   */
  var util = (function() {
    /**
     * Represents a set of dice as described by dicestr.
     *
     * @class
     * @memberof module:d20pal.util
     * @param {String} dicestr - String describing set of dice, in typical
     * d20 notation.
     */
    function Dice(dicestr) {
      this.dicestr = dicestr;
    }

    Dice.prototype.roll = function() {
      var res = this.dicestr.match(/(\d*)d(\d+)((\+|-)(\d+))?/);
      if (res === null) {
        return false;
      }
      var numdice   = parseInt(res[1]),
          numsides  = parseInt(res[2]),
          addend    = parseInt(res[3]);
      if (!(numdice && numsides && addend)) {
        return false;
      }

      var total = 0;
      for (var i = 0; i < numdice; i++) {
        var rolledvalue = Math.floor(Math.random() * numsides);
        total += rolledvalue;
      }

      return total;
    };

    /**
     * StaticChainLinks will output only one value, given at its creation.
     * @class
     * @extends module:d20pal.ChainLink
     * @memberof module:d20pal.util
     */
    function StaticChainLink(name, value) {
      this.value = value;
      var callback = function(){return value;};
      ChainLink.call(this, name, callback);
      this.tag('static');
    }
    StaticChainLink.prototype = Object.create(ChainLink.prototype);
    StaticChainLink.prototype.constructor = StaticChainLink;
    ChainLink.registerType('static', StaticChainLink);

    StaticChainLink.fromRepresentation = function(rep) {
      var schainlink = new StaticChainLink(rep.name, rep.value);
      schainlink.tag(rep.tags);

      return schainlink;
    };

    StaticChainLink.prototype.getRepresentation = function() {
      var rep = ChainLink.prototype.getRepresentation.call(this);
      rep.value = this.value;

      return rep;
    };

    /**
     * MultiplierChainLinks will accept any value and return its
     * product with another value given at its creation.
     * @class
     * @extends ChainLink
     */
    function MultiplierChainLink(name, multiplier) {
      this.multiplier = multiplier;
      var callback = function(oldVal){return oldVal*multiplier;};
      ChainLink.call(this, name, callback);
      this.tag('multiplier');
    }
    MultiplierChainLink.prototype = Object.create(ChainLink.prototype);
    MultiplierChainLink.prototype.constructor = MultiplierChainLink;
    ChainLink.registerType('multiplier', MultiplierChainLink);

    MultiplierChainLink.fromRepresentation = function(rep) {
      var mchainlink = new MultiplierChainLink(rep.name, rep.multiplier);
      mchainlink.tag(rep.tags);
      
      return mchainlink;
    };

    MultiplierChainLink.prototype.getRepresentation = function() {
      var rep = ChainLink.prototype.getRepresentation.call(this);
      rep.multiplier = this.multiplier;

      return rep;
    };

    function AdderChainLink(name, addend, character) {
      this.addend = addend;
      this.character = character;
      var callback = null;
      if (typeof addend === 'number') { // Addend is just a number
        callback = function(oldVal) {
          return oldVal + addend;
        };
        this.tag('static-adder');
      } else if (typeof addend === 'string') { // Dynamic addend
        var chain = character.getChainableByName(addend);
        if (chain === null) {
          throw 'Could not find chainable "' + addend + '" on character "' +
                character.getName() + '".';
        }

        callback = function(oldVal, params) {
          return oldVal + chain.getFinal(params);
        };
        this.tag('dynamic-adder');
      }

      ChainLink.call(this, name, callback);
      this.tag('adder');
    }
    AdderChainLink.prototype = Object.create(ChainLink.prototype);
    AdderChainLink.prototype.constructor = AdderChainLink;
    ChainLink.registerType('adder', AdderChainLink);

    AdderChainLink.prototype.getRepresentation = function() {
      var rep = ChainLink.prototype.getRepresentation.call(this);
      if (this.isTagged('dynamic-adder')) {
        rep.type = 'dynamic';
        rep.addend = this.addend.name;
      } else {
        rep.type = 'static';
        rep.addend = this.addend;
      }
    };

    AdderChainLink.fromRepresentation = function(rep, character) {
      var addend = null;
      if (rep.type === 'static') {
        addend = rep.addend;
      } else if (rep.type === 'dynamic') {
        addend = character.getChainableByName(rep.addend);
      }

      if (!addend) {
        return null;
      }

      return new AdderChainLink(rep.name, addend, character);
    };

    return {
      StaticChainLink:      StaticChainLink,
      MultiplierChainLink:  MultiplierChainLink,
      AdderChainLink:       AdderChainLink,
      Dice:                 Dice
    };
  })();

  // End of util namespace

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
  var Chainable = function(name, startChain) {
    //console.log('Instantiating Chainable ' + name + '.');
    this.name = name || 'chainable';
    this.startChain = startChain || null;

    this.chainLinks = [];
  };

  /**
   * Adds a ChainLink to the Chainable.
   *
   * @param {ChainLink} newLink - Link to be added to the Chainable.
   * @param {number} priority - Priority at which the link will be evaluated;
   * lower priority links will be evaluated first.
   * @return {ChainLink} The new link.
   */
  Chainable.prototype.addLink = function(newLink, priority) {
    //console.log('Adding link to Chainable "' + this.name + '"');
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

  /**
   * Gets value of Chainable after the last link.
   * 
   * @param {object} params - Parameters used in evaluating the Chainable.
   * @return {*} Result of evaluating every link in Chainable.
   */
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
   * Gets the results of each ChainLink's evaluation.
   *
   * @param {object} params - Parameters used in chainable calculation.
   * @return {array} Array of intermediate values used in evaluating
   * the Chainable.
   */
  Chainable.prototype.getIntermediaries = function(params) {
    var curVal = null;
    if (this.startChain) {
      curVal = this.startChain.getFinal(params);
    }

    var intermediaries = [];

    this.chainLinks.forEach(function(link) {
      curVal = link.evaluate(curVal, params);
      intermediaries.push(curVal);
    }, this);

    return intermediaries;
  };

  /**
   * Gets an object representation of the Chainable for use in the
   * serialization of a character.
   *
   * @returns {Object} Object representation of Chainable.
   */
  Chainable.prototype.getRepresentation = function() {
    var chainlinks = this.chainLinks.map(function(chainlink) {
      return chainlink.getRepresentation();
    });

    var obj = {
      name: this.name,
      chainlinks: chainlinks
    };

    if (this.startChain) {
      obj.startChain = this.startChain.name;
    }

    return obj;
  };

  Chainable.fromRepresentation = function(rep, character) {
    var startChain = null,
        chain = null;

    if (rep.startChain) {
      startChain = character.getChainableByName(rep.startChain);
      chain = new Chainable(rep.name, startChain);
    } else {
      chain = new Chainable(rep.name);
    }

    rep.chainlinks.forEach(function(linkRep) {
      var chainlink = ChainLink.fromRepresentation(linkRep, character);
      chain.addLink(chainlink, linkRep.priority);
    });

    return chain;
  };

  // End of Chainable class

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

  /**
   * Gets a serialized representation of a character so that it can be saved
   * and stored offline or anywhere else and loaded later.
   *
   * @returns {String} JSON representation of the Character.
   */
  Character.prototype.serialize = function() {
    var chainables = this.chainables.map(function(chainable) {
      return chainable.getRepresentation();
    });
    
    var obj = {
      name: this.name,
      tags: this.tags,
      chainables: chainables
    };

    return JSON.stringify(obj);
  };
  
  /**
   * Creates a character from a JSON representation.
   * @param {String} str - JSON string containing character information.
   * @returns {Character} The character described by the JSON string.
   */
  Character.fromString = function(str) {
    var obj = JSON.parse(str),
        character = new Character(obj.name);

    character.tags = [];
    character.tag(obj.tags);
    character.chainables = [];
    for (var i = 0; i < obj.chainables.length; i++) {
      character.chainables.push(Chainable.fromRepresentation(obj.chainables[i], character));
    }

    return character;
  };

  /**
   * Gets a named Chainable owned by a character.
   * @param {String} name - Name of Chainable sought.
   * @returns {Chainable|null} Chainable if it was found, null otherwise.
   */
  Character.prototype.getChainableByName = function(name) {
    for (var i = 0; i < this.chainables.length; i++) {
      if (this.chainables[i].name === name) {
        return this.chainables[i];
      }
    }
  };

  // Make Characters taggable
  Character.prototype = extend(Character.prototype, Taggable);

  // End of Character class

  /**
   * Namespace for all classes related to DnD 3.5.
   * @namespace
   * @memberof module:d20pal
   */
  var dnd35 = (function() {
    /**
     * A chain link that accepts an ability score and outputs its
     * corresponding ability modifier.
     * @class
     * @extends module:d20pal.Chainable
     */
    function AbilityModifierChainLink() {
      var name = 'ability modifier',
          callback = function(oldVal) {
            return Math.floor(oldVal/2)-5;
          };

      ChainLink.call(this, name, callback);
      this.tag('ability-modifier');
    }
    AbilityModifierChainLink.prototype = Object.create(ChainLink.prototype);
    AbilityModifierChainLink.prototype.constructor = AbilityModifierChainLink;
    ChainLink.registerType('ability-modifier', AbilityModifierChainLink);

    AbilityModifierChainLink.fromRepresentation = function(rep) {
      var link = new AbilityModifierChainLink();
      return link;
    };

    function DND35Character(name) {
      Character.call(this, name);

      var hp = new Chainable('hp');
      var ac = new Chainable('ac');
      hp.addLink(new util.StaticChainLink('default hp', 12), 0);
      ac.addLink(new util.StaticChainLink('default ac', 12), 0);

      var fortitude = new Chainable('fortitude');
      var reflex = new Chainable('reflex');
      var will = new Chainable('will');

      fortitude.addLink(new util.StaticChainLink('default fortitude', 13));
      reflex.addLink(new util.StaticChainLink('default reflex', 13));
      will.addLink(new util.StaticChainLink('default will', 13));

      var strength         = new Chainable('strength');
      var strengthmod      = new Chainable('strength-modifier', strength);
      var dexterity        = new Chainable('dexterity');
      var dexteritymod     = new Chainable('dexterity-modifier', dexterity);
      var constitution     = new Chainable('constitution');
      var constitutionmod  = new Chainable('constitution-modifier', constitution);
      var intelligence     = new Chainable('intelligence');
      var intelligencemod  = new Chainable('intelligence-modifier', intelligence);
      var wisdom           = new Chainable('wisdom');
      var wisdommod        = new Chainable('wisdom-modifier', wisdom);
      var charisma         = new Chainable('charisma');
      var charismamod      = new Chainable('charisma-modifier', charisma);

      var abilityModifier = new AbilityModifierChainLink(),
          defaultAbilityScore = new util.StaticChainLink('default ability score', 10),
          doubler = new util.MultiplierChainLink('doubler', 2);

      strength.addLink(defaultAbilityScore, 0);
      strengthmod.addLink(abilityModifier, 0);
      dexterity.addLink(defaultAbilityScore, 0);
      dexteritymod.addLink(abilityModifier, 0);
      constitution.addLink(defaultAbilityScore, 0);
      constitutionmod.addLink(abilityModifier, 0);
      intelligence.addLink(defaultAbilityScore, 0);
      intelligencemod.addLink(abilityModifier, 0);
      wisdom.addLink(defaultAbilityScore, 0);
      wisdommod.addLink(abilityModifier, 0);
      charisma.addLink(/*defaultAbilityScore*/new util.StaticChainLink('default charisma', 15), 0);
      charismamod.addLink(abilityModifier, 0);
      charismamod.addLink(doubler, 200); // TODO: remove, this is only for testing

      var initiative = new Chainable('initiative', dexterity);

      this.chainables = [
        hp, ac, initiative,
        strength, strengthmod,
        dexterity, dexteritymod,
        constitution, constitutionmod,
        intelligence, intelligencemod,
        wisdom, wisdommod,
        charisma, charismamod,
        fortitude, reflex, will
      ];
    }
    DND35Character.prototype = Object.create(Character.prototype);
    DND35Character.prototype.constructor = DND35Character;

    return {
      DND35Character: DND35Character,
      AbilityModifierChainLink: AbilityModifierChainLink
    };
  })();

  // Exporting module's public fields
  return {
    Character:  Character,
    Chainable:  Chainable,
    ChainLink:  ChainLink,
    util:       util,
    dnd35:      dnd35
  };
})();
