import { html } from 'lit-html';
import { render } from 'lit-html/lib/lit-extended';

import data from './data';

const model = {
    messages: data,

    saleRepKey: 'label.owner.id.name',
    stageNameKey: 'label.stage.name.stagename',
    activityTypeKey: 'label.activity.activitytype',
    yearCreatedKey: 'created.aag81lMifn6q',
    allOption: 'GDC_SELECT_ALL',

    present(proposal) {
        if (proposal.receivedMessage) {
            const receivedData = proposal.receivedMessage.gdc.setFilterContext || [];

            const parsedMessages = this.parseMessage(receivedData);

            const keys = Object.keys(parsedMessages);
            keys.forEach((key) => {
                this._updateModelProp(key, parsedMessages[key]);
            });
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
        };

        const page = this.view.page({ saleRepData, stageNameData, activityTypeData, yearCreatedData });

        this.view.render(page);
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

    page({ saleRepData, stageNameData, activityTypeData, yearCreatedData }) {
        return html`
            <div class="container">
                <div class="widget">
                    <h3>Sale Rep</h3>
                    ${this.createFilter(saleRepData)}
                </div>
                <div class="widget">
                    <h3>Stage Name</h3>
                    ${this.createFilter(stageNameData)}
                </div>
                <div class="widget">
                    <h3>Activity Type</h3>
                    ${this.createFilter(activityTypeData)}
                </div>

                <div class="widget">
                    <h3>Year (Created)</h3>
                    ${this.createFilter(yearCreatedData)}
                </div>
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

    bindEvent(action);

    action.init();
}

start();
