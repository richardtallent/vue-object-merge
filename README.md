# vue-object-merge

> Utility function for merging an object into a reactive object in Vue

## Purpose
This library was designed to efficiently and automatically merge changes into a Vue-managed object into that object.

I really enjoy Vue and Vuex's philosophy -- update your state, and your UI will reactively update automatically. But what I don't enjoy is writing code to wire API JSON responses back into my Vue `data` or Vuex `state` objects (i.e., mutation functions):

``` JavaScript
state: {
	customer {
		firstName: "",
		lastName: ""
		// ...
	}
},
actions: {
	getCustomer: id => axios
		.get("/api/getCustomer/" + id)
		.then(function(response) {
			context.commit("COMMIT_CUSTOMER", response.data)
		})
},
mutations: {
	COMMIT_CUSTOMER(state, data) {
		state.customer.firstName = data.firstName;
		state.customer.lastName = data.lastName;
		// ... sigh ...
	},
}
```

(The examples here are specific to Vuex, but apply equally if you're just using the `data` object to store your state.)

If an object is replaced *entirely*, all you have to do is replace one object with another. But if the API needs to return *partial object changes* (perhaps even changes across several portions of the page state, such as updating a table and a page header and three menu options), you have to manually wire the bits and pieces. Worse, if each API call can return different portions of state, you'll be writing a LOT of boilerplate code.

Vue-Object-Merge provides a single function, `stateMerge`, that performs a **deep merge** of one object into another. Basically, it greatly simplifies mapping keys from object `A` into Vue object `B`, *without* disturbing keys in `B` that are not included in `A`:

```JavaScript
mutations: {
	// I can call this single mutation for any API response that sparely
	// matches anything in the Vuex state.
	MERGE_STATE: (state, response) => stateMerge(state, response),
}
```

Now, many of my Vuex `actions` call their API endpoint and all commit a *single mutation* (as above). This `MERGE_STATE` mutation folds the keys and values returned from the API into the application state in one step, and it's all done in a way that Vue can react properly to the changes (*i.e.*, it uses `Vue.set()`).

The API need not return a full representation of the state. For example, if an API call needs to update `state.ui.userForm.fields`, the API can just return the contents of the `fields` object (or any portion thereof) and your action can look like this:

```JavaScript
context.commit("MERGE_STATE", { ui: { userForm: { fields: response.data } } })
```

This will navigate `stateMerge` directly to the place in your state where the response data should be merged, leaving the rest of your state unaffected (and even any keys of `ui.userForm.fields` that aren't part of the JSON response).

In addition to API calls, it can also be used for, say, updating `data` elements that are two-way-bound to form fields to set them to a Vuex state object, or vice versa to merge changes from the form back into the Vuex state.

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
