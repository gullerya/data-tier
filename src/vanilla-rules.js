(function (scope) {
    'use strict';

    const apis = scope.DataTier;

    if (typeof apis !== 'object' || !apis) {
        throw new Error('Vanilla rules appliance failed: DataTier library not found');
    }

    apis.setRule('tie', new apis.Rule({
        dataToView: function (data, view) {
            view.textContent = data;
        },
        inputToData: function () {
            throw new Error('to be implemented');
        }
    }));

    apis.setRule('tieValue', new apis.Rule({
        dataToView: function (data, view) {
            view.value = data;
        },
        inputToData: function (view) {
            throw new Error('to be implemented');
        }
    }));

    apis.setRule('tieText', new apis.Rule({
        dataToView: function (data, view) {
            view.textContent = data;
        },
        inputToData: function () {
            throw new Error('to be implemented');
        }
    }));

    apis.setRule('tiePlaceholder', new apis.Rule({
        dataToView: function (data, view) {
            view.placeholder = data;
        }
    }));

    apis.setRule('tieTooltip', new apis.Rule({
        dataToView: function (data, view) {
            view.title = data;
        }
    }));

    apis.setRule('tieImage', new apis.Rule({
        dataToView: function (data, view) {
            view.src = data;
        }
    }));

    apis.setRule('tieDateValue', new apis.Rule({
        dataToView: function (data, view) {
            view.value = data.toLocaleString();
        },
        inputToData: function () {
            throw new Error('to be implemented');
        }
    }));

    apis.setRule('tieDateText', new apis.Rule({
        dataToView: function (data, view) {
            view.textContent = data.toLocaleString();
        }
    }));

    apis.setRule('tieList', new apis.Rule({
        resolvePath: function (tieValue) {
            var ruleData = tieValue.split(' ');
            return pathToNodes(ruleData[0]);
        },
        dataToView: function (tiedValue, template) {
            var container = template.parentNode, i, nv, ruleData, itemId, rulePath, vs, d, df;

            function shortenListTo(cnt, aid) {
                var a = Array.prototype.slice.call(container.querySelectorAll('[data-list-item-aid="' + aid + '"]'), 0);
                while (a.length > cnt) {
                    container.removeChild(a.pop());
                }
                return a.length;
            }

            //	TODO: this check should be moved to earlier phase of processing, this requires enhancement of rule API in general
            if (template.nodeName !== 'TEMPLATE') {
                throw new Error('tieList may be defined on template elements only');
            }
            if (!template.dataset.listSourceAid) {
                template.dataset.listSourceAid = new Date().getTime();
            }
            i = shortenListTo(tiedValue.data ? tiedValue.data.length : 0, template.dataset.listSourceAid);
            if (tiedValue.data && i < tiedValue.data.length) {
                ruleData = template.dataset.tieList.trim().split(/\s+/);
                if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
                    logger.error('invalid parameter for TieList rule specified');
                } else {
                    rulePath = ruleData[0];
                    itemId = ruleData[2];
                    d = template.ownerDocument;
                    df = d.createDocumentFragment();
                    for (; i < tiedValue.data.length; i++) {
                        nv = d.importNode(template.content, true);
                        vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
                        vs.forEach(function (view) {
                            Object.keys(view.dataset).forEach(function (key) {
                                if (view.dataset[key].indexOf(itemId + '.') === 0) {
                                    view.dataset[key] = view.dataset[key].replace(itemId, rulePath + '[' + i + ']');
                                    viewsService.update(view, key);
                                }
                            });
                        });
                        df.appendChild(nv);
                        df.lastElementChild.dataset.listItemAid = template.dataset.listSourceAid;
                    }
                    container.appendChild(df);
                }
            }
        }
    }));

})(this);