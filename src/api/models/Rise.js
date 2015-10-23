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

		config: {
			type: 'object',
			required: false
		},

		// status: {
		// 	type: 'string',
		// 	required: true
		// },
		//
		// geoModel: {
		// 	type: 'string',
		// 	required: false,
		// },
		//
		// patches: {
		// 	type: 'array',
		// 	required: false
		// },
		//
		// panoramaImage: {
		// 	type: 'string',
		// 	required: false,
		// },
		//
		// scannerInfo: {
		// 	type: 'object',
		// 	required: false
		// }
	}
};
