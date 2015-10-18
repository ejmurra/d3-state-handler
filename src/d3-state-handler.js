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
        return states[currentIndex];
    };

    let start = () => {
        let xData = Object.assign({},data);
        xData = states[currentIndex].render(xData);
        data = Object.assign({},data,xData);
    };

    let add = (state) => {
        let index = states.length;
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
        let xData = Object.assign({},data);
        if (index > -1) {
            try {
                xData = states[currentIndex].jumpOut(xData);
            } catch(e) {
                if (!e.name === 'TypeError') throw new Error(e);
            }

            // Here we should test xData against jumpState

            currentIndex = index;
            try {
                xData = states[currentIndex].jumpIn(xData);
            } catch(e) {
                if (!e.name === 'TypeError') throw new Error(e);
            }

            // Again, we should test xData against jumpState

            xData = states[currentIndex].render(xData);
            data = Object.assign({},data,xData);
        } else {
            throw new Error(`State ${name} does not exist`)
        }
    };

    let next = () => {
        "use strict";
        let xData = Object.assign({},data);
        // Call nextOut on the current state if it exists
        if (typeof states[currentIndex].nextOut !== 'undefined') xData = Object.assign({},states[currentIndex].nextOut(xData));

        // Set the current state to the next index. Loop if specified.
        if (currentIndex + 1 < states.length) {
            currentIndex += 1;
        } else if (options.loop) {
            currentIndex = 0;
        } else {
            throw new FinalState();
        }

        // Call nextIn on the new current state
        if (typeof states[currentIndex].nextIn !== 'undefined') xData = Object.assign({},states[currentIndex].nextIn(xData));

        // Call render on the new current state
        if (typeof states[currentIndex].render !== 'undefined') xData = Object.assign({},states[currentIndex].render(xData));
        data = Object.assign({},data,xData);
        return this;
    };

    let prev = () => {
        "use strict";
        let xData = Object.assign({},data);
        // Call prevOut on the current state if it exists
        if (typeof states[currentIndex].prevOut !== 'undefined') xData = Object.assign({},states[currentIndex].prevOut(xData));

        // Set the current state to the previous index. Loop if specified.
        if (currentIndex - 1 >= 0) {
            currentIndex -= 1;
        } else if (options.loop) {
            currentIndex = states.length - 1;
        } else {
            throw new FirstState();
        }

        // Call prevIn on the new current state
        if (typeof states[currentIndex].prevIn !== 'undefined') xData = Object.assign({},states[currentIndex].prevIn(xData));

        // Call render on new current state;
        if (typeof states[currentIndex].render !== 'undefined') xData = Object.assign({},states[currentIndex].render(xData));
        data = Object.assign({},data,xData);
        return this;
    };

    let resize = () => {
        let xData = Object.assign({},data);
        xData = states[currentIndex].resize(xData);
        data = Object.assign({},data,xData);
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