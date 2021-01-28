import {
	getPath,
	setPath,
	callViewFunction
} from './utils.js';

const
	MUTATION_OBSERVER_OPTIONS = Object.freeze({
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ['data-tie'],
		attributeOldValue: true,
		characterData: false,
		characterDataOldValue: false
	}),
	BOUND_DOM_OBSERVER_KEY = Symbol('bound.dom.observer'),
	BOUND_CHANGE_LISTENER_KEY = Symbol('bound.change.listener');

export class DOMProcessor {
	constructor(dataTierInstance) {
		this._dtInstance = dataTierInstance;
		this._roots = new WeakMap();
		this._elementsMap = new WeakSet();
		this[BOUND_DOM_OBSERVER_KEY] = this._processDomChanges.bind(this);
		this[BOUND_CHANGE_LISTENER_KEY] = this._changeListener.bind(this);
	}

	addDocument(rootDocument) {
		if (!rootDocument || (Node.DOCUMENT_NODE !== rootDocument.nodeType && Node.DOCUMENT_FRAGMENT_NODE !== rootDocument.nodeType)) {
			throw new Error('invalid argument, must be one of: DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE');
		}
		if (this._roots.has(rootDocument)) {
			console.warn('any root document may be added only once');
			return false;
		}

		const mo = new MutationObserver(this[BOUND_DOM_OBSERVER_KEY])
		mo.observe(rootDocument, MUTATION_OBSERVER_OPTIONS);
		this._roots.set(rootDocument, mo);
		for (let i = 0, l = rootDocument.children.length; i < l; i++) {
			this._addTree(rootDocument.children[i]);
		}
		return true;
	}

	removeDocument(rootDocument) {
		if (!this._roots.has(rootDocument)) {
			console.warn(`no root document ${rootDocument} known`);
			return false;
		}

		this._roots.get(rootDocument).disconnect();
		this._roots.delete(rootDocument);
		for (let i = 0, l = rootDocument.children.length; i < l; i++) {
			this._dropTree(rootDocument.children[i]);
		}
		return true;
	}

	_processDomChanges(changes) {
		const l = changes.length;
		let i = 0, change, changeType;

		for (; i < l; i++) {
			change = changes[i];
			changeType = change.type;
			if (changeType === 'attributes') {
				const
					attributeName = change.attributeName,
					node = change.target,
					oldValue = change.oldValue,
					newValue = node.getAttribute(attributeName);
				if (oldValue !== newValue) {
					if (attributeName === 'data-tie') {
						this._onTieParamChange(node, newValue, oldValue);
					}
				}
			} else if (changeType === 'childList') {
				const an = change.addedNodes;
				for (let ai = 0, al = an.length; ai < al; ai++) {
					let next = an[ai];
					if (next.nodeType === Node.ELEMENT_NODE) {
						this._addTree(next);
					}
				}

				const rn = change.removedNodes;
				for (let di = 0, dl = rn.length; di < dl; di++) {
					let next = rn[di];
					if (next.nodeType === Node.ELEMENT_NODE) {
						this._dropTree(next);
					}
				}
			}
		}
	}

	_onTieParamChange(element, newParam, oldParam) {
		if (oldParam) {
			const viewParamsOld = element[this._dtInstance.paramsKey];
			if (viewParamsOld) {
				this._dtInstance.views.delView(element, viewParamsOld);
				for (const viewParamOld of viewParamsOld) {
					if (viewParamOld.changeEvent) {
						element.removeEventListener(viewParamOld.changeEvent, this[BOUND_CHANGE_LISTENER_KEY]);
					}
				}
			}
		}

		if (newParam) {
			const viewParams = this._dtInstance.views.addView(element);
			if (viewParams) {
				this._updateFromView(element, viewParams);
				for (const viewParam of viewParams) {
					if (viewParam.changeEvent) {
						element.addEventListener(viewParam.changeEvent, this[BOUND_CHANGE_LISTENER_KEY]);
					}
				}
			}
		}
	}

	_addTree(root) {
		this._addOne(root);

		if (root.childElementCount) {
			let nextNode;
			const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
			while ((nextNode = tw.nextNode())) {
				this._addOne(nextNode);
			}
		}
	}

	_dropTree(root) {
		this._dropOne(root);

		if (root.childElementCount) {
			let nextNode;
			const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
			while ((nextNode = tw.nextNode())) {
				this._dropOne(nextNode);
			}
		}
	}

	_addOne(element) {
		if (this._elementsMap.has(element)) {
			return;
		} else {
			this._elementsMap.add(element);
		}

		if (element.tagName.indexOf('-') > 0 && !element.matches(':defined')) {
			this._waitDefined(element);
		} else {
			const viewParams = this._dtInstance.views.addView(element);
			if (viewParams) {
				this._updateFromView(element, viewParams);
				for (const viewParam of viewParams) {
					if (viewParam.changeEvent) {
						element.addEventListener(viewParam.changeEvent, this[BOUND_CHANGE_LISTENER_KEY]);
					}
				}
			}

			if (element.shadowRoot) {
				this.addDocument(element.shadowRoot);
			}
		}
	}

	_waitDefined(element) {
		customElements.whenDefined(element.tagName.toLowerCase()).then(() => {
			this._elementsMap.delete(element);
			this._addOne(element);
		});
	}

	_dropOne(element) {
		if (!this._elementsMap.has(element)) {
			return;
		} else {
			this._elementsMap.delete(element);
		}

		let viewParams = element[this._dtInstance.paramsKey];
		if (viewParams) {
			this._dtInstance.views.delView(element, viewParams);
			for (const viewParam of viewParams) {
				if (viewParam.changeEvent) {
					element.removeEventListener(viewParam.changeEvent, this[BOUND_CHANGE_LISTENER_KEY]);
				}
			}
		}

		if (element.shadowRoot) {
			this.removeDocument(element.shadowRoot);
		}
	}

	_changeListener(changeEvent) {
		const
			changeEventType = changeEvent.type,
			element = changeEvent.currentTarget,
			viewParams = element[this._dtInstance.paramsKey];

		if (!viewParams) {
			return;
		}

		let tieParam, tie, newValue;
		let i = viewParams.length;
		while (i--) {
			tieParam = viewParams[i];
			if (tieParam.changeEvent !== changeEventType) {
				continue;
			}

			tie = this._dtInstance.ties.get(tieParam.tieKey);
			if (tie) {
				newValue = element[tieParam.targetProperty];
				setPath(tie, tieParam.path, newValue);
			}
		}
	}

	_updateFromView(element, viewParams) {
		let i = viewParams.length;
		while (i--) {
			const param = viewParams[i];
			if (param.isFunctional) {
				let someData = false;
				const args = [];
				param.fParams.forEach(fp => {
					let arg;
					const tie = this._dtInstance.ties.get(fp.tieKey);
					if (tie) {
						arg = getPath(tie, fp.path);
						someData = true;
					}
					args.push(arg);
				});
				if (someData) {
					args.push(null);
					callViewFunction(element, param.targetProperty, args);
				}
			} else {
				const tie = this._dtInstance.ties.get(param.tieKey);
				if (tie) {
					let value = getPath(tie, param.path);
					if (typeof value === 'undefined') {
						value = '';
					}
					this._dtInstance.views.setViewProperty(element, param, value);
				}
			}
		}
	}
}