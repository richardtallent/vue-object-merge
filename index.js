import Vue from "vue";

export const stateMerge = function(state, value, propName, ignoreNull) {
	if (
		Object.prototype.toString.call(value) === "[object Object]" &&
		(propName == null || state.hasOwnProperty(propName))
	) {
		const o = propName == null ? state : state[propName];
		for (var prop in value) {
			stateMerge(o, value[prop], prop, ignoreNull);
		}
		return;
	}
	if (!ignoreNull || value !== null) Vue.set(state, propName, value);
};

export default stateMerge;
