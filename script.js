import { html } from 'lit-html';
import { render } from 'lit-html/lib/lit-extended';

import data from './data';

const model = {
    messages: data,
    formattedMessage: null,
    changes: null,

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

        this.represent(this);
    },

    _updateModelProp(prop, values) {
        if (!values || !values.length) return;

        const modelValues = this.messages[prop];

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

        const changes = options.map((opt) => {
            return {
                label: filterId,
                value: opt
            };
        })

        data.gdc.data = changes;

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
        formattedMessage = model.formattedMessage;

        if (model.broadcast) {
            if (window.parent) {
                window.parent.postMessage(JSON.stringify(model.changes), '*');
            }
        } else {
            const page = this.view.page(
                this.action.send.bind(this.action),
                { saleRepData, stageNameData, activityTypeData, yearCreatedData, formattedMessage }
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

    broadcastDone() {
        this.present({
            broadcast: false
        });
    }
};

const view = {
    createFilterOption(data) {
        let optElem;

        if (data.selected) {
            optElem = html`<option value=${data.value} selected>${data.value}</option>`;
        } else {
            optElem = html`<option value=${data.value}>${data.value}</option>`;
        }

        return optElem;
    },

    createFilter({ name, clazz, size, options }) {
        return html`
            <select name=${name} class$=${clazz} multiple size=${size}>
                ${ options.map(this.createFilterOption) }
             </select>
        `;
    },

    page(sendAction, { saleRepData, stageNameData, activityTypeData, yearCreatedData, formattedMessage }) {
        const sendHandler = (e) => {
            const saleRepEle = document.querySelector('[name="saleRep"]');
            const selectedOptions = [...saleRepEle.options]
                                        .filter((opt) => opt.selected)
                                        .map((opt) => opt.value);
            sendAction(saleRepData.clazz, selectedOptions);
        }
        return html`
            <div class="container">
                <h2>Custom widget - Sale Rep</h2>
                <div class="widget">
                    ${this.createFilter(saleRepData)}
                </div>
            </div>
            <div class="btns">
                <button on-click="${sendHandler}">Send</button>
            </div>
            <div class="data">
                <h3>Log</h3>
                <pre>${formattedMessage}</pre>
            </div>
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
