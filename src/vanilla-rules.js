(function (scope) {
    'use strict';

    var rules;

    if (typeof scope.DataTier !== 'object' || !scope.DataTier) {
        throw new Error('Vanilla rules appliance failed: DataTier library not found');
    } else {
        rules = scope.DataTier.Rules;
    }

    rules.add('tieValue', 'value');

    rules.add('tieText', 'textContent');

    rules.add('tiePlaceholder', 'placeholder');

    rules.add('tieTooltip', 'title');

    rules.add('tieImage', 'src');

    rules.add('tieDateValue', {
        dataToView: function (view, tieValue) {
            view.value = tieValue.data.toLocaleString();
        }
    });

    rules.add('tieDateText', {
        dataToView: function (view, tieValue) {
            view.textContent = tieValue.data.toLocaleString();
        }
    });

    rules.add('tieList', {
        resolvePath: function (tieValue) {
            var ruleData = tieValue.split(' ');
            return pathToNodes(ruleData[0]);                    //  TODO
        },
        dataToView: function (template, tiedValue) {
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
    });

})(this);