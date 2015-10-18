# d3-state-handler
#### v0.3.x
A thin data-layer for creating kick-ass d3 stories.

### How does it work?
d3-state-handler won't make charts for you, nor will it tell you how to display them. Instead, it allows you to register different
states (read charts) and call hooks as you transfer between states. This allows you to act on your data between charts making it
easy to transition between them. It also supports hooks for jumping to specific charts via urls. For a demonstration, 
see (demo unfinished).

## API

### constructor(options)
This is the method first called on d3-state-handler. It takes an options object with the following properties (shown with defaults):

```javascript
{
  /* 
   * Data that is shared between states. Every state method recieves a data parameter, this specifies the the data passed in
   * to stateHandler.start() when it is first called.
  */
  data: {},
  /*
   * Specifies whether lastChart.next() goes to first chart and whether firstChart.prev() calls the last chart.
  */
  loop: true, // Currently impossible to turn off.
  /*
   * Calling jumpTo() instead of next() or previous() allows you to go to any chart from any other chart. Doing this is tricky
   * if you don't take special care to clean up your state before you jump.
   * This is the control object that states are compared against when calling jumpTo().
  */
  jumpState: {} // Currently unimplemented.
}
```

### add(state)
Adds a new state. See states section below.

### next()
Transitions to the next chart. Calls `nextOut(data)` on the current chart, `nextIn(data)` on the next chart, and then `render(data)` on the new current chart.

### prev()
Transitions to the previous chart. Calls `prevOut(data)` on the current chart, `prevIn(data)` on the next chart, and then `render(data)` on the new current chart.

### remove(name)
Removes a state by name.

### resize()
Calls `resize(data)` on the current state.

### jumpTo(name)
Jumps from current state to a different state by name. Calls `jumpOut(data)` on current state, checks that `data === jumpState` (not yet implemented), calls `jumpIn(data)` on the target state, and then calls `render(data)` on the new current state.

### start()
Calls render on the current state.

### currentState()
Returns the current state object.
