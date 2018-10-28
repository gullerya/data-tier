import * as DataTier from '../../dist/module/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing array changes (static binding)'}),
	ordersTie = DataTier.ties.create('ordersASB'),
	element = document.createElement('div');

suite.addTest({name: 'array manipulation flow'}, async (pass, fail) => {

	//	add element with static binding on element 2
	element.dataset.tie = 'ordersASB:2 => textContent';
	document.body.appendChild(element);
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '') fail('expected textContent to be [], found ' + element.textContent);

	//	add array having element 2
	ordersTie.model = ['0', '1', '2', '3'];
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '2') fail('expected textContent to be [2], found ' + element.textContent);

	//	unshift
	ordersTie.model.unshift('primordial');
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '1') fail('expected textContent to be [1], found ' + element.textContent);

	//	shift
	ordersTie.model.shift();
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '2') fail('expected textContent to be [2], found ' + element.textContent);
	ordersTie.model.shift();
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '3') fail('expected textContent to be [3], found ' + element.textContent);
	ordersTie.model.shift();
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '') fail('expected textContent to be [], found ' + element.textContent);

	//	push
	ordersTie.model.push('_');
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '_') fail('expected textContent to be [_], found ' + element.textContent);

	//	pop
	ordersTie.model.pop();
	await new Promise(res => setTimeout(res, 0));
	if (element.textContent !== '') fail('expected textContent to be [], found ' + element.textContent);

	pass();
});

suite.run();