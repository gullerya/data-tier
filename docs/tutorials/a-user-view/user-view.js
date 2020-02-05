import * as DataTier from '../../../dist/data-tier.js';

//	let's assume that we are bringing the user data over a wire
new Promise(resolve => setTimeout(() =>
	resolve({
		firstName: 'Aya',
		lastName: 'Guller',
		age: 4,
		active: true,
		address: {
			country: 'Dreamland',
			city: 'Hope',
			street: 'Thousand Smiles',
			block: 6,
			apartment: 11
		}
	})), 1000)
	.then(userData => {
		const model = DataTier.ties.create('userInfo', userData);
		model.classes = { active: true };
		model.observe(() => {
			model.classes.inactive = !model.active;
		}, { path: 'active' });
	});

customElements.define('user-view', class extends HTMLElement { });