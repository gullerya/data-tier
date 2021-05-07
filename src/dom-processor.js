import {
	getPath,
	setPath,
	callViewFunction,
	extractViewParams
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
	ADD_LISTENER = 'addEventListener',
	REMOVE_LISTENER = 'removeEventListener';

export class DOMProcessor {
	constructor(dataTierInstance) {
		this._dtInstance = dataTierInstance;
		this._roots = new WeakMap();
		this._elementsMap = new WeakSet();
		this._boundDOMChangesListener = this._domChangesListener.bind(this);
		this._boundChangeListener = this._changeListener.bind(this);
	}

	addDocument(rootDocument) {
		if (!rootDocument || (Node.DOCUMENT_NODE !== rootDocument.nodeType && Node.DOCUMENT_FRAGMENT_NODE !== rootDocument.nodeType)) {
			throw new Error('invalid argument, must be one of: DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE');
		}
		if (this._roots.has(rootDocument)) {
			console.warn('any root document may be added only once');
			return false;
		}

		const mo = new MutationObserver(this._boundDOMChangesListener)
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

	_domChangesListener(changes) {
		let change, changeType, nodes, ni, nl, next;
		for (let i = 0, l = changes.length; i < l; i++) {
			change = changes[i];
			changeType = change.type;
			if (changeType === 'childList') {
				nodes = change.addedNodes;
				for (ni = 0, nl = nodes.length; ni < nl; ni++) {
					next = nodes[ni];
					if (next.nodeType === Node.ELEMENT_NODE) {
						this._addTree(next);
					}
				}

				nodes = change.removedNodes;
				for (ni = 0, nl = nodes.length; ni < nl; ni++) {
					next = nodes[ni];
					if (next.nodeType === Node.ELEMENT_NODE) {
						this._dropTree(next);
					}
				}
			} else if (changeType === 'attributes') {
				const
					attributeName = change.attributeName,
					node = change.target,
					oldValue = change.oldValue,
					newValue = node.getAttribute(attributeName);
				if (attributeName === 'data-tie' && oldValue !== newValue) {
					this._onTieParamChange(node, newValue, oldValue);
				}
			}
		}
	}

	_onTieParamChange(element, newParam, oldParam) {
		if (oldParam) {
			const viewParamsOld = element[this._dtInstance.paramsKey];
			if (viewParamsOld) {
				this._dtInstance.views.delView(element, viewParamsOld);
				this._handleChangeListener(element, REMOVE_LISTENER, viewParamsOld);
			}
		}

		if (newParam) {
			const viewParams = extractViewParams(element);
			if (viewParams) {
				this._dtInstance.views.addView(element, viewParams);
				this._updateFromView(element, viewParams);
				this._handleChangeListener(element, ADD_LISTENER, viewParams);
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

		if (element.nodeName.indexOf('-') > 0 && !element.matches(':defined')) {
			this._waitDefined(element);
		} else {
			const viewParams = extractViewParams(element);
			if (viewParams) {
				this._dtInstance.views.addView(element, viewParams);
				this._updateFromView(element, viewParams);
				this._handleChangeListener(element, ADD_LISTENER, viewParams);
			}

			if (element.shadowRoot) {
				this.addDocument(element.shadowRoot);
			}
		}
	}

	_waitDefined(element) {
		customElements.whenDefined(element.nodeName.toLowerCase()).then(() => {
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

		const viewParams = element[this._dtInstance.paramsKey];
		if (viewParams) {
			if (!viewParams.length) {
				console.log('empty');
			}
			this._dtInstance.views.delView(element, viewParams);
			this._handleChangeListener(element, REMOVE_LISTENER, viewParams);
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

	_handleChangeListener(element, action, viewParams) {
		let viewParam, changeEvent;
		for (let i = 0, l = viewParams.length; i < l; i++) {
			viewParam = viewParams[i];
			changeEvent = viewParam.changeEvent;
			if (changeEvent) {
				element[action](changeEvent, this._boundChangeListener);
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
				if (tie !== undefined) {
					const value = getPath(tie, param.path);
					this._dtInstance.views.setViewProperty(element, param, value);
				}
			}
		}
	}
}