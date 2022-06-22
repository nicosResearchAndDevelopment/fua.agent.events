/// <reference types="../types.d.ts" />

const
    util  = require('../agent.event.util.js'),
    model = require('../agent.event.model.js');

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
        util.assert(cloudEvent instanceof model.CloudEvent, 'expected cloudEvent to be a CloudEvent');
        util.assert(emitter instanceof model.EventEmitter, 'expected emitter to be an EventEmitter');
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
        util.assert(!this.#emitted, 'Event<' + this.id + '> was already emitted');
        this.#emitted = true;
        if (ensureDelivery) {
            // return Promise.all(
            //     this.#emitter
            //         .listeners(this.type)
            //         .map(async (listener) => listener(this))
            // ).then(() => this);
            return this.#emitter.emit(this.type, this).then(() => this);
        } else {
            this.#emitter.emit(this.type, this);
            return this;
        }
    } // Event#emit

    /**
     * @param {boolean} [binary=false]
     * @returns {StructuredEncoding | BinaryEncoding}
     */
    encode(binary = false) {
        const cloudEvent = new model.CloudEvent(this);
        return util.encodeCloudEvent(cloudEvent, binary);
    } // Event#encode

} // Event

module.exports = Event;
