import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Performance'});

class Movable extends HTMLElement {
	set top(top) {
		this.style.top = top + 'px';
	}

	set left(left) {
		this.style.left = left + 'px';
	}
}

customElements.define('movable-element', Movable);

suite.addTest({name: 'perf test - many changes in loop', ttl: 60000}, (pass, fail) => {
	let pg = document.createElement('div');
	pg.style.cssText = 'position: relative;width: 200px;height: 200px; border: 1px solid #aaa';
	document.body.appendChild(pg);

	let movables = [];
	for (let i = 0; i < 500; i++) {
		let m = document.createElement('movable-element');
		m.style.cssText = 'position: absolute;width: 10px;height: 10px; border-radius: 5px; background-color: rgb(' + 255 * Math.random() + ',' + 255 * Math.random() + ',' + 255 * Math.random() + ');';
		m.dataset.tie = 'm' + i + ':top => top, m' + i + ':left => left';
		movables.push({
			t: DataTier.ties.create('m' + i, {top: 190 * Math.random(), left: 190 * Math.random()}),
			xi: 3 * Math.random(),
			yi: 3 * Math.random()
		});
		pg.appendChild(m);
	}

	customElements.whenDefined('movable-element').then(() => {
		let moves = 2000;

		function render() {
			movables.forEach(movable => {
				let m = movable.t.model,
					top = m.top,
					left = m.left;
				if (top + 10 > 200 || top < 0) movable.xi *= -1;
				if (left + 10 > 200 || left < 0) movable.yi *= -1;
				m.top += movable.xi;
				m.left += movable.yi;
			});

			if (--moves > 0) {
				requestAnimationFrame(render);
			} else {
				pass();
			}
		}

		requestAnimationFrame(render);
	});
});

suite.run();
