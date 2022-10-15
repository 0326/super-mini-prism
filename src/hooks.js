const _hooks = {
  all: {},
  add: function (name, callback) {
    var hooks = _hooks.hooks.all;

    hooks[name] = hooks[name] || [];

    hooks[name].push(callback);
  },
  run: function (name, env) {
    var callbacks = _hooks.hooks.all[name];

    if (!callbacks || !callbacks.length) {
      return;
    }

    for (var i = 0, callback; (callback = callbacks[i++]);) {
      callback(env);
    }
  }
};

export const hooks = _hooks;
