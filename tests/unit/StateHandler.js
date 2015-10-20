define(function (require) {
    "use strict";
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var StateHandler = require('d3-state-handler');
    var states;

    registerSuite({
        name: "stateHandler",
        beforeEach: function() {
            states = StateHandler()
        },
        addStates: function() {

        },
        hooks: function() {

        },
        jump: function() {

        }
    })
})