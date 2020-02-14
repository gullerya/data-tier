import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing Performance (property tying)' });
class Movable extends HTMLElement {
	set top(top) {
		this.style.top = top + 'px';
	}

	set left(left) {
		this.style.left = left + 'px';
	}
}

customElements.define('movable-element-a', Movable);

suite.runTest({ name: 'perf test - many changes in loop - property tying', timeout: 72000 }, async test => {
	const pg = document.createElement('div');
	pg.style.cssText = 'position: relative;width: 200px;height: 200px; border: 1px solid #aaa';

	const movables = [];
	for (let i = 0; i < 500; i++) {
		const m = document.createElement('movable-element-a');
		m.style.cssText = 'position: absolute;width: 10px;height: 10px; border-radius: 5px; background-color: rgb(' + 255 * Math.random() + ',' + 255 * Math.random() + ',' + 255 * Math.random() + ');';
		m.dataset.tie = 'ma' + i + ':top => top, ma' + i + ':left => left';
		movables.push({
			t: DataTier.ties.create('ma' + i, { top: 190 * Math.random(), left: 190 * Math.random() }),
			xi: 3 * Math.random(),
			yi: 3 * Math.random()
		});
		pg.appendChild(m);
	}
	document.body.appendChild(pg);

	return new Promise(resolve => {
		customElements.whenDefined('movable-element-a').then(() => {
			let moves = 2000;

			function render() {
				movables.forEach(movable => {
					const
						m = movable.t,
						top = m.top,
						left = m.left;
					if (top + 10 > 200 || top < 0) movable.xi *= -1;
					if (left + 10 > 200 || left < 0) movable.yi *= -1;
					Object.assign(m, {
						top: top + movable.xi,
						left: left + movable.yi
					});
				});

				if (--moves > 0) {
					requestAnimationFrame(render);
				} else {
					resolve();
				}
			}

			requestAnimationFrame(render);
		});
	});
});