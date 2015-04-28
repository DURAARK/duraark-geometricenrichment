/**
 * E57m.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
		homeDir: {
			type: 'string',
			required: true
		},

		status: {
			type: 'string',
			required: false
		}

	}
};