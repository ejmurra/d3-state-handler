// Error handling
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function FinalState(message) {
    "use strict";
    this.name = 'FinalStateError';
    this.message = message || "There are no more states to advance to";
    this.stack = new Error().stack;
}
FinalState.prototype = Object.create(Error.prototype);
FinalState.prototype.constructor = FinalState;

function FirstState(message) {
    "use strict";
    this.name = 'FirstStateError';
    this.message = message || "There are no states before this one";
    this.stack = new Error().stack;
}
FirstState.prototype = Object.create(Error.prototype);
FirstState.prototype.constructor = FirstState;

var StateHandler = function StateHandler(opts) {
    "use strict";
    "use strict";
    var currentIndex = 0;
    var states = [];
    var options = opts || {
        loop: false // specifies whether states should loop from end - beginning and vice versa
    };

    var currentState = function currentState() {
        return states[currentIndex];
    };

    var add = function add(state) {
        states.push(state);
    };

    var remove = function remove(index) {
        states.remove(index);
    };

    var next = function next() {
        "use strict";
        // Call nextOut on the current state if it exists
        if (typeof currentState().nextOut === 'function') currentState().nextOut.call(currentState());

        // Set the current state to the next index. Loop if specified.
        if (currentIndex + 1 < states.length) {
            currentIndex += currentIndex;
        } else if (options.loop) {
            currentIndex = 0;
        } else {
            throw new FinalState();
        }

        // Call nextIn on the new current state
        if (typeof currentState().nextIn === 'function') currentState().nextIn.call(currentState());
    };

    var prev = function prev() {
        "use strict";
        // Call prevOut on the current state if it exists
        if (typeof currentState().prevOut === 'function') currentState().prevOut.call(currentState());

        // Set the current state to the previous index. Loop if specified.
        if (currentIndex - 1 >= 0) {
            currentIndex -= currentIndex;
        } else if (options.loop) {
            currentIndex = states.length;
        } else {
            throw new FirstState();
        }

        // Call prevIn on the new current state
        if (typeof currentState().nextIn === 'function') currentState().nextIn.call(currentState());
    };

    return {
        next: next,
        add: add,
        currentState: currentState,
        prev: prev,
        remove: remove
    };
};

exports["default"] = StateHandler;
module.exports = exports["default"];
//# sourceMappingURL=d3-state-handler.js.map