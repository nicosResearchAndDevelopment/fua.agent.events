const
    {CloudEvent, HTTP} = require('cloudevents'),
    EventEmitter       = require('events');

/**
 * @template T
 * @property {string} id
 * @property {string} specversion
 * @property {string} source
 * @property {string} type
 * @property {string} [datacontenttype]
 * @property {string} [dataschema]
 * @property {string} [subject]
 * @property {string} [time]
 * @property {T} [data]
 * @property {string} [data_base64]
 * @see https://github.com/cloudevents/sdk-javascript/blob/main/src/event/interfaces.ts JavaScript SDK for CloudEvents
 */
class Event {

    #emitter = null;
    #emitted = false;

    /**
     * @param {CloudEvent<T>} cloudEvent
     * @param {EventEmitter} emitter
     */
    constructor(cloudEvent, emitter) {
        if (!(cloudEvent instanceof CloudEvent)) throw new Error('expected cloudEvent to be a CloudEvent');
        if (!(emitter instanceof EventEmitter)) throw new Error('expected emitter to be an EventEmitter');
        this.#emitter    = emitter;
        const enumerable = true;
        for (let [key, value] of Object.entries(cloudEvent.toJSON())) {
            if (value) Object.defineProperty(this, key, {value, enumerable})
        }
    } // Event#constructor

    /**
     * @type {boolean}
     */
    get emitted() {
        return this.#emitted;
    } // Event#emitted

    /**
     * @param {boolean} [ensureDelivery=false]
     * @returns {Event<T>|Promise<Event<T>>}
     */
    emit(ensureDelivery = false) {
        if (this.#emitted) throw new Error('Event<' + this.id + '> was already emitted');
        this.#emitted = true;
        if (ensureDelivery) {
            return Promise.all(
                this.#emitter
                    .listeners(this.type)
                    .map(async (listener) => listener(this))
            ).then(() => this);
        } else {
            this.#emitter.emit(this.type, this);
            return this;
        }
    } // Event#emit

    /**
     * @param {true} [binary=false]
     * @returns {{headers: {[key: string]: string}, body: string}}
     */
    encode(binary = false) {
        const cloudEvent = new CloudEvent(this);
        return binary ? HTTP.binary(cloudEvent) : HTTP.structured(cloudEvent);
    } // Event#encode

} // Event

class Template {

    #agent   = null;
    #default = {};

    /**
     * @param {EventAgent} agent
     * @param {CloudEvent} defaultParam
     */
    constructor(agent, defaultParam) {
        if (!(agent instanceof EventAgent)) throw new Error('expected agent to be an EventAgent');
        this.#agent   = agent;
        this.#default = defaultParam;
    } // Template#constructor

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
    } // Template#fromEvent

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
    } // Template#fromData

    fromJSON(eventData) {
        return this.fromData(eventData, 'application/json');
    } // Template#fromJSON

} // Template

class EventAgent {

    #emitter    = new EventEmitter();
    #validators = new Map();

    /**
     * @param eventType
     * @param callback
     * @returns {EventAgent}
     */
    on(eventType, callback) {
        this.#emitter.on(eventType, callback);
        return this;
    } // EventAgent#on

    /**
     * @param eventType
     * @param callback
     * @returns {EventAgent}
     */
    once(eventType, callback) {
        this.#emitter.once(eventType, callback);
        return this;
    } // EventAgent#once

    /**
     * @param eventType
     * @param callback
     * @returns {EventAgent}
     */
    off(eventType, callback) {
        this.#emitter.off(eventType, callback);
        return this;
    } // EventAgent#off

    addValidator(eventType, validator) {
        if (typeof eventType !== 'string') throw new Error('expected eventType to be a string');
        if (typeof validator !== 'function') throw new Error('expected validator to be a function');
        if (this.#validators.has(eventType)) throw new Error('eventType="' + eventType + '" has already been added');
        this.#validators.set(eventType, validator);
        return this;
    } // EventAgent#addValidator

    /**
     * @template T
     * @param {CloudEvent<T>} eventParam
     * @returns {Event<T>}
     */
    createEvent(eventParam) {
        const cloudEvent = (eventParam instanceof CloudEvent)
            ? eventParam
            : new CloudEvent(eventParam);
        if (this.#validators.has(cloudEvent.type))
            this.#validators.get(cloudEvent.type).call(this, cloudEvent);
        return new Event(cloudEvent, this.#emitter);
    } // EventAgent#createEvent

    /**
     * @template T
     * @param {CloudEvent<T>} eventParam
     * @param {boolean} [ensureDelivery=false]
     * @returns {Event<T>|Promise<Event<T>>}
     */
    emit(eventParam, ensureDelivery = false) {
        return this.createEvent(eventParam).emit(ensureDelivery);
    } // EventAgent#createEvent

    /**
     * @template T
     * @param {string | {headers: {[key: string]: string}, body: string}} encoded
     * @returns {Event<T>}
     */
    decode(encoded) {
        const eventParam = (typeof encoded === 'string')
            ? JSON.parse(encoded)
            : HTTP.toEvent(encoded);
        return this.createEvent(eventParam);
    } // EventAgent#decode

    /**
     * @param {CloudEvent} defaultParam
     * @returns {Template}
     */
    createTemplate(defaultParam) {
        return new Template(this, defaultParam);
    } // EventAgent#createTemplate

} // EventAgent

module.exports = EventAgent;
