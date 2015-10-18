import _ from 'lodash';

// polyfill object assign
if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target) {
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
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

// Error handling
function FinalState(message) {
    "use strict";
    this.name = 'FinalStateError';
    this.message = message || "There are no more states to advance to";
    this.stack = (new Error()).stack;
}
FinalState.prototype = Object.create(Error.prototype);
FinalState.prototype.constructor = FinalState;

function FirstState(message) {
    "use strict";
    this.name = 'FirstStateError';
    this.message = message || "There are no states before this one";
    this.stack = (new Error()).stack;
}
FirstState.prototype = Object.create(Error.prototype);
FirstState.prototype.constructor = FirstState;

const StateHandler = function StateHandler(opts) {
    "use strict";
    let currentIndex = 0;
    let states = [];
    let options = opts || {
            loop: false // specifies whether states should loop from end - beginning and vice versa
        };
    let data = options.data || {};
    let jumpState = options.jumpState || {};

    let currentState = () => {
        Object.assign(states[currentIndex].data,data);
        return states[currentIndex];
    };

    let start = () => {
        states[currentIndex].data = states[currentIndex].render.call(data);
        Object.assign(data, states[currentIndex].data);
    };

    let add = (state) => {
        let index = states.length;
        state.data = Object.assign({},data);
        state['__index'] = index;
        if (!state.name) state.name = String(index);
        if (typeof state.render !== 'function') throw new Error('States require a render method');
        if (typeof state.resize !== 'function') state.resize = state.render;

        states.push(state);
        return this;
    };

    let remove = (name) => {
        let index = arrayObjectIndexOf(states,name,'name');

        if (index > -1) {
            array.splice(index, 1);
        }

        return this;
    };

    let jumpTo = (name) => {
        let index = arrayObjectIndexOf(states,name,'name');
        if (index > -1) {
            try {
                currentState().jumpOut.call(data);
            } catch(e) {
                if (!e.name === 'TypeError') throw new Error(e);
            }
            //if (!_.isEqual(data,jumpState)) throw new Error('jumpOut function did not match general state spec');
            currentIndex = index;
            try {
                currentState().jumpIn.call(data);
            } catch(e) {
                if (!e.name === 'TypeError') throw new Error(e);
            }
            //if (!_.isEqual(data,jumpState)) throw new Error('jumpIn function did not match general state spec');
            currentState().render.call(data)
        } else {
            throw new Error(`State ${name} does not exist`)
        }
    };

    let next = () => {
        "use strict";
        // Call nextOut on the current state if it exists
        if (typeof states[currentIndex].nextOut !== 'undefined') data = Object.assign({},states[currentIndex].nextOut.call(data));

        // Set the current state to the next index. Loop if specified.
        if (currentIndex + 1 < states.length) {
            currentIndex += 1;
        } else if (options.loop) {
            currentIndex = 0;
        } else {
            throw new FinalState();
        }

        // Call nextIn on the new current state
        if (typeof states[currentIndex].nextIn !== 'undefined') data = Object.assign({},states[currentIndex].nextIn.call(data));

        // Call render on the new current state
        if (typeof states[currentIndex].render !== 'undefined') data = Object.assign({},states[currentIndex].render.call(data));
        states[currentIndex].data = data;
        return this;
    };

    let prev = () => {
        "use strict";
        // Call prevOut on the current state if it exists

        if (typeof states[currentIndex].prevOut !== 'undefined') data = Object.assign({},states[currentIndex].prevOut.call(data));

        // Set the current state to the previous index. Loop if specified.
        if (currentIndex - 1 >= 0) {
            currentIndex -= 1;
        } else if (options.loop) {
            currentIndex = states.length - 1;
        } else {
            throw new FirstState();
        }

        // Call prevIn on the new current state
        if (typeof states[currentIndex].prevIn !== 'undefined') data = Object.assign({},states[currentIndex].prevIn.call(data));

        // Call render on new current state;
        if (typeof states[currentIndex].render !== 'undefined') data = Object.assign({},states[currentIndex].render.call(data));
        states[currentIndex].data = data;
        return this;
    };

    let resize = () => {
        currentState.resize()
    };

    return {
        next: next,
        add: add,
        currentState: currentState,
        prev: prev,
        remove: remove,
        resize: resize,
        jumpTo: jumpTo,
        start: start
    }
};

export default StateHandler;