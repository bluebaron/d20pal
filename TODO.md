Todo
====

*   Get ChainLink callback to register with jsdoc.
*   Change chain-related buttons to feature icons with chains/links in them?
*   Change granularity of multiplier field
*   Change new chain link section to dynamically load microforms for each type
*   Make registerType register type tags as well so they can be omitted in JSON format if their type is known
*   Include doc generation in Gruntfile
*   Make everything more encapsulated
*   Write some friggin unit tests
*   Figure out why character paste box will not animate
*   Add the capability to disable specific links in the chain, making them output what is input no matter what
*   Write documentation when things have settled a bit
*   Change ChainLink constructor to check if it is being called from the constructor of a registered type so that it is automatically appropriately tagged and serialization can be simplified by always calling the superclass method in the overriding method to eliminate redundancy
*   Create a subclass of ChainLink for links whose only unique feature is that they have a specific callback function whose getRepresentation method would only return a string, saving unnecessary nested objects in the JSON representation (SimpleChainLink)
*   Create and register a new subclass of ChainLink for calculation of levels from xp
