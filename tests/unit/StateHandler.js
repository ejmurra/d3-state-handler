define(function (require) {
    "use strict";
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var StateHandler = require('d3-state-handler');

    registerSuite({
        name: "stateHandler",
        addStates: function() {
            var states = StateHandler();
            console.log(states);
            states.add({
                name: "first"
            });

            states.add({
                name: "second"
            });
            console.log(states.currentState())
            assert.strictEqual(states.currentState().name, "first");
            assert.strictEqual(states.next().currentState().name, "second");
            assert.strictEqual(states.prev().currentState().name, "first")
        }
    })
})