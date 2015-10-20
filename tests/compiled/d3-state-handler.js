define(['exports', 'module'], function (exports, module) {
    // polyfill object assign from MDN
    'use strict';

    if (!Object.assign) {
        Object.defineProperty(Object, 'assign', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function value(target) {
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
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    }

    var StateHandler = function StateHandler(Window, opts) {
        var _this = this;

        /*
         * Private vars
         */

        // Used to hold states and keep track of which state the user is currently interacting with
        var currentIndex = 0;
        var states = [];

        // This function just lets data flow through it unmutated. Used as a filler for missing methods on state objects
        var substitute = function substitute(data) {
            return data;
        };

        var options = opts || {
            loop: false, // Whether last state should hook into first state and vice versa
            init: substitute, // Function to run before calling the first state
            jumpState: {}, // Contract states must adhere to when returning from jumpOut
            data: {}, // Object passed between states. Every method on a state receives and returns a data object
            load: substitute // Function to be called when a user loads a non-first state from a URL. This function
            // receives data as a parameter and should return an object that is equal to jumpState.
        };

        // For easy reference and so that const is enforced by babel
        var jumpState = options.jumpState;

        // For easy reference
        var data = options.data;

        // When states register, their methods are stored in here so that they are simpler and can be added to html pushState
        var methodRegister = {};

        /*
         * Private Methods
         */
        var registerState = function registerState(state) {

            var avail = !methodRegister[state.name];
            if (!avail) throw new Error('State ' + state.name + ' already exists!');

            methodRegister[state.name] = {
                render: state.render,
                fromNext: state.fromNext || substitute,
                fromPrev: state.fromPrev || substitute,
                toNext: state.toNext || substitute,
                toPrev: state.toPrev || substitute,
                jumpOut: state.jumpOut || substitute,
                jumpIn: state.jumpIn || substitute,
                resize: state.resize || state.render
            };

            if (states.length) states[states.length - 1].next = state.name;

            state = {
                prev: states.length ? states[states.length - 1].name : null,
                name: state.name,
                next: null,
                url: '#' + _this.name
            };

            states.push(state);

            return state;
        };

        var resize = function resize() {
            var xData = Object.assign({}, data);
            xData = methodRegister[states[currentIndex].name].resize(xData);
            data = Object.assign({}, data, xData);
        };

        /*
         * Public Methods
         */

        var add = function add(state) {
            state.name = state.name || String(states.length);
            state = registerState(state);
            if (states.length === 1) Window.history.pushState(state, state.name, '#' + state.name);
        };

        var currentState = function currentState() {
            return states[currentIndex];
        };

        var remove = function remove(name) {
            var index = arrayObjectIndexOf(states, name, 'name');
            if (index > -1) array.splice(index, 1);
        };

        var loadState = function loadState(name) {
            var index = arrayObjectIndexOf(states, name, 'name');
            var targetState = states[index];

            if (index > -1) {
                var xData = options.load(Object.assign({}, data));

                // TODO: check xData against jumpState

                // Call transition methods
                xData = methodRegister[targetState.name].jumpIn(Object.assign({}, jumpState));
                xData = methodRegister[targetState.name].render(xData);

                // Clean up
                data = Object.assign({}, data, xData);
                currentIndex = index;
                Window.history.pushState(targetState, targetState.name, '#' + targetState.name);
            } else {
                throw new Error('State ' + name + ' does not exist');
            }
        };

        var jumpTo = function jumpTo(name) {
            var index = arrayObjectIndexOf(states, name, 'name');
            var currentState = states[currentIndex];
            var targetState = states[index];

            if (index > -1) {
                var xData = Object.assign({}, data);
                xData = methodRegister[currentState.name].jumpOut(xData);

                // TODO: check xData against jumpState

                // Call transition methods
                xData = methodRegister[targetState.name].jumpIn(Object.assign({}, jumpState));
                xData = methodRegister[targetState.name].render(xData);

                // Clean up
                data = Object.assign({}, data, xData);
                currentIndex = index;
                Window.history.pushState(targetState, targetState.name, '#' + targetState.name);
            } else {
                throw new Error('State ' + name + ' does not exist');
            }
        };

        var next = function next() {
            var thisState = states[currentIndex];
            var nextStateName = thisState.next;

            if (nextStateName) {
                var nextState = states[arrayObjectIndexOf(states, nextStateName, 'name')];
                var xData = Object.assign({}, data);

                // Call transition methods
                xData = methodRegister[thisState.name].toNext(xData);
                xData = methodRegister[nextState.name].fromPrev(xData);
                xData = methodRegister[nextState.name].render(xData);

                // Clean up
                data = Object.assign({}, data, xData);
                currentIndex = currentIndex + 1 < states.length ? currentIndex + 1 : 0;
                Window.history.pushState(nextState, nextState.name, '#' + nextState.name);
            } else {
                throw new Error('No state after current state (' + JSON.stringify(thisState) + ')');
            }
        };

        var prev = function prev() {
            var thisState = states[currentIndex];
            var prevStateName = thisState.prev;

            if (prevStateName) {
                var prevState = states[arrayObjectIndexOf(states, prevStateName, 'name')];
                var xData = Object.assign({}, data);

                // Cal transition methods
                xData = methodRegister[thisState.name].toPrev(xData);
                xData = methodRegister[prevState.name].fromNext(xData);
                xData = methodRegister[prevState.name].render(xData);

                // Clean up
                data = Object.assign({}, data, xData);
                currentIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : states.length - 1;
                Window.history.pushState(prevState, prevState.name, '#' + prevState.name);
            } else {
                throw new Error('No state before current state (' + JSON.stringify(thisState) + ')');
            }
        };

        var start = function start(fn) {
            // Set up listeners for popState and resize
            Window.addEventListener('popstate', function (e) {
                if (!Window.history) {
                    var xData = Object.assign({}, data);
                    xData = !fn ? options.init(xData) : fn(xData);
                    xData = methodRegister[states[0].name].render(xData);
                    data = Object.assign({}, data, xData);
                    Window.history.pushState(state[0], state[0].name, '#' + state[0].name);
                } else {
                    var index = arrayObjectIndexOf(states, Window.location.hash.slice(1), 'name');
                    Window.history.pushState(state[index], state[index].name, '#' + state[index].name);
                    jumpTo(Window.location.hash.slice(1));
                }
            });
            Window.addEventListener('resize', function (e) {
                resize();
            });

            // Bootstrap application
            if (!Window.location.hash || Window.location.hash.slice(1) === states[0].name) {
                var xData = Object.assign({}, data);
                xData = !fn ? options.init(xData) : fn(xData);
                xData = methodRegister[states[0].name].render(xData);
                data = Object.assign({}, data, xData);
                Window.history.pushState(state[0], state[0].name, '#' + state[0].name);
            } else {
                var index = arrayObjectIndexOf(states, Window.location.hash.slice(1), 'name');
                Window.history.pushState(state[index], state[index].name, '#' + state[index].name);
                jumpTo(Window.location.hash.slice(1));
            }
        };

        var api = {
            next: next,
            add: add,
            currentState: currentState,
            prev: prev,
            remove: remove,
            load: loadState,
            jumpTo: jumpTo,
            start: start
        };

        return api;
    };

    module.exports = StateHandler;
});
//# sourceMappingURL=data:application/json;base64,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QUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDekM7U0FHSixDQUFDOztBQUVGLFlBQUksR0FBRyxHQUFHO0FBQ04sZ0JBQUksRUFBRSxJQUFJO0FBQ1YsZUFBRyxFQUFFLEdBQUc7QUFDUix3QkFBWSxFQUFFLFlBQVk7QUFDMUIsZ0JBQUksRUFBRSxJQUFJO0FBQ1Ysa0JBQU0sRUFBRSxNQUFNO0FBQ2QsZ0JBQUksRUFBRSxTQUFTO0FBQ2Ysa0JBQU0sRUFBRSxNQUFNO0FBQ2QsaUJBQUssRUFBRSxLQUFLO1NBQ2YsQ0FBQzs7QUFFRixlQUFPLEdBQUcsQ0FBQztLQUNkLENBQUM7O3FCQUVhLFlBQVkiLCJmaWxlIjoiZDMtc3RhdGUtaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHBvbHlmaWxsIG9iamVjdCBhc3NpZ24gZnJvbSBNRE5cbmlmICghT2JqZWN0LmFzc2lnbikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsICdhc3NpZ24nLCB7XG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQgfHwgdGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgZmlyc3QgYXJndW1lbnQgdG8gb2JqZWN0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFNvdXJjZSA9PT0gdW5kZWZpbmVkIHx8IG5leHRTb3VyY2UgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5leHRTb3VyY2UgPSBPYmplY3QobmV4dFNvdXJjZSk7XG5cbiAgICAgICAgICAgICAgICB2YXIga2V5c0FycmF5ID0gT2JqZWN0LmtleXMobmV4dFNvdXJjZSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEluZGV4ID0gMCwgbGVuID0ga2V5c0FycmF5Lmxlbmd0aDsgbmV4dEluZGV4IDwgbGVuOyBuZXh0SW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dEtleSA9IGtleXNBcnJheVtuZXh0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobmV4dFNvdXJjZSwgbmV4dEtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXNjICE9PSB1bmRlZmluZWQgJiYgZGVzYy5lbnVtZXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdG87XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy8gU3RvbGVuIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvODY2ODI4M1xuZnVuY3Rpb24gYXJyYXlPYmplY3RJbmRleE9mKG15QXJyYXksIHNlYXJjaFRlcm0sIHByb3BlcnR5KSB7XG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gbXlBcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAobXlBcnJheVtpXVtwcm9wZXJ0eV0gPT09IHNlYXJjaFRlcm0pIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbmNvbnN0IFN0YXRlSGFuZGxlciA9IGZ1bmN0aW9uIFN0YXRlSGFuZGxlcihXaW5kb3csb3B0cykge1xuXG4gICAgLypcbiAgICAgKiBQcml2YXRlIHZhcnNcbiAgICAgKi9cblxuICAgIC8vIFVzZWQgdG8gaG9sZCBzdGF0ZXMgYW5kIGtlZXAgdHJhY2sgb2Ygd2hpY2ggc3RhdGUgdGhlIHVzZXIgaXMgY3VycmVudGx5IGludGVyYWN0aW5nIHdpdGhcbiAgICBsZXQgY3VycmVudEluZGV4ID0gMDtcbiAgICBsZXQgc3RhdGVzID0gW107XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGp1c3QgbGV0cyBkYXRhIGZsb3cgdGhyb3VnaCBpdCB1bm11dGF0ZWQuIFVzZWQgYXMgYSBmaWxsZXIgZm9yIG1pc3NpbmcgbWV0aG9kcyBvbiBzdGF0ZSBvYmplY3RzXG4gICAgY29uc3Qgc3Vic3RpdHV0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtyZXR1cm4gZGF0YX07XG5cbiAgICBsZXQgb3B0aW9ucyA9IG9wdHMgfHwge1xuICAgICAgICAgICAgbG9vcDogZmFsc2UsICAgICAgICAvLyBXaGV0aGVyIGxhc3Qgc3RhdGUgc2hvdWxkIGhvb2sgaW50byBmaXJzdCBzdGF0ZSBhbmQgdmljZSB2ZXJzYVxuICAgICAgICAgICAgaW5pdDogc3Vic3RpdHV0ZSwgICAvLyBGdW5jdGlvbiB0byBydW4gYmVmb3JlIGNhbGxpbmcgdGhlIGZpcnN0IHN0YXRlXG4gICAgICAgICAgICBqdW1wU3RhdGU6IHt9LCAgICAgIC8vIENvbnRyYWN0IHN0YXRlcyBtdXN0IGFkaGVyZSB0byB3aGVuIHJldHVybmluZyBmcm9tIGp1bXBPdXRcbiAgICAgICAgICAgIGRhdGE6IHt9LCAgICAgICAgICAgLy8gT2JqZWN0IHBhc3NlZCBiZXR3ZWVuIHN0YXRlcy4gRXZlcnkgbWV0aG9kIG9uIGEgc3RhdGUgcmVjZWl2ZXMgYW5kIHJldHVybnMgYSBkYXRhIG9iamVjdFxuICAgICAgICAgICAgbG9hZDogc3Vic3RpdHV0ZSAgICAvLyBGdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBhIHVzZXIgbG9hZHMgYSBub24tZmlyc3Qgc3RhdGUgZnJvbSBhIFVSTC4gVGhpcyBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjZWl2ZXMgZGF0YSBhcyBhIHBhcmFtZXRlciBhbmQgc2hvdWxkIHJldHVybiBhbiBvYmplY3QgdGhhdCBpcyBlcXVhbCB0byBqdW1wU3RhdGUuXG4gICAgICAgIH07XG5cbiAgICAvLyBGb3IgZWFzeSByZWZlcmVuY2UgYW5kIHNvIHRoYXQgY29uc3QgaXMgZW5mb3JjZWQgYnkgYmFiZWxcbiAgICBjb25zdCBqdW1wU3RhdGUgPSBvcHRpb25zLmp1bXBTdGF0ZTtcblxuICAgIC8vIEZvciBlYXN5IHJlZmVyZW5jZVxuICAgIGxldCBkYXRhID0gb3B0aW9ucy5kYXRhO1xuXG4gICAgLy8gV2hlbiBzdGF0ZXMgcmVnaXN0ZXIsIHRoZWlyIG1ldGhvZHMgYXJlIHN0b3JlZCBpbiBoZXJlIHNvIHRoYXQgdGhleSBhcmUgc2ltcGxlciBhbmQgY2FuIGJlIGFkZGVkIHRvIGh0bWwgcHVzaFN0YXRlXG4gICAgbGV0IG1ldGhvZFJlZ2lzdGVyID0ge307XG5cbiAgICAvKlxuICAgICAqIFByaXZhdGUgTWV0aG9kc1xuICAgICAqL1xuICAgIGxldCByZWdpc3RlclN0YXRlID0gKHN0YXRlKSA9PiB7XG5cbiAgICAgICAgbGV0IGF2YWlsID0gIW1ldGhvZFJlZ2lzdGVyW3N0YXRlLm5hbWVdO1xuICAgICAgICBpZiAoIWF2YWlsKSB0aHJvdyBuZXcgRXJyb3IoYFN0YXRlICR7c3RhdGUubmFtZX0gYWxyZWFkeSBleGlzdHMhYCk7XG5cbiAgICAgICAgbWV0aG9kUmVnaXN0ZXJbc3RhdGUubmFtZV0gPSB7XG4gICAgICAgICAgICByZW5kZXI6IHN0YXRlLnJlbmRlcixcbiAgICAgICAgICAgIGZyb21OZXh0OiBzdGF0ZS5mcm9tTmV4dCB8fCBzdWJzdGl0dXRlLFxuICAgICAgICAgICAgZnJvbVByZXY6IHN0YXRlLmZyb21QcmV2IHx8IHN1YnN0aXR1dGUsXG4gICAgICAgICAgICB0b05leHQ6IHN0YXRlLnRvTmV4dCB8fCBzdWJzdGl0dXRlLFxuICAgICAgICAgICAgdG9QcmV2OiBzdGF0ZS50b1ByZXYgfHwgc3Vic3RpdHV0ZSxcbiAgICAgICAgICAgIGp1bXBPdXQ6IHN0YXRlLmp1bXBPdXQgfHwgc3Vic3RpdHV0ZSxcbiAgICAgICAgICAgIGp1bXBJbjogc3RhdGUuanVtcEluIHx8IHN1YnN0aXR1dGUsXG4gICAgICAgICAgICByZXNpemU6IHN0YXRlLnJlc2l6ZSB8fCBzdGF0ZS5yZW5kZXJcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3RhdGVzLmxlbmd0aCkgc3RhdGVzW3N0YXRlcy5sZW5ndGggLSAxXS5uZXh0ID0gc3RhdGUubmFtZTtcblxuICAgICAgICBzdGF0ZSA9IHtcbiAgICAgICAgICAgIHByZXY6IHN0YXRlcy5sZW5ndGggPyBzdGF0ZXNbc3RhdGVzLmxlbmd0aCAtIDFdLm5hbWU6IG51bGwsXG4gICAgICAgICAgICBuYW1lOiBzdGF0ZS5uYW1lLFxuICAgICAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgICAgIHVybDogYCMke3RoaXMubmFtZX1gXG4gICAgICAgIH07XG5cbiAgICAgICAgc3RhdGVzLnB1c2goc3RhdGUpO1xuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9O1xuXG4gICAgbGV0IHJlc2l6ZSA9ICgpID0+IHtcbiAgICAgICAgbGV0IHhEYXRhID0gT2JqZWN0LmFzc2lnbih7fSxkYXRhKTtcbiAgICAgICAgeERhdGEgPSBtZXRob2RSZWdpc3RlcltzdGF0ZXNbY3VycmVudEluZGV4XS5uYW1lXS5yZXNpemUoeERhdGEpO1xuICAgICAgICBkYXRhID0gT2JqZWN0LmFzc2lnbih7fSxkYXRhLHhEYXRhKTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBQdWJsaWMgTWV0aG9kc1xuICAgICAqL1xuXG4gICAgbGV0IGFkZCA9IChzdGF0ZSkgPT4ge1xuICAgICAgICBzdGF0ZS5uYW1lID0gc3RhdGUubmFtZSB8fCBTdHJpbmcoc3RhdGVzLmxlbmd0aCk7XG4gICAgICAgIHN0YXRlID0gcmVnaXN0ZXJTdGF0ZShzdGF0ZSk7XG4gICAgICAgIGlmIChzdGF0ZXMubGVuZ3RoID09PSAxKSBXaW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoc3RhdGUsc3RhdGUubmFtZSxgIyR7c3RhdGUubmFtZX1gKVxuICAgIH07XG5cbiAgICBsZXQgY3VycmVudFN0YXRlID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gc3RhdGVzW2N1cnJlbnRJbmRleF07XG4gICAgfTtcblxuICAgIGxldCByZW1vdmUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgaW5kZXggPSBhcnJheU9iamVjdEluZGV4T2Yoc3RhdGVzLG5hbWUsJ25hbWUnKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIGFycmF5LnNwbGljZShpbmRleCwgMSk7XG4gICAgfTtcblxuICAgIGxldCBsb2FkU3RhdGUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgaW5kZXggPSBhcnJheU9iamVjdEluZGV4T2Yoc3RhdGVzLG5hbWUsJ25hbWUnKTtcbiAgICAgICAgbGV0IHRhcmdldFN0YXRlID0gc3RhdGVzW2luZGV4XTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IHhEYXRhID0gb3B0aW9ucy5sb2FkKE9iamVjdC5hc3NpZ24oe30sZGF0YSkpO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayB4RGF0YSBhZ2FpbnN0IGp1bXBTdGF0ZVxuXG4gICAgICAgICAgICAvLyBDYWxsIHRyYW5zaXRpb24gbWV0aG9kc1xuICAgICAgICAgICAgeERhdGEgPSBtZXRob2RSZWdpc3Rlclt0YXJnZXRTdGF0ZS5uYW1lXS5qdW1wSW4oT2JqZWN0LmFzc2lnbih7fSxqdW1wU3RhdGUpKTtcbiAgICAgICAgICAgIHhEYXRhID0gbWV0aG9kUmVnaXN0ZXJbdGFyZ2V0U3RhdGUubmFtZV0ucmVuZGVyKHhEYXRhKTtcblxuICAgICAgICAgICAgLy8gQ2xlYW4gdXBcbiAgICAgICAgICAgIGRhdGEgPSBPYmplY3QuYXNzaWduKHt9LGRhdGEseERhdGEpO1xuICAgICAgICAgICAgY3VycmVudEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICBXaW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUodGFyZ2V0U3RhdGUsdGFyZ2V0U3RhdGUubmFtZSxgIyR7dGFyZ2V0U3RhdGUubmFtZX1gKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdGF0ZSAke25hbWV9IGRvZXMgbm90IGV4aXN0YClcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQganVtcFRvID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IGluZGV4ID0gYXJyYXlPYmplY3RJbmRleE9mKHN0YXRlcyxuYW1lLCduYW1lJyk7XG4gICAgICAgIGxldCBjdXJyZW50U3RhdGUgPSBzdGF0ZXNbY3VycmVudEluZGV4XTtcbiAgICAgICAgbGV0IHRhcmdldFN0YXRlID0gc3RhdGVzW2luZGV4XTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IHhEYXRhID0gT2JqZWN0LmFzc2lnbih7fSxkYXRhKTtcbiAgICAgICAgICAgIHhEYXRhID0gbWV0aG9kUmVnaXN0ZXJbY3VycmVudFN0YXRlLm5hbWVdLmp1bXBPdXQoeERhdGEpO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayB4RGF0YSBhZ2FpbnN0IGp1bXBTdGF0ZVxuXG5cbiAgICAgICAgICAgIC8vIENhbGwgdHJhbnNpdGlvbiBtZXRob2RzXG4gICAgICAgICAgICB4RGF0YSA9IG1ldGhvZFJlZ2lzdGVyW3RhcmdldFN0YXRlLm5hbWVdLmp1bXBJbihPYmplY3QuYXNzaWduKHt9LGp1bXBTdGF0ZSkpO1xuICAgICAgICAgICAgeERhdGEgPSBtZXRob2RSZWdpc3Rlclt0YXJnZXRTdGF0ZS5uYW1lXS5yZW5kZXIoeERhdGEpO1xuXG4gICAgICAgICAgICAvLyBDbGVhbiB1cFxuICAgICAgICAgICAgZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sZGF0YSx4RGF0YSk7XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIFdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSh0YXJnZXRTdGF0ZSx0YXJnZXRTdGF0ZS5uYW1lLGAjJHt0YXJnZXRTdGF0ZS5uYW1lfWApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFN0YXRlICR7bmFtZX0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgbmV4dCA9ICgpID0+IHtcbiAgICAgICAgbGV0IHRoaXNTdGF0ZSA9IHN0YXRlc1tjdXJyZW50SW5kZXhdO1xuICAgICAgICBsZXQgbmV4dFN0YXRlTmFtZSA9IHRoaXNTdGF0ZS5uZXh0O1xuXG4gICAgICAgIGlmIChuZXh0U3RhdGVOYW1lKSB7XG4gICAgICAgICAgICBsZXQgbmV4dFN0YXRlID0gc3RhdGVzW2FycmF5T2JqZWN0SW5kZXhPZihzdGF0ZXMsbmV4dFN0YXRlTmFtZSwnbmFtZScpXTtcbiAgICAgICAgICAgIGxldCB4RGF0YSA9IE9iamVjdC5hc3NpZ24oe30sZGF0YSk7XG5cbiAgICAgICAgICAgIC8vIENhbGwgdHJhbnNpdGlvbiBtZXRob2RzXG4gICAgICAgICAgICB4RGF0YSA9IG1ldGhvZFJlZ2lzdGVyW3RoaXNTdGF0ZS5uYW1lXS50b05leHQoeERhdGEpO1xuICAgICAgICAgICAgeERhdGEgPSBtZXRob2RSZWdpc3RlcltuZXh0U3RhdGUubmFtZV0uZnJvbVByZXYoeERhdGEpO1xuICAgICAgICAgICAgeERhdGEgPSBtZXRob2RSZWdpc3RlcltuZXh0U3RhdGUubmFtZV0ucmVuZGVyKHhEYXRhKTtcblxuICAgICAgICAgICAgLy8gQ2xlYW4gdXBcbiAgICAgICAgICAgIGRhdGEgPSBPYmplY3QuYXNzaWduKHt9LGRhdGEseERhdGEpO1xuICAgICAgICAgICAgY3VycmVudEluZGV4ID0gKGN1cnJlbnRJbmRleCArIDEgPCBzdGF0ZXMubGVuZ3RoKSA/IGN1cnJlbnRJbmRleCArIDEgOiAwO1xuICAgICAgICAgICAgV2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG5leHRTdGF0ZSxuZXh0U3RhdGUubmFtZSxgIyR7bmV4dFN0YXRlLm5hbWV9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHN0YXRlIGFmdGVyIGN1cnJlbnQgc3RhdGUgKCR7SlNPTi5zdHJpbmdpZnkodGhpc1N0YXRlKX0pYClcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgcHJldiA9ICgpID0+IHtcbiAgICAgICAgbGV0IHRoaXNTdGF0ZSA9IHN0YXRlc1tjdXJyZW50SW5kZXhdO1xuICAgICAgICBsZXQgcHJldlN0YXRlTmFtZSA9IHRoaXNTdGF0ZS5wcmV2O1xuXG4gICAgICAgIGlmIChwcmV2U3RhdGVOYW1lKSB7XG4gICAgICAgICAgICBsZXQgcHJldlN0YXRlID0gc3RhdGVzW2FycmF5T2JqZWN0SW5kZXhPZihzdGF0ZXMscHJldlN0YXRlTmFtZSwnbmFtZScpXTtcbiAgICAgICAgICAgIGxldCB4RGF0YSA9IE9iamVjdC5hc3NpZ24oe30sZGF0YSk7XG5cbiAgICAgICAgICAgIC8vIENhbCB0cmFuc2l0aW9uIG1ldGhvZHNcbiAgICAgICAgICAgIHhEYXRhID0gbWV0aG9kUmVnaXN0ZXJbdGhpc1N0YXRlLm5hbWVdLnRvUHJldih4RGF0YSk7XG4gICAgICAgICAgICB4RGF0YSA9IG1ldGhvZFJlZ2lzdGVyW3ByZXZTdGF0ZS5uYW1lXS5mcm9tTmV4dCh4RGF0YSk7XG4gICAgICAgICAgICB4RGF0YSA9IG1ldGhvZFJlZ2lzdGVyW3ByZXZTdGF0ZS5uYW1lXS5yZW5kZXIoeERhdGEpO1xuXG4gICAgICAgICAgICAvLyBDbGVhbiB1cFxuICAgICAgICAgICAgZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sZGF0YSx4RGF0YSk7XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggPSAoY3VycmVudEluZGV4IC0gMSA+PSAwKSA/IGN1cnJlbnRJbmRleCAtIDEgOiBzdGF0ZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIFdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShwcmV2U3RhdGUscHJldlN0YXRlLm5hbWUsYCMke3ByZXZTdGF0ZS5uYW1lfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBzdGF0ZSBiZWZvcmUgY3VycmVudCBzdGF0ZSAoJHtKU09OLnN0cmluZ2lmeSh0aGlzU3RhdGUpfSlgKVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxldCBzdGFydCA9IChmbikgPT4ge1xuICAgICAgICAvLyBTZXQgdXAgbGlzdGVuZXJzIGZvciBwb3BTdGF0ZSBhbmQgcmVzaXplXG4gICAgICAgIFdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsKGUpID0+IHtcbiAgICAgICAgICAgIGlmICghV2luZG93Lmhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICBsZXQgeERhdGEgPSBPYmplY3QuYXNzaWduKHt9LGRhdGEpO1xuICAgICAgICAgICAgICAgIHhEYXRhID0gIWZuID8gb3B0aW9ucy5pbml0KHhEYXRhKSA6IGZuKHhEYXRhKTtcbiAgICAgICAgICAgICAgICB4RGF0YSA9IG1ldGhvZFJlZ2lzdGVyW3N0YXRlc1swXS5uYW1lXS5yZW5kZXIoeERhdGEpO1xuICAgICAgICAgICAgICAgIGRhdGEgPSBPYmplY3QuYXNzaWduKHt9LGRhdGEseERhdGEpO1xuICAgICAgICAgICAgICAgIFdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZVswXSwgc3RhdGVbMF0ubmFtZSxgIyR7c3RhdGVbMF0ubmFtZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gYXJyYXlPYmplY3RJbmRleE9mKHN0YXRlcyxXaW5kb3cubG9jYXRpb24uaGFzaC5zbGljZSgxKSwnbmFtZScpO1xuICAgICAgICAgICAgICAgIFdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZVtpbmRleF0sIHN0YXRlW2luZGV4XS5uYW1lLGAjJHtzdGF0ZVtpbmRleF0ubmFtZX1gKTtcbiAgICAgICAgICAgICAgICBqdW1wVG8oV2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsKGUpID0+IHtcbiAgICAgICAgICAgIHJlc2l6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBCb290c3RyYXAgYXBwbGljYXRpb25cbiAgICAgICAgaWYgKCFXaW5kb3cubG9jYXRpb24uaGFzaCB8fCBXaW5kb3cubG9jYXRpb24uaGFzaC5zbGljZSgxKSA9PT0gc3RhdGVzWzBdLm5hbWUpIHtcbiAgICAgICAgICAgIGxldCB4RGF0YSA9IE9iamVjdC5hc3NpZ24oe30sZGF0YSk7XG4gICAgICAgICAgICB4RGF0YSA9ICFmbiA/IG9wdGlvbnMuaW5pdCh4RGF0YSkgOiBmbih4RGF0YSk7XG4gICAgICAgICAgICB4RGF0YSA9IG1ldGhvZFJlZ2lzdGVyW3N0YXRlc1swXS5uYW1lXS5yZW5kZXIoeERhdGEpO1xuICAgICAgICAgICAgZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sZGF0YSx4RGF0YSk7XG4gICAgICAgICAgICBXaW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoc3RhdGVbMF0sIHN0YXRlWzBdLm5hbWUsYCMke3N0YXRlWzBdLm5hbWV9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgaW5kZXggPSBhcnJheU9iamVjdEluZGV4T2Yoc3RhdGVzLFdpbmRvdy5sb2NhdGlvbi5oYXNoLnNsaWNlKDEpLCduYW1lJyk7XG4gICAgICAgICAgICBXaW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoc3RhdGVbaW5kZXhdLCBzdGF0ZVtpbmRleF0ubmFtZSxgIyR7c3RhdGVbaW5kZXhdLm5hbWV9YCk7XG4gICAgICAgICAgICBqdW1wVG8oV2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSkpO1xuICAgICAgICB9XG5cblxuICAgIH07XG5cbiAgICBsZXQgYXBpID0ge1xuICAgICAgICBuZXh0OiBuZXh0LFxuICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgY3VycmVudFN0YXRlOiBjdXJyZW50U3RhdGUsXG4gICAgICAgIHByZXY6IHByZXYsXG4gICAgICAgIHJlbW92ZTogcmVtb3ZlLFxuICAgICAgICBsb2FkOiBsb2FkU3RhdGUsXG4gICAgICAgIGp1bXBUbzoganVtcFRvLFxuICAgICAgICBzdGFydDogc3RhcnRcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFN0YXRlSGFuZGxlcjsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
