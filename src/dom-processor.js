export class DOMProcessor {
	constructor(dataTierInstance) {
		this.addElement.dataTierInstance = dataTierInstance;
		this.elementsMap = new WeakMap();
	}

	addElement(element) {
		this.elementsMap.set(element, {});
	}

	delElement(element) {
		this.elementsMap.delete(element);
	}

	hasElement(element) {
		return this.elementsMap.has(element);
	}
}