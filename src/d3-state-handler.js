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
    "use strict";
    this.currentIndex = 0;
    this.states = [];
    let options = opts || {
            loop: false // specifies whether states should loop from end - beginning and vice versa
        };

    let currentState = () => {
        return this.states[this.currentIndex]
    };

    let add = (state) => {
        this.states.push(state)
    };

    let remove = (index) => {
        this.states.remove(index)
    };

    let next = () => {
        "use strict";
        // Call nextOut on the current state if it exists
        if (typeof currentState().nextOut === 'function') currentState().nextOut.call(currentState());

        // Set the current state to the next index. Loop if specified.
        if (this.currentIndex + 1 < this.states.length) { this.currentIndex += 1; }
        else if (options.loop) { this.currentIndex = 0; }
        else { throw new FinalState(); }

        // Call nextIn on the new current state
        if (typeof currentState().nextIn === 'function') currentState().nextIn.call(currentState());
    };

    let prev = () => {
        "use strict";
        // Call prevOut on the current state if it exists
        if (typeof currentState().prevOut === 'function') currentState().prevOut.call(currentState());

        // Set the current state to the previous index. Loop if specified.
        if (this.currentIndex - 1 >= 0) { this.currentIndex -= 1; }
        else if (options.loop) { this.currentIndex = this.states.length; }
        else { throw new FirstState(); }

        // Call prevIn on the new current state
        if (typeof currentState().nextIn === 'function') currentState().nextIn.call(currentState());
    };

    return {
        next: next,
        add: add,
        currentState: currentState,
        prev: prev,
        remove: remove
    }
};

export default StateHandler;