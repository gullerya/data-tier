import * as DataTier from '../../../dist/data-tier.js?autostart=false';

const
	template = document.createElement('template');

template.innerHTML = `
	<style>
		:host {
			display: flex;
		}
	</style>

	<div class="legend">
		<span data-tie="root:legend.entries.0.keyA"></span>
	</div>
	<div class="chart">
		<span data-tie="root:data.0.keyA"></span>
	</div>
`;

customElements.define('chart-pie', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' })
			.appendChild(template.content.cloneNode(true));
		DataTier.ties.create(this);
		DataTier.addDocument(this.shadowRoot);
	}

	set legend(legend) {
		if (legend) {
			console.log(legend.entries.length);
		}
	}

	set data(data) {
		if (data) {
			console.log(data.length);
		}
	}

	connectedCallback() {
	}
});