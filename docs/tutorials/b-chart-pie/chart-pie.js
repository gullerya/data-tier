import * as DataTier from '../../../dist/data-tier.js?autostart=false';

const
	template = document.createElement('template');

template.innerHTML = `
	<style>
	</style>

	<div class="legend">
		<span data-tie="root:legend.entries.keyA"></span>
	</div>
	<div class="chart">
		<span data-tie="root:data.lastName"></span>
		<span data-tie="root:data.firstName"></span>
		<span data-tie="root:data.age"></span>
	</div>
	<slot class="slot"></slot>
`;

customElements.define('chart-pie', class extends HTMLElement {
	constructor() {
		super();
		this.setAttribute('data-tie-root', '');
		this.setAttribute('data-tie-blackbox', '');
		this.attachShadow({ mode: 'open' })
			.appendChild(template.content.cloneNode(true));
		DataTier.addRootDocument(this.shadowRoot);
	}

	connectedCallback() {
	}
});