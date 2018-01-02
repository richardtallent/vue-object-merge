import Vue from "vue"

exports.stateMerge = function(state, value, propName) {
	// For Date, Array, RegEx, Number, String, Boolean, Math, Function, String, null, and
	// undefined, we want to overwrite the state's value, not iterate. prototype.toString
	// provides a shortcut for this, as all user-defined objects return [object Object],
	// and all of those other types return different values.
	//
	// If the call to `stateMerge` should iterate `state` itself rather than a member of
	// `state`, don't provide a `propName` argument.
	if (
		Object.prototype.toString.call(value) === "[object Object]" &&
		(propName == null || state.hasOwnProperty(propName))
	) {
		const o = propName == null ? state : state[propName]
		for (const prop in value) {
			stateMerge(o, value[prop], prop)
		}
		return
	}
	Vue.set(state, propName, value)
}
