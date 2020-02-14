import * as DataTier from '../../../dist/data-tier.js?autostart=false';

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
		DataTier.addRootDocument(this.shadowRoot);
	}

	updateList(list, changes) {
		if (!changes || !changes[0] || !changes[0].path.length) {
			this.innerHTML = '';
			if (list) {
				list.forEach(item => {
					const ie = document.createElement('todo-item');
					ie.item = item;
					ie.addEventListener('remove', event => {
						list.splice(list.indexOf(event.target.item), 1);
					});
					this.appendChild(ie);
				});
			}
		} else {
			changes.forEach(change => {
				if (change.type === 'delete') {
					this.children[change.path[0]].remove();
				} else if (change.type === 'insert') {
					const index = change.path[0];
					const ie = document.createElement('todo-item');
					ie.item = list[index];
					ie.addEventListener('remove', event => {
						list.splice(list.indexOf(event.target.item), 1);
					});

					if (index >= this.children.length) {
						this.appendChild(ie);
					} else {
						this.insertBefore(ie, this.children[index]);
					}
				}
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
			background-color: #efefef;
			border-radius: 4px;
		}
	</style>

	<span class="text" data-tie="root:text"></span>
	<span class="delete" data-tie="root:remove => onclick">DEL</span>
`;

customElements.define('todo-item', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' })
			.appendChild(templateItem.content.cloneNode(true));
		DataTier.ties.create(this, {
			remove: () => this.dispatchEvent(new Event('remove'))
		});
		DataTier.addRootDocument(this.shadowRoot);
	}

	connectedCallback() {
		this.setAttribute('data-tie-blackbox', '1');
	}

	set item(item) {
		this._item = item;
		DataTier.ties.get(this).text = item.text;
	}

	get item() {
		return this._item;
	}
});