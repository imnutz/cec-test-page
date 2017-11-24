import { html } from 'lit-html';
import { render } from 'lit-html/lib/lit-extended';

import data from './data';

const model = {
    messages: data,
    formattedMessage: null,
    changes: null,
    showLog: false,

    saleRepKey: 'label.owner.id.name',
    stageNameKey: 'label.stage.name.stagename',
    activityTypeKey: 'label.activity.activitytype',
    yearCreatedKey: 'created.aag81lMifn6q',
    allOption: 'GDC_SELECT_ALL',

    present(proposal) {
        this.broadcast = proposal.broadcast;

        if (proposal.receivedMessage) {
            this.formattedMessage = JSON.stringify(proposal.receivedMessage, null, 2);

            const receivedData = proposal.receivedMessage.gdc.setFilterContext || [];
            const parsedMessages = this.parseMessage(receivedData);

            const keys = Object.keys(parsedMessages);
            keys.forEach((key) => {
                this._updateModelProp(key, parsedMessages[key]);
            });
        }

        if (this.broadcast) {
            const { filterId, options } = proposal.value;

            this.changes = this.composeMessage(filterId, options);
        }

        if (proposal.selectedValue) {
            this._updateModelProp(proposal.selectedValue.filterId, proposal.selectedValue.values);
        }

        if (proposal.toggleLog) {
            this.showLog = !this.showLog;
        }

        if (proposal.selectedAllId) {
            this._selectAll(proposal.selectedAllId);
        }

        this.represent(this);
    },

    _updateModelProp(prop, values) {
        if (!values || !values.length) return;

        const modelValues = this.messages[prop] || [];

        modelValues.forEach((modelVal) => {
            modelVal.selected = this._contains(values, modelVal.value);
        });
    },

    _contains(array = [], value) {
        if (array.length === 1 && array[0] === this.allOption) return true;

        return array.some((val) => {
            return value === val;
        });
    },

    _isAllItemsSelected(filterId) {
        var data = this.messages[filterId] || [];

        return data.every(opt => opt.selected);
    },

    _selectAll(filterId) {
        (this.messages[filterId] || []).forEach(item => item.selected = true);
    },

    parseMessage(filters) {
        filters = filters || [];

        return filters.reduce(function(acc, filter) {
            if (!acc[filter.label]) {
                acc[filter.label] = [ filter.value ];
            } else {
                acc[filter.label].push(filter.value);
            }

            return acc;
        }, {});
    },

    composeMessage(filterId, options) {
        const data = {
            gdc: {
                name: "filter.value.changed",
                type: "app.ok"
            }
        };

        if (this._isAllItemsSelected(filterId)) {
            data.gdc.data = [
                {
                    label: filterId,
                    value: this.allOption
                }
            ];
        } else {
            const changes = options.map((opt) => {
                return {
                    label: filterId,
                    value: opt
                };
            });

            data.gdc.data = changes;
        }

        console.log(data);

        return data;
    },

    getSaleRepData() {
        return this.messages[this.saleRepKey];
    },

    getSaleRepKey() {
        return this.saleRepKey;
    },

    getStageNameData() {
        return this.messages[this.stageNameKey];
    },

    getStageNameKey() {
        return this.stageNameKey;
    },

    getActivityTypeData() {
        return this.messages[this.activityTypeKey];
    },

    getActivityTypeKey() {
        return this.activityTypeKey;
    },

    getYearCreatedKey() {
        return this.yearCreatedKey;
    },

    getYearCreatedData() {
        return this.messages[this.yearCreatedKey];
    }
};

const state = {
    represent(model) {
        const saleRepData = {
            name: 'saleRep',
            clazz: model.getSaleRepKey(),
            size: 10,
            options: model.getSaleRepData()
        },
        stageNameData = {
            name: 'stageName',
            clazz: model.getStageNameKey(),
            size: 10,
            options: model.getStageNameData()
        },
        activityTypeData = {
            name: 'activityType',
            clazz: model.getActivityTypeKey(),
            size: 10,
            options: model.getActivityTypeData()
        },
        yearCreatedData = {
            name: 'yearCreated',
            clazz: model.getYearCreatedKey(),
            size: 10,
            options: model.getYearCreatedData()
        },
        { formattedMessage, showLog } = model;

        if (model.broadcast) {
            if (window.parent) {
                window.parent.postMessage(JSON.stringify(model.changes), '*');
            }
        } else {
            const page = this.view.page(
                this.action,
                {
                    saleRepData,
                    stageNameData,
                    activityTypeData,
                    yearCreatedData,
                    formattedMessage,
                    showLog
                }
            );

            this.view.render(page);
        }

        this.nextAtion(model);
    },

    nextAtion(model) {
        if (model.broadcast) {
            this.action.broadcastDone();
        }
    }
};

const action = {
    onMessage(message) {
        const jsonData = JSON.parse(message.data);

        this.present({
            receivedMessage: jsonData
        })
    },

    init() {
        this.present({});
    },

    send(filterId, options) {
        this.present({
            broadcast: true,
            value: { filterId, options }
        });
    },

    selectedChange(filterId, values) {
        this.present({
            selectedValue: { filterId, values }
        });
    },

    broadcastDone() {
        this.present({
            broadcast: false
        });
    },

    toggleLog() {
        this.present({
            toggleLog: true
        });
    },

    selectAll(clazz) {
        this.present({
            selectedAllId: clazz
        })
    }
};

const view = {
    createFilterOption(data) {
        let optElem;

        if (data.selected) {
            optElem = html`<option value=${data.value} selected="true">${data.value}</option>`;
        } else {
            optElem = html`<option value=${data.value}>${data.value}</option>`;
        }

        return optElem;
    },

    createFilter(changeAction, { name, clazz, size, options }) {
        const changeHandler = (e) => {
            const saleRepEle = document.querySelector(`[name="${name}"]`);
            const selectedValues = [...saleRepEle.selectedOptions]
                                        .map((opt) => opt.value);

            changeAction(clazz, selectedValues);
        }
        return html`
            <select name=${name} class$=${clazz} multiple size=${size} on-change=${changeHandler}>
                ${ options.map(this.createFilterOption) }
             </select>
        `;
    },

    page(action, { saleRepData, stageNameData, activityTypeData, yearCreatedData, formattedMessage, showLog }) {
        const sendHandler = (data, e) => {
            const selectElement = document.querySelector(`[name="${data.name}"]`);
            const selectedValues = [...selectElement.selectedOptions]
                                        .map((opt) => opt.value);
            action.send.call(action, data.clazz, selectedValues);
        };

        const logElement = showLog ?
            html`
                <div class="data">
                    <h3>Log</h3>
                    <pre>${formattedMessage}</pre>
                </div>
            `
            : '';
        return html`
            <div class="container">
                <h2>Custom widget - Stage Name</h2>
                <div class="widget">
                    ${this.createFilter(action.selectedChange.bind(action), stageNameData)}
                </div>
            </div>
            <div class="btns">
                <button on-click="${sendHandler.bind(null, stageNameData)}">Send</button>
                <a href="#" on-click="${action.selectAll.bind(action, stageNameData.clazz)}">select all</a>
                <a href="#" on-click="${action.toggleLog.bind(action)}">view log</a>
            </div>
            ${logElement}
        `;
    },

    render(html) {
        render(html, document.body);
    }
};

function bindEvent(action) {
    window.addEventListener('message', action.onMessage.bind(action), false);
}

function start() {
    action.present = model.present.bind(model);

    model.represent = state.represent.bind(state);

    state.render = view.render;
    state.view = view;
    state.action = action;

    bindEvent(action);

    action.init();
}

start();
