import * as util from './util';
import { Token, tokenize } from './token';
import { hooks } from './hooks';
import { languages } from './language';
import { addHtml } from './language/html';
import { addCss } from './language/css';
import { addClike } from './language/clike';
import { addJs } from './language/js';
import fileHighlightPlugin from './plugin/file-highlight';

export function main(_self) {
  var _ = {
    Token,
		disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
    manual: _self.Prism && _self.Prism.manual,
    hooks,
    tokenize,
    languages,
    plugins: {},
  };

  _.highlightAll = function (async, callback) {
    _.highlightAllUnder(document, async, callback);
  };
  _.highlightAllUnder = function (container, async, callback) {
    var env = {
      callback: callback,
      container: container,
      selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    };

    _.hooks.run('before-highlightall', env);

    env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

    _.hooks.run('before-all-elements-highlight', env);

    for (var i = 0, element; (element = env.elements[i++]);) {
      _.highlightElement(element, async === true, env.callback);
    }
  };
  _.highlightElement = function (element, async, callback) {
    // Find language
    var language = util.getLanguage(element);
    var grammar = _.languages[language];

    // Set language on the element, if not present
    util.setLanguage(element, language);

    // Set language on the parent, for styling
    var parent = element.parentElement;
    if (parent && parent.nodeName.toLowerCase() === 'pre') {
      util.setLanguage(parent, language);
    }

    var code = element.textContent;

    var env = {
      element: element,
      language: language,
      grammar: grammar,
      code: code
    };

    function insertHighlightedCode(highlightedCode) {
      env.highlightedCode = highlightedCode;

      _.hooks.run('before-insert', env);

      env.element.innerHTML = env.highlightedCode;

      _.hooks.run('after-highlight', env);
      _.hooks.run('complete', env);
      callback && callback.call(env.element);
    }

    _.hooks.run('before-sanity-check', env);

    // plugins may change/add the parent/element
    parent = env.element.parentElement;
    if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
      parent.setAttribute('tabindex', '0');
    }

    if (!env.code) {
      _.hooks.run('complete', env);
      callback && callback.call(env.element);
      return;
    }

    _.hooks.run('before-highlight', env);

    if (!env.grammar) {
      insertHighlightedCode(util.encode(env.code));
      return;
    }

    if (async && _self.Worker) {
      var worker = new Worker(_.filename);

      worker.onmessage = function (evt) {
        insertHighlightedCode(evt.data);
      };

      worker.postMessage(JSON.stringify({
        language: env.language,
        code: env.code,
        immediateClose: true
      }));
    } else {
      insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    }
  }
  _.highlight = function (text, grammar, language) {
    var env = {
      code: text,
      grammar: grammar,
      language: language
    };
    _.hooks.run('before-tokenize', env);
    if (!env.grammar) {
      throw new Error('The language "' + env.language + '" has no grammar.');
    }
    env.tokens = _.tokenize(env.code, env.grammar);
    _.hooks.run('after-tokenize', env);

    return Token.stringify(util.encode(env.tokens), env.language);
  }

	_self.Prism = _;

	if (!_self.document) {
		if (!_self.addEventListener) {
			// in Node.js
			return _;
		}

		if (!_.disableWorkerMessageHandler) {
			// In worker
			_self.addEventListener('message', function (evt) {
				var message = JSON.parse(evt.data);
				var lang = message.language;
				var code = message.code;
				var immediateClose = message.immediateClose;

				_self.postMessage(_.highlight(code, _.languages[lang], lang));
				if (immediateClose) {
					_self.close();
				}
			}, false);
		}

		return _;
	}

	// Get current script and highlight
	var script = util.currentScript();

	if (script) {
		_.filename = script.src;

		if (script.hasAttribute('data-manual')) {
			_.manual = true;
		}
	}

	function highlightAutomaticallyCallback() {
		if (!_.manual) {
			_.highlightAll();
		}
	}

	if (!_.manual) {
		var readyState = document.readyState;
		if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
			document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
		} else {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(highlightAutomaticallyCallback);
			} else {
				window.setTimeout(highlightAutomaticallyCallback, 16);
			}
		}
	}

  // 内置 html/css/js language
  addHtml(_);
  addCss(_);
  addClike(_);
  addJs(_);

  // 内置初始化插件
  fileHighlightPlugin();

	return _;
}
