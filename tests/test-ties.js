import {ties} from '../dist/data-tier.js';
import Observable from '../dist/object-observer.min.js';

let suite = Utils.JustTest.createSuite({name: 'Testing ties'});

suite.addTest({name: 'adding a tie and then a view'}, function(pass, fail) {
	let newEl = document.createElement('div'),
		text = 'text test A';

	ties.create('tiesTestA', Observable.from({name: text}));

	newEl.dataset.tie = 'tiesTestA:name => textContent';
	document.body.appendChild(newEl);

	setTimeout(function() {
		if (newEl.textContent !== text) fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
		pass();
	}, 0);
});

suite.addTest({name: 'adding a view and then a tie'}, function(pass, fail) {
	let newEl = document.createElement('div'),
		text = 'text test B';

	newEl.dataset.tie = 'tiesTestB:name => textContent';
	document.body.appendChild(newEl);

	setTimeout(function() {
		ties.create('tiesTestB', Observable.from({name: text}));
		if (newEl.textContent !== text) fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
		pass();
	}, 0);
});

suite.addTest({name: 'creating a tie with an undefined data'}, function(pass, fail) {
	let newEl = document.createElement('div'),
		o = {text: 'text test C'},
		t = ties.create('tiesTestC');
	newEl.dataset.tie = 'tiesTestC:text => textContent';
	document.body.appendChild(newEl);

	setTimeout(function() {
		if (newEl.textContent) fail(new Error('preliminary expectation failed: expected the content to be empty'));
		t.model = Observable.from(o);
		if (newEl.textContent !== o.text) fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
		pass();
	}, 0);
});

suite.addTest({name: 'creating a tie with a NULL data'}, function(pass, fail) {
	let newEl = document.createElement('div'),
		o = {text: 'text test D'},
		t = ties.create('tiesTestD', null);
	newEl.dataset.tie = 'tiesTestD:text => textContent';
	document.body.appendChild(newEl);

	setTimeout(function() {
		if (newEl.textContent) fail(new Error('preliminary expectation failed: expected the content to be empty'));
		t.model = Observable.from(o);
		if (newEl.textContent !== o.text) fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
		pass();
	}, 0);
});

suite.addTest({name: 'setting a tie with a non Observable object'}, function(pass, fail) {
	let newEl = document.createElement('div'),
		o = {text: 'text test E'},
		t = ties.create('tiesTestE', o);
	newEl.dataset.tie = 'tiesTestE:text => textContent';
	document.body.appendChild(newEl);

	setTimeout(function() {
		if (newEl.textContent !== o.text) fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));

		let newO = {text: 'text test E new'};
		t.model = newO;
		setTimeout(function() {
			if (newEl.textContent !== newO.text) fail(new Error('expected the content to be "text test E new"; found: ' + newEl.textContent));
			pass();
		}, 0);
	}, 0);
});

suite.addTest({name: 'setting a tie with a non object value - negative'}, function(pass, fail) {
	try {
		ties.create('tiesTestE', 5);
		fail('flow was not supposed to get to this point');
	} catch (e) {
		pass();
	}
});

suite.addTest({name: 'tie should be sealed - negative'}, function(pass, fail) {
	try {
		let tie = ties.create('tiesTestSealed', {});
		tie.someProp = 'text';
		fail('flow was not supposed to get to this point');
	} catch (e) {
		pass();
	}
});

suite.run();