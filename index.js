import Vue from "vue"

exports.stateMerge = function(state, value, propName) {
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
