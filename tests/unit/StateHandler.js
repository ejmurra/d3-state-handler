define(function (require) {
    "use strict";
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var StateHandler = require('d3-state-handler');
    var states;

    registerSuite({
        name: "stateHandler",
        beforeEach: function() {
            states = StateHandler({data: {hello: "world"}, loop: true})
        },
        addStates: function() {
            states.add({
                name: "first"
            });

            states.add({
                name: "second"
            });
            assert.strictEqual(states.currentState().name, "first");
            states.next();
            assert.strictEqual(states.currentState().name, "second");
            states.next();
            assert.strictEqual(states.currentState().name, "first")
        },
        hooks: function() {
            states.add({
                name: "first",
                nextOut: function() {
                    this.x = true;
                },
                prevIn: function() {
                    this.x = false;
                }
            });
            states.add({
                name: "second",
                nextIn: function() {
                    this.x2 = true;
                },
                prevOut: function() {
                    this.x2 = false;
                }
            });
            states.next();
            assert.strictEqual(states.currentState().data.x, true);
            assert.strictEqual(states.currentState().data.x2, true);
            states.prev();
            assert.strictEqual(states.currentState().data.x, false);
            assert.strictEqual(states.currentState().data.x2, false);
        }
    })
})