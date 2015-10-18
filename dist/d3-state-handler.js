define(["exports", "module"], function (exports, module) {
    // Error handling
    "use strict";

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

        var _this = this;

        var currentIndex = 0;
        var states = [];
        var options = opts || {
            loop: false // specifies whether states should loop from end - beginning and vice versa
        };
        var data = options.data || {};

        var currentState = function currentState() {
            return states[currentIndex];
        };

        var add = function add(state) {
            state['__index'] = currentIndex;
            if (!state.name) state.name = String(currentIndex);
            states.push(state);

            return _this;
        };

        var remove = function remove(name) {
            var index = states.indexOf(states.filter(function (state) {
                return state.name === String(name);
            }));

            if (index > -1) {
                array.splice(index, 1);
            }

            return _this;
        };

        var next = function next() {
            "use strict";
            // Call nextOut on the current state if it exists
            if (typeof currentState().nextOut === 'function') currentState().nextOut.call(data);

            // Set the current state to the next index. Loop if specified.
            if (currentIndex + 1 < states.length) {
                currentIndex += 1;
            } else if (options.loop) {
                currentIndex = 0;
            } else {
                throw new FinalState();
            }

            // Call nextIn on the new current state
            if (typeof currentState().nextIn === 'function') currentState().nextIn.call(data);

            // Call run on the new current state
            if (typeof currentState().run === 'function') currentState().run();
            return _this;
        };

        var prev = function prev() {
            "use strict";
            // Call prevOut on the current state if it exists
            if (typeof currentState().prevOut === 'function') currentState().prevOut.call(data);

            // Set the current state to the previous index. Loop if specified.
            if (currentIndex - 1 >= 0) {
                currentIndex -= 1;
            } else if (options.loop) {
                currentIndex = states.length;
            } else {
                throw new FirstState();
            }

            // Call prevIn on the new current state
            if (typeof currentState().nextIn === 'function') currentState().nextIn.call(data);

            // Call run on new current state;
            if (typeof currentState().run === 'function') currentState().run();
            return _this;
        };

        return {
            next: next,
            add: add,
            currentState: currentState,
            prev: prev,
            remove: remove
        };
    };

    module.exports = StateHandler;
});
//# sourceMappingURL=d3-state-handler.js.map