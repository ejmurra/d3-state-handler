define(function (require) {
    "use strict";
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var StateHandler = require('d3-state-handler');
    var states;

    registerSuite({
        name: "stateHandler",
        beforeEach: function() {
            states = StateHandler({data: {hello: "world"}, loop: true, jumpState: {goodbye: 'world'}})
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
                nextOut: function() {
                    this.x = true;
                },
                prevIn: function() {
                    this.x = false;
                },
                render: function() {return true}
            });
            states.add({
                name: "second",
                nextIn: function() {
                    this.x2 = true;
                },
                prevOut: function() {
                    this.x2 = false;
                },
                render: function() {return true}
            });
            states.next();
            assert.strictEqual(states.currentState().data.x, true);
            assert.strictEqual(states.currentState().data.x2, true);
            states.prev();
            assert.strictEqual(states.currentState().data.x, false);
            assert.strictEqual(states.currentState().data.x2, false);
        },
        jump: function() {
            states.add({
                name: 'first',
                render: function() {
                    assert.equal(this.goodbye, 'world');
                    this.goodbye = 'house';
                },
                jumpOut: function() {
                    assert.equal(this.goodbye, 'house');
                    this.goodbye = 'world';
                },
                jumpIn: function() {
                    this.goodbye = 'world'
                }
            });
            states.add({
                name: 'second',
                render: function() {
                    assert.equal(this.goodbye, 'world');
                    this.goodbye = 'mouse';
                },
                jumpIn: function() {
                    this.goodbye = 'world';
                },
                jumpOut: function() {
                    assert.equal(this.goodbye, 'mouse')
                }
            })
            states.jumpTo('second');
            states.jumpTo('first')
        }
    })
})