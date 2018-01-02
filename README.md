# vue-object-merge

> Utility function for merging an object into a reactive object in Vue

## Purpose

I'm working on several Vue+Vuex applications, and I'm fortunate to have control over both the Vuex and API design. As a database guy, I've chosen to use a normalized approach similar to what is shown here, and to have my API respond with JSON that mirrors the page state shape for entities, lists of entities, and relationships between entities:

https://redux.js.org/docs/recipes/reducers/NormalizingStateShape.html

This means the majority of my API calls need to be folded into the Vuex state following a very simple pattern:

- Dispatch an action that calls the web API
- Await the JSON response
- Traverse the JSON response. For each property, compare with the same key in the Vuex store state:
- Add keys that are new
- For existing arrays, primitives, dates, or regex objects, update the store
- For existing objects, loop through their properties recursively using the same logic

This pattern is often referred to as a "object merge" or "deep assign," and there are variants depending on how you want to approach arrays, mismatched types, nulls, etc. Also, for Vuex, there are special calls needed to assign new state variables and modify others properly, since we don't (yet) have proxy support in Vue/Vuex.

The purpose of this tiny package is to, given a Vue-observable object (whether `data`, `prop`, or Vuex `state`) and a "source" object, to merge the source object into the Vue object following the pattern above. The design takes cues from other libraries that do similar actions with normal JavaScript objects, but this does its work using the Vue `set` method to ensure Vue is aware of all changes.

This allows me to avoid a TON of boilerplate mapping and mutating code in my web app, provided my API matches the shape of the page state.

It could also be used for, say, handling mutations to update a Vuex state object to match a group of field-bound data elements in a form component.

If this ends up being useful to you, please give me a shout out! If you discover a bug, please let me know (and ideally send a PR).

## Caveats
This only works if your source object forms a **directed acyclic graph**. Source properties should not point back to their ancestors or you'll have an endless loop. Good normalization avoids this.

## Merge example:

### Destination (old state):
```Javascript
products: {
	46: { id: 46, name: "Apples" }
},
orders: {
	1: { id: 1, date: "Monday", customer: "Alice", productIds: [46], coupons: [88] }
},
```

### Source (new data):
```Javascript
foo: true,
products: {
	46: { color: "red" }
	22: { id: 22, name: "Oranges", color: "orange" }
},
orders: {
	1: { coupons: [35, 53] }
	44: { id: 44, date: "Friday", customer: "Bob", productIds: [22, 46] }
},
```

### Result (final state):
```Javascript
foo: true,
products: {
	46: { id: 46, name: "Apples", color: "red" }
	22: { id: 22, name: "Oranges", color: "orange" }
},
orders: {
	1: { id: 1, date: "Monday", customer: "Alice", productIds: [46], coupons: [35, 53] },
	44: { id: 44, date: "Friday", customer: "Bob", productIds: [22, 46] }
},
```

## Example usage in Vuex (assumes you've installed it from npm, etc.)

```JavaScript
import stateMerge from "vue-object-merge"

export const store = new Vuex.Store({
...
  actions: {
	getOrders(context)) {
		return HTTP.get("/orders")
		.then(function(response)) {
			context.commit("MERGE", response.data)
		})
	}
  },
  mutations: {
	MERGE(state, data) {
		stateMerge(state, null, data)
	}
}
```

## Usage and Implementation Details

```JavaScript
function stateMerge(state, value, propName)
```

The initial call to `stateMerge` would normally be setting `state` to the root object that `stateMerge` is allowed to modify (say, `this.store.state.entities`), and `value` should be the object that should have properties that match up against that state. `propName` should be null, that third parameter is used during recursion.

This function loops through the properties of `value` (which must be an object) and looks at the type of each property.

For properties that are user-defined objects, if `state` has a property of the same name, it performs a recursive call to loop through *that* pairing of state's object and the property.

For properties that are *not* user-defined objects, *or* where `state` doesn't have a property of that name, `state` is mutated to set the property value.

Testing the "type" of an object can be complicated--typeof, instanceof, and other methods all have pros and cons. In this case, there was a pretty simple answer: `Object.prototype.toString.call(value)`. This returns `[object Object]` for all user-defined objects (the ones we want to recursively call `stateMerge` for), and returns different values for various built-in JavaScript types like Date, Array, RegEx, Number, String, Boolean, Math, Function, String, null, and undefined--the ones we want to just set the value for.

## Build Setup

```bash
# install dependencies
npm install

# build for production with minification
npm run build
```

## Release History

| Date       | Version | Notes |
| ---------- | ------- | -----------------------
| 2018.01.01 | 0.1.0   | First release
| 2018.01.01 | 0.1.1   | Cleaned up and simplified type checking.
| 2018.01.01 | 0.1.2   | Fixed module export
