var d3_state_handler = {};
d3_state_handler = function (exports) {
  if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function value(target) {
        'use strict';
        if (target === undefined || target === null) {
          throw new TypeError('Cannot convert first argument to object');
        }
        var to = Object(target);
        for (var i = 1; i < arguments.length; i++) {
          var nextSource = arguments[i];
          if (nextSource === undefined || nextSource === null) {
            continue;
          }
          nextSource = Object(nextSource);
          var keysArray = Object.keys(nextSource);
          for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
            var nextKey = keysArray[nextIndex];
            var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
        return to;
      }
    });
  }
  // Stolen from http://stackoverflow.com/a/8668283
  function arrayObjectIndexOf(myArray, searchTerm, property) {
    for (var i = 0, len = myArray.length; i < len; i++) {
      if (myArray[i][property] === searchTerm)
        return i;
    }
    return -1;
  }
  var StateHandler = function StateHandler(Window, opts) {
    var _this = this;
    /*
     * Private vars
     */
    // Used to hold states and keep track of which state the user is currently interacting with
    var currentIndex = 0;
    var states = [];
    // This function just lets data flow through it unmutated. Used as a filler for missing methods on state objects
    var substitute = function substitute(data) {
      return data;
    };
    var options = opts || {
      loop: false,
      // Whether last state should hook into first state and vice versa
      init: substitute,
      // Function to run before calling the first state
      jumpState: {},
      // Contract states must adhere to when returning from jumpOut
      data: {},
      // Object passed between states. Every method on a state receives and returns a data object
      load: substitute  // Function to be called when a user loads a non-first state from a URL. This function
                  // receives data as a parameter and should return an object that is equal to jumpState.
    };
    // For easy reference and so that const is enforced by babel
    var jumpState = options.jumpState;
    // For easy reference
    var data = options.data;
    // When states register, their methods are stored in here so that they are simpler and can be added to html pushState
    var methodRegister = {};
    /*
     * Private Methods
     */
    var registerState = function registerState(state) {
      var avail = !methodRegister[state.name];
      if (!avail)
        throw new Error('State ' + state.name + ' already exists!');
      methodRegister[state.name] = {
        render: state.render,
        fromNext: state.fromNext || substitute,
        fromPrev: state.fromPrev || substitute,
        toNext: state.toNext || substitute,
        toPrev: state.toPrev || substitute,
        jumpOut: state.jumpOut || substitute,
        jumpIn: state.jumpIn || substitute,
        resize: state.resize || state.render
      };
      if (states.length)
        states[states.length - 1].next = state.name;
      state = {
        prev: states.length ? states[states.length - 1].name : null,
        name: state.name,
        next: null,
        url: '#' + _this.name
      };
      states.push(state);
      return state;
    };
    var resize = function resize() {
      var xData = Object.assign({}, data);
      xData = states[currentIndex].resize(xData);
      data = Object.assign({}, data, xData);
    };
    /*
     * Public Methods
     */
    var add = function add(state) {
      state.name = state.name || String(states.length);
      state = registerState(state);
      if (states.length === 1)
        Window.history.pushState(state, state.name, '#' + state.name);
    };
    var currentState = function currentState() {
      return states[currentIndex];
    };
    var remove = function remove(name) {
      var index = arrayObjectIndexOf(states, name, 'name');
      if (index > -1)
        array.splice(index, 1);
    };
    var loadState = function loadState(name) {
      var index = arrayObjectIndexOf(states, name, 'name');
      var targetState = states[index];
      if (index > -1) {
        var xData = options.load(Object.assign({}, data));
        // TODO: check xData against jumpState
        // Call transition methods
        xData = methodRegister[targetState.name].jumpIn(Object.assign({}, jumpState));
        xData = methodRegister[targetState.name].render(xData);
        // Clean up
        data = Object.assign({}, data, xData);
        currentIndex = index;
        Window.history.pushState(targetState, targetState.name, '#' + targetState.name);
      } else {
        throw new Error('State ' + name + ' does not exist');
      }
    };
    var jumpTo = function jumpTo(name) {
      var index = arrayObjectIndexOf(states, name, 'name');
      var currentState = states[currentIndex];
      var targetState = states[index];
      if (index > -1) {
        var xData = Object.assign({}, data);
        xData = methodRegister[currentState.name].jumpOut(xData);
        // TODO: check xData against jumpState
        // Call transition methods
        xData = methodRegister[targetState.name].jumpIn(Object.assign({}, jumpState));
        xData = methodRegister[targetState.name].render(xData);
        // Clean up
        data = Object.assign({}, data, xData);
        currentIndex = index;
        Window.history.pushState(targetState, targetState.name, '#' + targetState.name);
      } else {
        throw new Error('State ' + name + ' does not exist');
      }
    };
    var next = function next() {
      var thisState = states[currentIndex];
      var nextStateName = thisState.next;
      if (nextStateName) {
        var nextState = states[arrayObjectIndexOf(states, nextStateName, 'name')];
        var xData = Object.assign({}, data);
        // Call transition methods
        xData = methodRegister[thisState.name].toNext(xData);
        xData = methodRegister[nextState.name].fromPrev(xData);
        xData = methodRegister[nextState.name].render(xData);
        // Clean up
        data = Object.assign({}, data, xData);
        currentIndex = currentIndex + 1 < states.length ? currentIndex + 1 : 0;
        Window.history.pushState(nextState, nextState.name, '#' + nextState.name);
      } else {
        throw new Error('No state after current state (' + JSON.stringify(thisState) + ')');
      }
    };
    var prev = function prev() {
      var thisState = states[currentIndex];
      var prevStateName = thisState.prev;
      if (prevStateName) {
        var prevState = states[arrayObjectIndexOf(states, prevStateName, 'name')];
        var xData = Object.assign({}, data);
        // Cal transition methods
        xData = methodRegister[thisState.name].toPrev(xData);
        xData = methodRegister[prevState.name].fromNext(xData);
        xData = methodRegister[prevState.name].render(xData);
        // Clean up
        data = Object.assign({}, data, xData);
        currentIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : states.length - 1;
        Window.history.pushState(prevState, prevState.name, 'name');
      } else {
        throw new Error('No state before current state (' + JSON.stringify(thisState) + ')');
      }
    };
    var start = function start(fn) {
      // Set up listeners for popState and resize
      Window.addEventListener('popstate', function (e) {
        if (Window.history.state.name === null) {
          var xData = Object.assign({}, data);
          xData = !fn ? options.init(xData) : fn(xData);
          xData = states[0].render(xData);
          data = Object.assign({}, data, xData);
        } else {
          jumpTo(Window.history.state.name);
        }
      });
      Window.addEventListener('resize', function (e) {
        resize();
      });
      // Bootstrap application
      if (!Window.location.hash || Window.location.hash.slice(1) === states[0].name) {
        var xData = Object.assign({}, data);
        xData = !fn ? options.init(xData) : fn(xData);
        xData = methodRegister[states[0].name].render(xData);
        data = Object.assign({}, data, xData);
      } else {
        jumpTo(Window.history.state.name);
      }
    };
    var api = {
      next: next,
      add: add,
      currentState: currentState,
      prev: prev,
      remove: remove,
      load: loadState,
      jumpTo: jumpTo,
      start: start
    };
    return api;
  };
  exports = StateHandler;
  return exports;
}(d3_state_handler);