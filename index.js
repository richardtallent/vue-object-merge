import Vue from "vue"

exports.stateMerge = function(state, value, name) {
	let doIterate = !!value && typeof value === "object" && !Array.isArray(value)
	if (doIterate) {
		const t = Object.prototype.toString.call(value)
		doIterate = t !== "[object RegExp]" && t !== "[object Date]"
		if (doIterate && (name == null || state.hasOwnProperty(name))) {
			const newDestination = name == null ? state : state[name]
			for (const prop in value) {
				stateMerge(newDestination, value[prop], prop)
			}
			return
		}
	}
	Vue.set(state, name, value)
}
