# vue-object-merge

> Utility function for merging an object into a reactive object in Vue

## Purpose
This library was designed to efficiently and automatically incorporate responses from API calls into your Vue application state. It consists of a single utility function, `stateMerge`, that performs a **deep merge** of one object into another.

I wrote this because while my application APIs are designed to return JSON that maps readily into the application's Vue/Vuex state, and I grew tired of writing one-off `mutations` for Vuex where 90% of the work was simply taking an API response key and writing it back into the same relative position in the application state.

Now, many of my Vuex `actions` call their API endpoint and all commit a *single mutation* called `MERGE_STATE`. This `MERGE_STATE` mutation calls this function, `stateMerge`, to fold the keys and values returned from the API into the application state in one step, using the `Vue.set()` method to ensure Vue is properly aware of the changes and can react to them.

In addition to API calls, it can also be used for, say, updating `data` elements bound to form fields to match a Vuex state object, or vice versa.

## Function definition
```JavaScript
stateMerge(state, value, propName, ignoreNull)
```
where:
* `state` is the object to be updated.
* `value` is the object or value containing the change(s).
* `propName` is the key of `state` to be modified (required if `value` isn't an object, otherwise optional). This was primarily intended for internal use for recursion, but can be handy in other situations.
* `ignoreNull` should be set to true (default is false) if a `null` value should *not* overwrite `state`'s value.

## Basic Logic
Given objects `state` and `value`, `stateMerge` will:
* Traverse the attributes of `value`
* If the attribute is a *primitive* (number, boolean, etc.) or *built-in object* (array, date, regex, etc.), it will overwrite `state`'s attribute with the new value (adding the attribute if it doesn't exist).
* If the attribute is a *custom object* (normal JavaScript associative array), it will recurse into that object's attributes with the same logic.
* If the attribute is null, it will decide what to do based on the `ignoreNull` argument.

The `ignoreNull` option was added to make it easier to use the same server-side object (.NET "POCOs" in my case) to service different requests, where portions of the response object *not* modified are set to null. This has a small data overhead over bespoke responses for each API endpoint, but encourages code reuse and consistency.

*Technical implementation note:* testing the "type" of a value can be complicated--`typeof`, `instanceof`, and other methods all have pros and cons. In this case, there was a simple answer: `Object.prototype.toString.call(value)`. This returns the string `[object Object]` for all user-defined objects (the ones we want to recurse into), and returns various other values for built-in JavaScript types like `Date`, `Array`, `RegEx`, `Number`, `String`, `Boolean`, `Math`, `Function`, `null`, and `undefined`--the keys we usually want to overwrite.

## Caveats
* This only works if your `value` object forms a **directed acyclic graph**, otherwise you'll have an endless loop when updating.
* This *overwrites* arrays, it does not merge them. It only merges *objects*.

## Demo
Here's a CodePen where you can play with merging an object into a sample Vuex state:
https://codepen.io/richardtallent/pen/eyWKGN

## Examples

Basic example:
```JavaScript
var a = { foo: 1, bar: 0 }
var b = { foo: 2, fizz: 4, fee: null }
stateMerge(a, b)
console.log(a)
// { foo: 2, bar: 0, fizz: 4, fee: null }
```

With the `ignoreNull` option:
```JavaScript
var a = { foo: 1, fee: { id: 1 } }
var b = { foo: 2, fee: null }
stateMerge(a, b, null, true)
console.log(a)
// { foo: 2, fee: { id: 1 } }
```

Example of a deeper merge:
```JavaScript
var a = { foo: [0, 1], bar: { "1": "Marcia", "2": "Peter" } }
var b = { foo: [2, 3], bar: { "1": "Jan" } }
stateMerge(a, b)
console.log(a)
// { foo: [2, 3], bar: { "1" : "Jan", "2": "Peter" } }
```

Using the optional `propName` parameter:
```JavaScript
var a = { foo: [0, 1], bar: { "1": "Marcia", "2": "Peter" } }
var b = { "1": "Jan" }
stateMerge(a, b, "bar")
console.log(a)
// { foo: [0, 1], bar: { "1" : "Jan", "2": "Peter" } }
```

## Vuex Example (assumes you've installed it from npm, etc.)

```JavaScript
import { stateMerge } from "vue-object-merge"

export const store = new Vuex.Store({
...
  actions: {
	getOrders(context)) {
		return HTTP.get("/orders")
			.then(function(response)) {
				context.commit("MERGE_STATE", response.data)
			})
	}
  },
  mutations: {
	MERGE_STATE(state, data) {
		stateMerge(state, data)
	}
}
```

## Release History

| Date       | Version | Notes                                    |
| ---------- | ------- | ---------------------------------------- |
| 2018.01.01 | 0.1.0   | First release                            |
| 2018.01.01 | 0.1.1   | Cleaned up and simplified type checking. |
| 2018.01.01 | 0.1.2   | Fixed module export                      |
| 2018.01.03 | 0.1.3   | IE11 doesn't like `for(const...)`        |
| 2018.01.11 | 0.1.4   | npm build doesn't like ES6 at all        |
| 2018.01.15 | 0.1.5   | Added ignoreNull parameter               |
