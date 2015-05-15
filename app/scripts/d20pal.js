'use strict';

/** @module d20pal */
var d20pal = (function() {
  var exports = {};

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

  var Nameable = (function() {
    var setName = function(name) {
      if (name) {
        this.name = name;
      }
    };

    var getName = function() {
      return this.name;
    };

    return {
      setName: setName,
      getName: getName
    };
  })();

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

    var removeTag = function(tagString) {
      initTags(this);
      var idx = this.tags.indexOf(tagString);
      if (idx !== -1) {
        this.tags.splice(idx, 1);
      }
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
      removeTag:    removeTag,
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
  function ChainLink(name, modifierCallback) {
    this.setName('chain-link');
    this.setName(name);
    this.setCallback(function(oldVal) { return oldVal; });
    this.setCallback(modifierCallback);
  }

  exports.ChainLink = ChainLink;

  ChainLink.prototype.setCallback = function(callback) {
    if (callback) { this.modifierCallback = callback; }
  };

  ChainLink.prototype.getCallback = function() {
    return this.modifierCallback;
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
   * Gets a string representation of the ChainLink to be used in the
   * serialization of a character.
   *
   * @returns {String} String representation of the ChainLink.
   */
  ChainLink.prototype.serialize = function() {
    this.tag(); // initializes tags in case they weren't already
    var propStr = '',
        name = this.getName();
    if (this.tags.length > 0) {
      propStr = ['tags', this.tags.join(',')].join('=');
    }
    
    Object.keys(ChainLink.types).some(function(key) {
      if (this instanceof ChainLink.types[key].$constructor) {
        ChainLink.types[key].props.forEach(function(propName) {
          var propVal;
          if (this[propName] instanceof Chainable) {
            propVal = this[propName].name;
          } else {
            propVal = this[propName].toString();
          }
          propStr += [propName, propVal].join('=') + ';';
        }, this);

        if (this.getName() !== key) {
          propStr += 'name=' + this.name;
        }

        name = key;

        return true;
      }

      return false;
    }, this);

    return [name, propStr].join(':');
  };

  ChainLink.types = {};

  ChainLink.registerType = function(name, $constructor, props) {
    ChainLink.types[name] = {
      $constructor: $constructor,
      props: props ? props : []
    };
  };

  ChainLink.fromString = function(rep, character) {
    var chainlink = null,
        type = ChainLink.types[rep.split(':')[0]];

    if (type) {
      var repObj = {
        name: rep.split(':')[0]
      };

      rep.split(':')[1].split(';').map(function(argStr) {
        return {
          key: argStr.split('=')[0],
          val: argStr.split('=')[1]
        };
      }).forEach(function(arg) {
        if (arg.key === 'tags') {
          repObj[arg.key] = arg.val.split(',');
        } else {
          repObj[arg.key] = !isNaN(parseFloat(arg.val)) ? parseFloat(arg.val) : arg.val;
        }
      });

      chainlink = type.$constructor.fromRepresentation(repObj, character);
      if (repObj.tags) {
        chainlink.tag(rep.tags);
      }
      chainlink.name = repObj.name;
    } else {
      return new ChainLink(); // TODO identity chainlink in case type not found
    }

    return chainlink;
  };

  // Make ChainLinks taggable/nameable

  ChainLink.prototype = extend(ChainLink.prototype, Nameable);
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
  function Chainable(name, initial) {
    //console.log('Instantiating Chainable ' + name + '.');
    this.setName('chainable');
    this.setName(name);

    this.setInitial(0);
    this.setInitial(initial);

    // [0] = ChainLink object
    // [1] = Priority
    // [2] = Partial evaluation of chain following this link
    this.chainTuples = [];
  }

  exports.Chainable = Chainable;

  Chainable.priorityRankIncrement = 100;

  Chainable.prototype.setInitial = function(initial) {
    if (initial !== undefined) { this.initial = initial; }
  };

  Chainable.prototype.getInitial = function() {
    return this.initial;
  };

  Chainable.prototype.evalAt = function(idx, params) {
    var curVal = this.getInitial();

    if (this.chainTuples === []) { return curVal; }

    for (var i = 0; i < idx && i < this.chainTuples.length; i++) {
      curVal = this.chainTuples[i][0].evaluate(curVal, params);
      this.chainTuples[i][2] = curVal;
    }

    return curVal;
  };

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

      for (var i = 0; i < this.chainTuples.length + 1; i++) {
        if (i === this.chainTuples.length) {
          this.chainTuples.push([newLink, priority, null]);
          break;
        } else if (priority > this.chainTuples[i][1]) {
          continue;
        } else if (priority < this.chainTuples[i][1]) {
          this.chainTuples.splice(i, 0, [newLink, priority, null]);
          break;
        } else {
          var j = i;
          while (this.chainTuples[j][1] === priority - 1) {
            priority -= 1;
            j -= 1;
          }
          break;
        }
      }
    }

    return newLink;
  };

  Chainable.prototype.swapPriorities = function(i, j) {
    if (i < 0 || j < 0 || i >= this.chainTuples.length || j >= this.chainTuples.length) {
      return false;
    }
    var temp = this.chainTuples[i];
    this.chainTuples[i] = this.chainTuples[j];
    this.chainTuples[j] = temp;
  };
  
  Chainable.prototype.getLinkCount = function() {
    return this.chainTuples.length;
  };

  /**
   * Gets value of Chainable after the last link.
   * 
   * @param {object} params - Parameters used in evaluating the Chainable.
   * @return {*} Result of evaluating every link in Chainable.
   */
  Chainable.prototype.getFinal = function(params) {
    return this.evalAt(this.getLinkCount(), params);
  };

  Chainable.prototype.removeLink = function(idx) {
    this.chainTuples.splice(idx, 1);
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
        tuple[0].serialize(),
        tuple[1] // don't bother saving partials
      ];
    });

    var obj = {
      name: this.name,
      chainTuples: chainTupleRepresentations
    };

    return obj;
  };

  Chainable.fromRepresentation = function(rep, character) {
    var chain = new Chainable(rep.name);

    rep.chainTuples.forEach(function(tuple) {
      var chainLink = ChainLink.fromString(tuple[0], character);
      chain.addLink(chainLink, tuple[1]);
    });

    return chain;
  };

  // Make Chainables Nameable
  Chainable.prototype = extend(Chainable.prototype, Nameable);

  // End of Chainable class

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
      if (!numsides) {
        return false;
      } else if (!numdice) {
        numdice = 1;
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
      if (!numsides) {
        return false;
      } else if (!numdice) {
        numdice = 1;
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

    function ReferenceChainable(name, chainableHolder, fallback) {
      Chainable.call(this, name);
      this.chainableHolder = chainableHolder;
      this.reference = null;
      this.fallback = fallback || 0;
      this.resolveReference();
    }

    ReferenceChainable.prototype = Object.create(Chainable.prototype);
    ReferenceChainable.prototype.constructor = ReferenceChainable;

    ReferenceChainable.prototype.resolveReference = function() {
      var res = this.chainableHolder.getChainableByName(this.getName());

      if (res) {
        this.reference = res;
        return true;
      } else {
        return false;
      }
    };

    ReferenceChainable.prototype.evalAt = function(idx, params) {
      if (this.reference || this.resolveReference()) {
        return this.reference.getFinal(params);
      } else {
        return this.fallback;
      }
    };

    /**
     * StaticChainLinks will output only one value, given at its creation.
     * @class
     * @extends module:d20pal.ChainLink
     * @memberof module:d20pal.util
     */
    function StaticChainLink(name, value) {
      this.value = value;
      var that = this;
      var callback = function() {
        return that.getValue();
      };
      ChainLink.call(this, name, callback);
    }
    StaticChainLink.prototype = Object.create(ChainLink.prototype);
    StaticChainLink.prototype.constructor = StaticChainLink;
    ChainLink.registerType('static', StaticChainLink, ['value']);

    StaticChainLink.prototype.setValue = function(val) {
      this.value = val;
    };

    StaticChainLink.prototype.getValue = function() {
      return this.value;
    };

    StaticChainLink.fromRepresentation = function(rep) {
      var schainlink = new StaticChainLink(rep.name, rep.value);

      return schainlink;
    };

    /**
     * MultiplierChainLinks will accept any value and return its
     * product with another value given at its creation.
     * @class
     * @extends ChainLink
     */
    function MultiplierChainLink(name, multiplier) {
      this.multiplier = multiplier;
      var that = this;
      var callback = function(oldVal) {
        return oldVal * that.getMultiplier();
      };
      ChainLink.call(this, name, callback);
    }
    MultiplierChainLink.prototype = Object.create(ChainLink.prototype);
    MultiplierChainLink.prototype.constructor = MultiplierChainLink;
    ChainLink.registerType('multiplier', MultiplierChainLink, ['multiplier']);

    MultiplierChainLink.prototype.setMultiplier = function(multiplier) {
      this.multiplier = multiplier;
    };

    MultiplierChainLink.prototype.getMultiplier = function(multiplier) {
      return this.multiplier;
    };

    MultiplierChainLink.fromRepresentation = function(rep) {
      var mchainlink = new MultiplierChainLink(rep.name, rep.multiplier);
      
      return mchainlink;
    };

    function AdderChainLink(name, addend, character) {
      if (!name) {
        if (typeof addend === 'string') {
          name = addend;
        } else if (addend instanceof Chainable) {
          name = addend.getName();
        }
      }

      this.setCharacter(new Character());
      this.setCharacter(character);

      this.setAddend(0);
      this.setAddend(addend);
      
      var callback = function(oldVal) {
            var addend = this.getAddend();
            if (addend instanceof Chainable) {
              return oldVal + addend.getFinal();
            } else {
              return oldVal + addend;
            }
          };

      ChainLink.call(this, name, callback);
    }
    AdderChainLink.prototype = Object.create(ChainLink.prototype);
    AdderChainLink.prototype.constructor = AdderChainLink;
    ChainLink.registerType('adder', AdderChainLink, ['addend']);

    AdderChainLink.prototype.setAddend = function(addend) {
      if (typeof addend === 'number' ||
          addend instanceof Chainable) {
        this.addend = addend;
      } else if (typeof addend === 'string') {
        this.addend = new util.ReferenceChainable(addend, this.getCharacter());
      }
    };

    AdderChainLink.prototype.getAddend = function() {
      if (typeof this.addend === 'string') {
        var chainables = this.character.getChainables();
        for (var i = 0; i < chainables.length; i++) {
          if (chainables[i].name === this.addend) {
            return chainables[i];
          }
        }

        return new Chainable('missing reference');
      } else {
        return this.addend;
      }
    };

    AdderChainLink.prototype.getAddendName = function() {
      if (typeof this.addend === 'string') { return this.addend; }
      else if (this.addend instanceof Chainable) {
        return this.addend.getName();
      }
    };

    AdderChainLink.prototype.setCharacter = function(character) {
      if (character instanceof Character) { this.character = character; }
    };

    AdderChainLink.prototype.getCharacter = function() {
      return this.character;
    };

    AdderChainLink.prototype.getRepresentation = function() {
      var rep = ChainLink.prototype.getRepresentation.call(this),
          addend = this.getAddend();

      if (addend instanceof Chainable) {
        rep.addend = addend.getName();

        // Remove redundant name in rep (and thus JSON) as, by default, a
        // dynamic AdderChainLink's name is the name of its addend.
        if (rep.name === rep.addend) {
          delete rep.name;
        }
      } else {
        rep.addend = this.addend;
      }

      return rep;
    };

    AdderChainLink.fromRepresentation = function(rep, character) {
      return new AdderChainLink(rep.name, rep.addend, character);
    };

    return {
      ReferenceChainable:   ReferenceChainable,
      StaticChainLink:      StaticChainLink,
      MultiplierChainLink:  MultiplierChainLink,
      AdderChainLink:       AdderChainLink,
      Dice:                 Dice
    };
  })();

  exports.util = util;

  // End of util namespace

  /**
   * Creates a character.
   *
   * @constructor
   * @param {string} name - The name of the character.
   * @mixes module:d20pal.Taggable
   * @memberof module:d20pal
   */
  function Character(name) {
    this.name = name || 'New Character';
    this.tag('character');
  }

  exports.Character = Character;

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

  Character.prototype.getChainables = function() {
    return this.chainables.slice();
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
    //////////////////////////////////////////////////
    // Base Attack Bonus ChainLinks
    //////////////////////////////////////////////////

    function GoodBABChainLink() {
      ChainLink.call(this, 'good base attack bonus', GoodBABChainLink.callback);
      this.tag('good-bab');
    }
    GoodBABChainLink.prototype = Object.create(ChainLink.prototype);
    GoodBABChainLink.prototype.constructor = GoodBABChainLink;
    ChainLink.registerType('good-bab', GoodBABChainLink);
    
    GoodBABChainLink.fromRepresentation = function(rep) {
      return new GoodBABChainLink();
    };

    GoodBABChainLink.callback = function(oldVal) {
      return oldVal;
    };

    function AverageBABChainLink() {
      ChainLink.call(this, 'average base attack bonus', AverageBABChainLink.callback);
      this.tag('average-bab');
    }
    AverageBABChainLink.prototype = Object.create(ChainLink.prototype);
    AverageBABChainLink.prototype.constructor = AverageBABChainLink;
    ChainLink.registerType('average-bab', AverageBABChainLink);

    AverageBABChainLink.fromRepresentation = function(rep) {
      return new AverageBABChainLink();
    };

    AverageBABChainLink.callback = function(oldVal) {
      if (oldVal === 1) {
        return 0;
      }

      var shifted = oldVal - 1,
          remainder = shifted % 4,
          result = shifted + (remainder===0?-1:0);

      return result;
    };

    function PoorBABChainLink() {
      ChainLink.call(this, 'poor base attack bonus', PoorBABChainLink.callback);
      this.tag('poor-bab');
    }
    PoorBABChainLink.prototype = Object.create(ChainLink.prototype);
    PoorBABChainLink.prototype.constructor = PoorBABChainLink;
    ChainLink.registerType('poor-bab', PoorBABChainLink);

    PoorBABChainLink.fromRepresentation = function(rep) {
      return new PoorBABChainLink();
    };

    PoorBABChainLink.callback = function(oldVal) {
      return Math.floor(oldVal / 2);
    };

    var baseAttackBonuses = {
      good:     GoodBABChainLink,
      average:  AverageBABChainLink,
      poor:     PoorBABChainLink
    };

    function randomFrom(arr) {
      return arr[Math.floor(Math.random()*arr.length)];
    }

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
    };

    function Class(name, hitDie, baseAttackBonusType, statOrder) {
      this.name = name;
      this.hitDie = new util.Dice('d' + hitDie);
      this.statOrder = statOrder || '012345';
      this.baseAttackBonusType = baseAttackBonusType;
    }

    Class.prototype.applyToCharacter = function(character) {
      var maxHitDie = new util.AdderChainLink('max hit die', this.hitDie.numsides),
          consMod   = new util.AdderChainLink(null, 'constitution-modifier', character),
          hp = character.getChainableByName('hp'),
          baseAttackBonus = character.getChainableByName('base-attack-bonus'),
          babLink = new this.baseAttackBonusType(); 
      
      hp.addLink(maxHitDie);
      hp.addLink(consMod);
      baseAttackBonus.addLink(babLink);
    };

    Class.prototype.orderScores = function(scores) {
      var sortedScores = scores.sort(function(a,b){return a>b;}),
          ret = this.statOrder.split('').map(function(sortedScoresIdx) {
            return sortedScores[sortedScoresIdx];
          });

      return ret;
    };

    var races = {
      human: new Race('human', 0),
      dwarf: new Race('dwarf', 0),
      elf: new Race('elf', 0),
      gnome: new Race('gnome', 1),
      halfElf: new Race('half-elf', 0),
      halfOrc: new Race('half-orc', 0),
      halfling: new Race('halfling', 1)
    };

    var classes = {
      barbarian: new Class('barbarian', 12, baseAttackBonuses.good, '543120'),
      bard: new Class('bard', 6, baseAttackBonuses.good, '041325'),
      cleric: new Class('cleric', 8, baseAttackBonuses.average, '214053'),
      druid: new Class('druid', 8, baseAttackBonuses.average, '320451'),
      fighter: new Class('fighter', 10, baseAttackBonuses.good, '543210'),
      monk: new Class('monk', 8, baseAttackBonuses.average, '342150'),
      paladin: new Class('paladin', 10, baseAttackBonuses.good, '421035'),
      ranger: new Class('ranger', 8, baseAttackBonuses.good, '452130'),
      rogue: new Class('rogue', 6, baseAttackBonuses.average, '152430'),
      sorceror: new Class('sorceror', 4, baseAttackBonuses.poor, '043215'),
      wizard: new Class('wizard', 4, baseAttackBonuses.poor, '043521')
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

    function rollAbilityScores(reRollIfBad) {
      var result = null;
      do {
        result = '123456'.split('').map(function() {
          return util.Dice.highestOf('4d6', 3).reduce(function(p,c){return p+c;});
        }); // jshint ignore:line
      } while (reRollIfBad && Math.max.apply(null, result) <= 13);
      
      return result;
    }

    function DND35Character(name, race, _class, scores, secondaryClass) {
      if (typeof name === 'object') {
        var params = name;
        name = params.name;
        race = params.race;
        _class = params._class;
        scores = params.scores;
      }

      Character.call(this, name);

      this.race = race ? race : races.human;
      this._class = _class ? _class : classes.barbarian;
      this.secondaryClass = secondaryClass ? secondaryClass : null;

      var strength         = new Chainable('strength'),
          dexterity        = new Chainable('dexterity'),
          constitution     = new Chainable('constitution'),
          intelligence     = new Chainable('intelligence'),
          wisdom           = new Chainable('wisdom'),
          charisma         = new Chainable('charisma');

      var strengthmod      = new Chainable('strength-modifier'),
          dexteritymod     = new Chainable('dexterity-modifier'),
          intelligencemod  = new Chainable('intelligence-modifier'),
          constitutionmod  = new Chainable('constitution-modifier'),
          wisdommod        = new Chainable('wisdom-modifier'),
          charismamod      = new Chainable('charisma-modifier');
    
      var hp = new Chainable('hp'),
          ac = new Chainable('ac');

      var fortitude = new Chainable('fortitude'),
          reflex = new Chainable('reflex'),
          will = new Chainable('will');
    
      var initiative = new Chainable('initiative');

      var xp = new Chainable('xp'),
          characterLevel = new Chainable('character-level'),
          classLevel = new Chainable('class-level'),
          secondaryClassLevel = new Chainable('secondary-class-level');

      var baseAttackBonus = new Chainable('base-attack-bonus');
    
      var baseSaveFort = new Chainable('base-save-fortitude'),
          baseSaveRef = new Chainable('base-save-reflex'),
          baseSaveWill = new Chainable('base-save-will');

      var classSkillMaxRanks = new Chainable('class-skill-max-ranks'),
          crossClassMaxSkillRanks = new Chainable('cross-class-skill-max-ranks');

      this.chainables = [
        hp, ac, initiative,
        strength, strengthmod,
        dexterity, dexteritymod,
        constitution, constitutionmod,
        intelligence, intelligencemod,
        wisdom, wisdommod,
        charisma, charismamod,
        fortitude, reflex, will,
        xp, characterLevel, classLevel, secondaryClassLevel,
        baseAttackBonus,
        baseSaveFort, baseSaveRef, baseSaveWill
      ];

      if (!scores) {
        var score = new util.StaticChainLink('default ability score', 10);
        scores = [];

        for (var i = 0; i < 6; i++) {
          scores.push(score);
        }
      } else {
        scores = scores.map(function(scoreValue) {
          return new util.AdderChainLink('ability score', scoreValue);
        }, this);
      }

      strength.addLink(scores[0]);
      dexterity.addLink(scores[1]);
      constitution.addLink(scores[2]);
      intelligence.addLink(scores[3]);
      wisdom.addLink(scores[4]);
      charisma.addLink(scores[5]);

      var abilityModifier = new AbilityModifierChainLink();

      strengthmod.addLink(new util.AdderChainLink(null, strength));
      strengthmod.addLink(abilityModifier);
      dexteritymod.addLink(new util.AdderChainLink(null, dexterity));
      dexteritymod.addLink(abilityModifier);
      constitutionmod.addLink(new util.AdderChainLink(null, constitution));
      constitutionmod.addLink(abilityModifier);
      intelligencemod.addLink(new util.AdderChainLink(null, intelligence));
      intelligencemod.addLink(abilityModifier);
      wisdommod.addLink(new util.AdderChainLink(null, wisdom));
      wisdommod.addLink(abilityModifier);
      charismamod.addLink(new util.AdderChainLink(null, charisma));
      charismamod.addLink(abilityModifier);

      ac.addLink(new util.StaticChainLink('initial ac', 10));
      ac.addLink(new util.AdderChainLink(null, 'armor-bonus', this));
      ac.addLink(new util.AdderChainLink(null, 'shield-bonus', this));
      ac.addLink(new util.AdderChainLink(null, 'size-modifier', this));
      ac.addLink(new util.AdderChainLink(null, 'dexterity-modifier', this));

      fortitude.addLink(new util.StaticChainLink('default fortitude', 13));
      reflex.addLink(new util.StaticChainLink('default reflex', 13));
      will.addLink(new util.StaticChainLink('default will', 13));

      initiative.addLink(new util.AdderChainLink(null, dexteritymod));

      xp.addLink(new util.StaticChainLink('earned xp', 0));
      characterLevel.addLink(new util.AdderChainLink(null, xp));
      characterLevel.addLink(new ChainLink('levels earned', function(xp) {
        var xpNeeded = 0,
            level,
            change = 1000;
        for (level = 1; xp >= xpNeeded; level++) {
          xpNeeded += level * change;
        }

        return level - 1;
      })); 

      baseAttackBonus.addLink(new util.AdderChainLink(null, classLevel));

      this.race.applyToCharacter(this);
      this._class.applyToCharacter(this);
    }
    DND35Character.prototype = Object.create(Character.prototype);
    DND35Character.prototype.constructor = DND35Character;

    function generateCharacter(params) {
      var defaults = {
        name:   'New Character',
        race:   null,
        _class: null,
        reRoll: true,
        scores: null,
        sortScores: true
      };

      params = extend(defaults, params);

      var keys = Object.keys(races);
      if (params.race === null) {
        params.race = races[keys[keys.length * Math.random() << 0]]; // jshint ignore:line
      }
      keys = Object.keys(classes);
      if (params._class === null) {
        params._class = classes[keys[keys.length * Math.random() << 0]]; // jshint ignore:line
      }

      if (params.scores === null) {
        var scores = rollAbilityScores(params.reRoll);
        if (params.sortScores) { 
          scores = params._class.orderScores(scores);
        }

        params.scores = scores;
      }

      return new DND35Character(params);
    }

    return {
      races:              races,
      classes:            classes,
      DND35Character:     DND35Character,
      generateCharacter:  generateCharacter,
      AbilityModifierChainLink: AbilityModifierChainLink
    };
  })();

  exports.dnd35 = dnd35;

  return exports;
})();
