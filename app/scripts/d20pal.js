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
      this.numdice = null;
      this.numsides = null;
      this.addend = null;

      this.parse();
    }

    Dice.parse = function (dicestr) {
      var res = dicestr.match(/(\d*)d(\d+)((\+|-)(\d+))?/);
      if (res === null) {
        return false;
      }
      var numdice   = parseInt(res[1]),
          numsides  = parseInt(res[2]),
          addend    = res[3]?parseInt(res[3]):null;
      if (!(numdice && numsides)) {
        return false;
      }
      
      return {
        numdice:  numdice,
        numsides: numsides,
        addend:   addend
      };
    };

    Dice.prototype.parse = function (dicestr) {
      var res = this.dicestr.match(/(\d*)d(\d+)((\+|-)(\d+))?/);
      if (res === null) {
        return false;
      }
      var numdice   = parseInt(res[1]),
          numsides  = parseInt(res[2]),
          addend    = res[3]?parseInt(res[3]):null;
      if (!(numdice && numsides)) {
        return false;
      }

      this.numdice = numdice;
      this.numsides = numsides;
      this.addend = addend;
      
      return {
        numdice:  numdice,
        numsides: numsides,
        addend:   addend
      };
    };

    Dice.roll = function(dicestr) {
      var numdice   = null,
          numsides  = 6,
          addend    = null;

      if (typeof dicestr === 'number') {
        numdice = arguments[0];

        if (arguments.length > 1) {
          numsides = arguments[1];
          
          if (arguments.length > 2) {
            addend = arguments[2];
          }
        }
      } else {
        var res = Dice.parse(dicestr);
        if (!res) {
          return false;
        }
        numdice = res.numdice;
        numsides = res.numsides;
        addend = res.addend;
      }

      var total = 0;
      for (var i = 0; i < numdice; i++) {
        var rolledvalue = Math.floor(Math.random() * numsides) + 1;
        total += rolledvalue;
      }

      if (addend) {
        total += addend;
      }

      return total;
    };

    Dice.highestOf = function(dicestr, num) {
      var results = [],
          dice = Dice.parse(dicestr);
      
      if (!dice) {
        return false;
      }

      for (var i = 0; i < dice.numdice; i++) {
        results.push(Dice.roll(1, dice.numsides, dice.addend));
      }

      return results.sort(function(a,b){return a>b;}).slice(-num);
    };

    Dice.prototype.roll = function() {
      return Dice.roll(this.dicestr);
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
      var addend = null,
          name = null;
      if (rep.type === 'static') {
        addend = rep.addend;
        name = addend.toString() + ' adder';
      } else if (rep.type === 'dynamic') {
        addend = character.getChainableByName(rep.addend);
        name = rep.addend.name + ' adder';
      }

      if (!addend) {
        return null;
      }

      return new AdderChainLink(name, addend, character);
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

    // [0] = ChainLink object
    // [1] = Priority
    // [2] = Partial evaluation of chain following this link
    this.chainTuples = [];
  };

  Chainable.priorityRankIncrement = 100;

  Chainable.prototype.nextLowestPriorityRank = function() {
    if (this.chainTuples.length === 0) {
      return Chainable.priorityRankIncrement;
    } else {
      var lowest = this.chainTuples[this.chainTuples.length-1][1],
          incr = Chainable.priorityRankIncrement,
          nextLowestRank = lowest - (lowest % incr) + incr;

      return nextLowestRank;
    }
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
    if (priority === undefined) {
      priority = this.nextLowestPriorityRank();
      this.chainTuples.push([newLink, priority, null]);
    } else {
      if (this.chainTuples.length === 0) {
        this.chainTuples.push([newLink, priority, null]);
      }

      for (var i = 0; i < this.chainTuples.length; i++) {
        if (priority > this.chainTuples[i][1]) {
          continue;
        } else if (priority < this.chainTuples[i][1]) {
          this.chainTuples.splice(i, 0, [newLink, priority, null]);
        } else {
          var j = i;
          while (this.chainTuples[j][1] === priority - 1) {
            priority -= 1;
            j -= 1;
          }
        }
      }
    }

    this.getFinal();

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
    this.chainTuples.forEach(function(tuple) {
      curVal = tuple[0].evaluate(curVal, params);
      tuple[2] = curVal;
    }, this);

    return curVal;
  };

  /**
   * Gets an object representation of the Chainable for use in the
   * serialization of a character.
   *
   * @returns {Object} Object representation of Chainable.
   */
  Chainable.prototype.getRepresentation = function() {
    var chainTupleRepresentations = this.chainTuples.map(function(tuple) {
      return [
        tuple[0].getRepresentation(),
        tuple[1] // don't bother saving partials
      ];
    });

    var obj = {
      name: this.name,
      chainTuples: chainTupleRepresentations
    };

    if (this.startChain) {
      obj.startChain = this.startChain.name;
    }

    return obj;
  };

  Chainable.fromRepresentation = (function() {
    // function-local static
    var neededStartChains = [];

    return function(rep, character) {
      var chain = null;

      if (rep.startChain) { // startChain is not yet loaded
        var startChain = character.getChainableByName(rep.startChain);

        if (!startChain) {
          if (neededStartChains[rep.name]) {
            neededStartChains[rep.name].push(rep);
          } else {
            neededStartChains[rep.name] = [rep];
          }

          chain = new Chainable(rep.name);
        } else { // Character already has startChain
          chain = new Chainable(rep.name, startChain);
        }
      } else { // no startChain necessary
        chain = new Chainable(rep.name);

        if (neededStartChains[rep.name]) {
          neededStartChains[rep.name].forEach(function(chainMissingStart) {
            console.log('hey');
            chainMissingStart.startChain = chain;
          });
        }
      }

      rep.chainTuples.forEach(function(tuple) {
        var chainLink = ChainLink.fromRepresentation(tuple[0], character);
        chain.addLink(chainLink, tuple[1]);
      });

      return chain;
    };
  })();

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
    this.name = name || 'New Character';
    this.tag('character');
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
   * Adds a chainable to a Character's chainable list.
   * @param {Chainable} chainable - Chainable instance to be added.
   */
  Character.prototype.addChainable = function(chainable) {
    this.chainables.push(chainable);
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
    var obj = null, character = null;

    try {
      obj = JSON.parse(str);
      character = new Character(obj.name);
    } catch (e) {
      return false;
    }

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

    return null;
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
    var raceInfo = {
      'human': {
        apply: function(character) {
          var sizeModifierChainable = new Chainable('size-modifier'),
              sizeModifierLink = new util.StaticChainLink('size modifier', 0);
          sizeModifierLink.tag('race', 'human', 'size');
          sizeModifierChainable.addLink(sizeModifierLink);
          character.addChainable(sizeModifierChainable);
        }
      },
      'dwarf': {
        apply: function(character) {
          var sizeModifierChainable = new Chainable('size-modifier'),
              sizeModifierLink = new util.StaticChainLink('size modifier', 0);
          sizeModifierLink.tag('race', 'dwarf', 'size');
          sizeModifierChainable.addLink(sizeModifierLink);
          character.addChainable(sizeModifierChainable);
        }
      'elf': {
        apply: function(character) {
          var sizeModifierChainable = new Chainable('size-modifier'),
              sizeModifierLink = new util.StaticChainLink('size modifier', 0);
          sizeModifierLink.tag('race', 'elf', 'size');
          sizeModifierChainable.addLink(sizeModifierLink);
          character.addChainable(sizeModifierChainable);
        }
      },
      'gnome': {
        sizeModifier: 1
        apply: function(character) {
          var sizeModifierChainable = new Chainable('size-modifier'),
              sizeModifierLink = new util.StaticChainLink('size modifier', 1);
          sizeModifierLink.tag('race', 'gnome', 'size');
          sizeModifierChainable.addLink(sizeModifierLink);
          character.addChainable(sizeModifierChainable);
        }
      },
      'halfling': {
        sizeModifier: 1
        apply: function(character) {
        }
      },
      'half-elf': {
        apply: function(character) {
        }
      },
      'half-orc': {
        apply: function(character) {
        }
      }
    };

    function Race(name, sizeModifier) {
      this.name = name;
      this.sizeModifier = sizeModifier;
    }

    Race.prototype.applyToCharacter = function(character) {
      var sizeModifierChainable = new Chainable('size-modifier'),
          sizeModifierLink = new util.StaticChainLink('size modifier', this.sizeModifier);
      sizeModifierLink.tag(this.name, 'race', 'size');
      sizeModifierChainable.addLink(sizeModifierLink);
      character.addChainable(sizeModifierChainable);
    }

    var classInfo = {
      'barbarian': {
        hitDie: 12
      },
      'bard': {
        hitDie: 6
      },
      'cleric': {
        hitDie: 8
      },
      'druid': {
        hitDie: 8
      },
      'fighter': {
        hitDie: 10
      },
      'monk': {
        hitDie: 8
      },
      'paladin': {
        hitDie: 10
      },
      'ranger': {
        hitDie: 8
      },
      'rogue': {
        hitDie: 6
      },
      'sorceror': {
        hitDie: 4
      },
      'wizard': {
        hitDie: 4
      }
    };

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

    function rollAbilityScores() {
      return '123456'.split('').map(function() {
        return util.Dice.highestOf('4d6', 3).reduce(function(p,c){return p+c;});
      });
    }

    function DND35Character(name, race, _class) {
      Character.call(this, name);

      if (race && raceInfo[race]) {
        this.race = race;
      }
      if (_class && classInfo[_class]) {
        this._class = class;
      }

      var strength         = new Chainable('strength'),
          dexterity        = new Chainable('dexterity'),
          constitution     = new Chainable('constitution'),
          intelligence     = new Chainable('intelligence'),
          wisdom           = new Chainable('wisdom'),
          charisma         = new Chainable('charisma');

      var score = new util.StaticChainLink('default ability score', 10);

      strength.addLink(score);
      dexterity.addLink(score);
      constitution.addLink(score);
      intelligence.addLink(score);
      wisdom.addLink(score);
      charisma.addLink(score);

      var strengthmod      = new Chainable('strength-modifier', strength);
      var dexteritymod     = new Chainable('dexterity-modifier', dexterity);
      var intelligencemod  = new Chainable('intelligence-modifier', intelligence);
      var constitutionmod  = new Chainable('constitution-modifier', constitution);
      var wisdommod        = new Chainable('wisdom-modifier', wisdom);
      var charismamod      = new Chainable('charisma-modifier', charisma);

      var abilityModifier = new AbilityModifierChainLink();

      strengthmod.addLink(abilityModifier);
      dexteritymod.addLink(abilityModifier);
      constitutionmod.addLink(abilityModifier);
      intelligencemod.addLink(abilityModifier);
      wisdommod.addLink(abilityModifier);
      charismamod.addLink(abilityModifier);

      var hp = new Chainable('hp');
      var ac = new Chainable('ac');

      var fortitude = new Chainable('fortitude');
      var reflex = new Chainable('reflex');
      var will = new Chainable('will');

      fortitude.addLink(new util.StaticChainLink('default fortitude', 13));
      reflex.addLink(new util.StaticChainLink('default reflex', 13));
      will.addLink(new util.StaticChainLink('default will', 13));

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

    function generateCharacter(params) {
      var defaults = {
        name:   'New Character',
        race:   null,
        _class: null,
        reRoll: true
      };

      params = extend(defaults, params);
    }

    return {
      DND35Character: DND35Character,
      generateCharacter: generateCharacter,
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
