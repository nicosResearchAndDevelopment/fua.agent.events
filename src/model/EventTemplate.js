/// <reference types="../types.d.ts" />

const
    util  = require('../agent.event.util.js'),
    model = require('../agent.event.model.js');

class EventTemplate {

    #agent   = null;
    #default = {};

    /**
     * @param {EventAgent} agent
     * @param {CloudEvent} defaultParam
     */
    constructor(agent, defaultParam) {
        util.assert(agent instanceof model.EventAgent, 'expected agent to be an EventAgent');
        this.#agent   = agent;
        this.#default = defaultParam;
    } // EventTemplate#constructor

    /**
     * @template T
     * @param {CloudEvent<T>} eventParam
     * @returns {Event<T>}
     */
    fromEvent(eventParam) {
        return this.#agent.createEvent({
            ...this.#default,
            ...eventParam
        });
    } // EventTemplate#fromEvent

    /**
     * @template T
     * @param {any} eventData
     * @param {string} [contentType]
     * @returns {Event<T>}
     */
    fromData(eventData, contentType) {
        const eventParam = contentType
            ? {data: eventData, datacontenttype: contentType}
            : {data: eventData}
        return this.fromEvent(eventParam);
    } // EventTemplate#fromData

    /**
     * @template T
     * @param {Object} eventData
     * @returns {Event<T>}
     */
    fromJSON(eventData) {
        return this.fromData(eventData, 'application/json');
    } // EventTemplate#fromJSON

} // EventTemplate

module.exports = EventTemplate;
