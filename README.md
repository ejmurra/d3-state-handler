# d3-state-handler
#### v0.4.x
A thin data-layer for creating kick-ass d3 stories.

### How does it work?
d3-state-handler won't make charts for you, nor will it tell you how to display them. Instead, it allows you to register different states (read charts) and call hooks as you transfer between states. This allows you to act on your data between charts making it easy to transition between them. It also supports hooks for jumping to specific charts via urls. For a demonstration, see ~~[the demo](http://github.com/ejmurra/d3-state-demo)~~ demo outdated, waiting until a stable 1.0 to update it.

### Installation
d3-state-handler can be installed with npm. `npm install --save d3-state-handler`

### Usage
d3-state-handler is _no longer_ an amd module. ~~To use it, you'll need [requirejs](https://github.com/jrburke/requirejs).~~ But you can still use requirejs if you want to.

## API

### constructor(Window,options)
This is the method first called on d3-state-handler. It requires the browser's window object be passed as the first parameter. The second param an options object with the following properties (shown with defaults):

```javascript
{

{
    // Whether last state should hook into first state and vice versa -- currently unimpelmented
    loop: false,        
    // Function to run before calling the first state on normal page load
    init: function(data){ return data;},   
    // Contract states must adhere to when returning from jumpOut -- currently unimplemented
    jumpState: {},    
    // Object passed between states. Every method on a state receives and returns a data object
    data: {},       
    // Function to be called when a user loads a non-first state from a URL. This function
    // receives data as a parameter and should return an object that is equal to jumpState.
    load: function(data) {return data;}   
  }
```

### StateHandler.add(state)
Adds a new state. See states section below.

### StateHandler.next()
Transitions to the next chart. Calls `nextOut(data)` on the current chart, `nextIn(data)` on the next chart, and then `render(data)` on the new current chart.

### StateHandler.prev()
Transitions to the previous chart. Calls `prevOut(data)` on the current chart, `prevIn(data)` on the next chart, and then `render(data)` on the new current chart.

### StateHandler.remove(name)
Removes a state by name.

### StateHandler.jumpTo(name)
Jumps from current state to a different state by name. Calls `jumpOut(data)` on current state, checks that `data === jumpState` (not yet implemented), calls `jumpIn(data)` on the target state, and then calls `render(data)` on the new current state.

### StateHandler.start(fn)
Calls render on the current state. Optionally, `fn` is function to run before first state is rendered. If not specified, options.init is called instead

### StateHandler.currentState()
Returns the current state object.

## States
States are the building blocks for d3 stories created with d3-state-handler. States must have a `render` method but all other methods are optional. All methods receive a data object as the first parameter and must return a data object. See the example state below.

```javascript
{
  name: [String], // Name of the state. Defaults to the index of the state
                  // State.name is appended to the URL to identify the
                  // state, allowing users to link to a specific chart.
  render: function(data) {
    // Create chart based on data here.
    return data;
  },
  toNext: function(data) {
    // Clean up data here before passing it to the next state.
    return data;
  },
  toPrev: function(data) {
    // Clean up data here before passing it to the previous state.
    return data;
  },
  fromNext: function(data) {
    // Manipulate data to prepare it for this.render(data). Called when 
    // StateHandler.next() is called on the state before this one.
    return data;
  },
  fromPrev: function(data) {
    // Manipulate data to prepare it for this.render(data). Called when
    // StateHandler.prev() is called on the state after this one.
    return data;
  },
  jumpOut: function(data) {
    // Clean up data to match the jumpState contract specified in 
    // the constructor.
    return data;
  },
  jumpIn: function(data) {
    // Manipulate data to prepare it for this.render(data). It is safe
    // to assume data here is exactly what was specified in the 
    // jumpState contract. 
    // (Actually, I lied. That's not a safe assumption to make.) 
    // (It will be by version 1.0.0, however.)
    return data;
  },
  resize: function(data) {
    // Do some checks about screen size here and manipulate the state if you
    // need to. This is called when window is resized.
    // Defaults to calling State.render if unspecified.
    return data;
  }
}
```
## TODO
* V 0.4.x broke unit testing. Has been manually tested in Chrome. The back button works, but the forward button does not.
* Check jumpstate contract against object returned from State.jumpOut. Probably going to use lodash when I figure out how to load just one module instead of the entire library.
* Make options.loop actually loop.
