const _hooks = {
  all: {},
};
_hooks.add = function (name, callback) {
  var hooks = _hooks.all;
  hooks[name] = hooks[name] || [];
  hooks[name].push(callback);
};
_hooks.run = function (name, env) {
  var callbacks = _hooks.all[name];
  if (!callbacks || !callbacks.length) {
    return;
  }
  for (var i = 0, callback; (callback = callbacks[i++]);) {
    callback(env);
  }
}

export const hooks = _hooks;
