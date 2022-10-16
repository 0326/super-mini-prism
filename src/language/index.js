import * as util from '../util';

// The grammar object for plaintext
const plainTextGrammar = {};

export const languages = {
  plain: plainTextGrammar,
  plaintext: plainTextGrammar,
  text: plainTextGrammar,
  txt: plainTextGrammar,
  extend: function (id, redef) {
    var lang = util.deepClone(languages[id]);

    for (var key in redef) {
      lang[key] = redef[key];
    }

    return lang;
  },
  insertBefore: function (inside, before, insert, root) {
    root = root || /** @type {any} */ (languages);
    var grammar = root[inside];
    /** @type {Grammar} */
    var ret = {};

    for (var token in grammar) {
      if (grammar.hasOwnProperty(token)) {

        if (token == before) {
          for (var newToken in insert) {
            if (insert.hasOwnProperty(newToken)) {
              ret[newToken] = insert[newToken];
            }
          }
        }

        // Do not insert token which also occur in insert. See #1525
        if (!insert.hasOwnProperty(token)) {
          ret[token] = grammar[token];
        }
      }
    }

    var old = root[inside];
    root[inside] = ret;

    // Update references in other language definitions
    languages.DFS(languages, function (key, value) {
      if (value === old && key != inside) {
        this[key] = ret;
      }
    });

    return ret;
  },

  // Traverse a language definition with Depth First Search
  DFS: function DFS(o, callback, type, visited) {
    visited = visited || {};

    var objId = util.objId;

    for (var i in o) {
      if (o.hasOwnProperty(i)) {
        callback.call(o, i, o[i], type || i);

        var property = o[i];
        var propertyType = util.type(property);

        if (propertyType === 'Object' && !visited[objId(property)]) {
          visited[objId(property)] = true;
          DFS(property, callback, null, visited);
        } else if (propertyType === 'Array' && !visited[objId(property)]) {
          visited[objId(property)] = true;
          DFS(property, callback, i, visited);
        }
      }
    }
  }
}
