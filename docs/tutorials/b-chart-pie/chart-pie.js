import * as DataTier from '../../../dist/data-tier.js';

const
	template = document.createElement('template');

template.innerHTML = `
	<style>
	</style>

	<div class="legend">
		<span data-tie="root:legend.entries.keyA"></span>
	</div>
	<div class="chart">
		<span data-tie="root:data"></span>
	</div>
`;

customElements.define('chart-pie', class extends HTMLElement {
	constructor() {
		super();
		this.setAttribute('data-tie-root', '');
		// this.setAttribute('data-tie-blackbox', '');
		this.attachShadow({ mode: 'open' })
			.appendChild(template.content.cloneNode(true));
		// DataTier.addRootDocument(this.shadowRoot);
	}

	set legend(legend) {
		DataTier.ties.get(this).legend = legend;
	}

	set data(data) {
		DataTier.ties.get(this).data = data;
	}

	connectedCallback() {
	}
});