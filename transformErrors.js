const { Map, List } = require('immutable');

/**
 * Takes either an Immutable List or Map collection and recursively reduces the
 * result to a List of strings.
 * @param {List|Map} listOrMap 
 * @returns {List<string>}
 */
function flattenValue(listOrMap) {
  return listOrMap
    .toList()
    .map(item => Map.isMap(item) ? flattenValue(item.toList()) : item)
    .flatten();
}

/**
 * Takes a List of strings and joins them into a single string with punctuation,
 * removing any duplicate messages.
 * @param {List<string>} messageList 
 * @return {string}
 */
function concatenateMessages(messageList) {
  return messageList.toSet().map(message => `${message}.`).join(' ');
}

/**
 * Takes a Map and returns a copy of it where nesting is preserved and any Lists 
 * of strings have been concatenated.
 * @param {Map} map 
 * @returns {Map}
 */
function crawlAndConcatenateMap(map) {
  return map.map(item => 
    List.isList(item) ? concatenateMessages(item) : crawlAndConcatenateMap(item)
  );
}

/**
 * Takes either a List or a Map and returns a copy of that input with messages
 * concatenated.
 * @param {List|Map} listOrMap
 * @returns {List|Map}
 */
function deeplyConcatenateMessages(listOrMap) {
  if (Map.isMap(listOrMap)) {
    return crawlAndConcatenateMap(listOrMap);
  }
  if (List.isList(listOrMap)) {
    return listOrMap.map(item => crawlAndConcatenateMap(item));
  }
  // Handle instances where this isn't a List or a Map by just returning the
  // original input. Assuming the API is well-constructed we shouldn't see this.
  console.warn('Expected a List or Map.')
  return listOrMap;
}

/**
 * Takes an Immutable Map and returns a copy of it where all message arrays have
 * been concatenated and the Map values flattened unless their key has been
 * passed in to the second List argument.
 * @param {Map} errorMap 
 * @param {List} listOfKeysToPreserveNesting 
 * @returns {Map}
 */
function transformErrors(errorMap, listOfKeysToPreserveNesting = List()) {
  return errorMap
    .mapEntries(([key, value]) => [
      key, 
      listOfKeysToPreserveNesting.includes(key) 
        ? deeplyConcatenateMessages(value)
        : concatenateMessages(flattenValue(value))
    ]);
}

module.exports = transformErrors;
