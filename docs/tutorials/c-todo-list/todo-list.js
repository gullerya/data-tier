import * as DataTier from '../../../dist/data-tier.js';

const
	templateList = document.createElement('template'),
	templateItem = document.createElement('template');

templateList.innerHTML = `
	<style>
		:host {
			min-width: 240px;
			min-height: 120px;
			padding: 24px;
			display: flex;
			flex-direction: column;
			overflow-x: hidden;
			overflow-y: auto;
		}
	</style>

	<slot></slot>
`;

customElements.define('todo-list', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' })
			.appendChild(templateList.content.cloneNode(true));
		DataTier.ties.create(this);
	}

	updateList(list) {
		this.innerHTML = '';
		if (list) {
			list.forEach((item, index) => {
				const ie = document.createElement('todo-item');
				DataTier.ties.create(ie, item);
				ie.addEventListener('remove', () => {
					list.splice(index, 1);
				});
				this.appendChild(ie);
			});
		}
	}
});

templateItem.innerHTML = `
	<style>
		:host {
			flex: 1;
			padding: 24px;
			display: flex;
			align-items: center;
		}

		.text {
			flex: 1;
		}

		.delete {
			flex: 0 0 auto;
			padding: 12px;
			font-family: monospace;
			border: none;
			outline: none;
			background-color: #efefef;
			border-radius: 4px;
			cursor: pointer;
			user-select: none;
			box-shadow: 0 0 3px 1px rgba(0, 0, 0, 0.2);
		}
	</style>

	<span class="text" data-tie="scope:text"></span>
	<button class="delete" type="button" data-tie="scope:remove => onclick">DEL</button>
`;

customElements.define('todo-item', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' })
			.appendChild(templateItem.content.cloneNode(true));
		this.shadowRoot.querySelector('.delete').addEventListener('click', () => {
			this.dispatchEvent(new Event('remove'));
		});
	}
});