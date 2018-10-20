let suite = Utils.JustTest.createSuite({name: 'Testing Performance'});

class Movable extends HTMLElement {
	set coords(c) {
		if (c) {
			this.style.top = c.top + 'px';
			this.style.left = c.left + 'px';
		}
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
		m.dataset.tieProperty = 'm' + i + ' => coords';
		movables.push({
			t: DataTier.ties.create('m' + i, {top: 190 * Math.random(), left: 190 * Math.random()}),
			xi: 3 * Math.random(),
			yi: 3 * Math.random(),
		});
		pg.appendChild(m);
	}

	customElements.whenDefined('movable-element').then(() => {
		let moves = 2000;

		function render() {
			movables.forEach(movable => {
				let m = movable.t.data;
				if (m.top + 10 > 200 || m.top < 0) movable.xi *= -1;
				if (m.left + 10 > 200 || m.left < 0) movable.yi *= -1;
				movable.t.data = {
					top: m.top + movable.xi,
					left: m.left + movable.yi
				};
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
