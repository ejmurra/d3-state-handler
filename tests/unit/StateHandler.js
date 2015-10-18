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
                name: "first",
                render: function() {return true}
            });

            states.add({
                name: "second",
                render: function() {return true}
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
                nextOut: function(data) {
                    assert.notOk(data.x);
                    assert.notOk(data.x2);
                    data.x = true;
                    return data;
                },
                prevIn: function(data) {
                    assert.ok(data.x);
                    assert.notOk(data.x2);
                    data.x = false;
                    return data;
                },
                render: function(data) {
                    assert.equal(data.hello,'world');
                    return data
                }
            });
            states.add({
                name: "second",
                nextIn: function(data) {
                    assert.ok(data.x);
                    data.x2 = true;
                    return data;
                },
                prevOut: function(data) {
                    assert.ok(data.x2);
                    assert.ok(data.x);
                    data.x2 = false;
                    return data;
                },
                render: function(data) {
                    assert.equal(data.hello,'world');
                    return data
                }
            });
            states.next();
            states.prev();

        },
        jump: function() {
            states.add({
                name: 'first',
                render: function(data) {
                    assert.notOk(data.x);
                    assert.notOk(data.x2);
                    return data;
                },
                jumpOut: function(data) {
                    assert.notOk(data.x);
                    assert.notOk(data.x2);
                    data.x = true;
                    return data
                },
                jumpIn: function(data) {
                    assert.ok(data.x);
                    assert.notOk(data.x2);
                    data.x = false;
                    return data;
                }
            });
            states.add({
                name: 'second',
                render: function(data) {
                    assert.ok(data.x);
                    assert.ok(data.x2);
                    return data;
                },
                jumpIn: function(data) {
                    assert.ok(data.x);
                    assert.notOk(data.x2);
                    data.x2 = true;
                    return data;
                },
                jumpOut: function(data) {
                    assert.ok(data.x);
                    assert.ok(data.x2);
                    data.x2 = false;
                    return data;
                }
            });
            states.jumpTo('second');
            states.jumpTo('first')
        }
    })
})