# d3-state-handler
#### v0.3.x
A thin data-layer for creating kick-ass d3 stories.

### How does it work?
d3-state-handler won't make charts for you, nor will it tell you how to display them. Instead, it allows you to register different states (read charts) and call hooks as you transfer between states. This allows you to act on your data between charts making it easy to transition between them. It also supports hooks for jumping to specific charts via urls. For a demonstration, see (demo unfinished).

## API

### constructor(options)
This is the method first called on d3-state-handler. It takes an options object with the following properties (shown with defaults):

```javascript
{
  /* 
   * Data is shared between states. Every state method recieves a data parameter, this 
   * specifies the the data passed in to stateHandler.start() when it is first called.
  */
  data: {},
  /*
   * Specifies whether lastChart.next() goes to first chart and whether
   * firstChart.prev() calls the last chart.
  */
  loop: true, // Currently impossible to turn off.
  /*
   * Calling jumpTo() instead of next() or previous() allows you to go to any chart
   * from any other chart. Doing this is tricky if you don't take special care to clean
   * up your state before you jump. Setting this control object allows you to create a
   * contract that all states must adhere to when calling jumpOut on the state.
  */
  jumpState: {} // Currently unimplemented.
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

### StateHandler.resize()
Calls `resize(data)` on the current state. Defaults to `render(data)` if resize is undefined.

### StateHandler.jumpTo(name)
Jumps from current state to a different state by name. Calls `jumpOut(data)` on current state, checks that `data === jumpState` (not yet implemented), calls `jumpIn(data)` on the target state, and then calls `render(data)` on the new current state.

### StateHandler.start()
Calls render on the current state.

### StateHandler.currentState()
Returns the current state object.

## States
States are the building blocks for d3 stories created with d3-state-handler. States must have a `render` method but all other methods are optional. All methods receive a data object as the first parameter and must return a data object. See the example state below.

```javascript
{
  name: [String], // Name of the state. Defaults to the index of the state
  render: function(data) {
    // Create chart based on data here.
    return data;
  },
  nextOut: function(data) {
    // Clean up data here before passing it to the next state.
    return data;
  },
  prevOut: function(data) {
    // Clean up data here before passing it to the previous state.
    return data;
  },
  nextIn: function(data) {
    // Manipulate data to prepare it for this.render(data). Called when 
    // StateHandler.next() is called on the state before this one.
    return data;
  },
  prevIn: function(data) {
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
    // need to. This is called when StateHandler.resize() is called.
    // StateHandler.resize() defaults to calling render(data) if this
    // function is unimplemented.
    return data;
  }
}
```
