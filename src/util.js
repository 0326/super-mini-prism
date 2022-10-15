export function encode(tokens) {
  if (tokens instanceof Token) {
    return new Token(tokens.type, encode(tokens.content), tokens.alias);
  } else if (Array.isArray(tokens)) {
    return tokens.map(encode);
  } else {
    return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
  }
}

export function type(o) {
  return Object.prototype.toString.call(o).slice(8, -1);
}

export function objId(obj) {
  if (!obj['__id']) {
    Object.defineProperty(obj, '__id', { value: ++uniqueId });
  }
  return obj['__id'];
}

export function clone(o, visited) {
  visited = visited || {};

  var clone; var id;
  switch (_.util.type(o)) {
    case 'Object':
      id = _.util.objId(o);
      if (visited[id]) {
        return visited[id];
      }
      clone = /** @type {Record<string, any>} */ ({});
      visited[id] = clone;

      for (var key in o) {
        if (o.hasOwnProperty(key)) {
          clone[key] = deepClone(o[key], visited);
        }
      }

      return /** @type {any} */ (clone);

    case 'Array':
      id = _.util.objId(o);
      if (visited[id]) {
        return visited[id];
      }
      clone = [];
      visited[id] = clone;

      (/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
        clone[i] = deepClone(v, visited);
      });

      return /** @type {any} */ (clone);

    default:
      return o;
  }
}

export function getLanguage(element) {
  while (element) {
    var m = lang.exec(element.className);
    if (m) {
      return m[1].toLowerCase();
    }
    element = element.parentElement;
  }
  return 'none';
}

export function setLanguage(element, language) {
  // remove all `language-xxxx` classes
  // (this might leave behind a leading space)
  element.className = element.className.replace(RegExp(lang, 'gi'), '');

  // add the new `language-xxxx` class
  // (using `classList` will automatically clean up spaces for us)
  element.classList.add('language-' + language);
}

export function currentScript() {
  if (typeof document === 'undefined') {
    return null;
  }
  if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
    return /** @type {any} */ (document.currentScript);
  }
  try {
    throw new Error();
  } catch (err) {
    var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
    if (src) {
      var scripts = document.getElementsByTagName('script');
      for (var i in scripts) {
        if (scripts[i].src == src) {
          return scripts[i];
        }
      }
    }
    return null;
  }
}

export function isActive(element, className, defaultActivation) {
  var no = 'no-' + className;

  while (element) {
    var classList = element.classList;
    if (classList.contains(className)) {
      return true;
    }
    if (classList.contains(no)) {
      return false;
    }
    element = element.parentElement;
  }
  return !!defaultActivation;
}
