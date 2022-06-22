/// <reference types="../types.d.ts" />

const
    util  = require('../agent.event.util.js'),
    model = require('../agent.event.model.js');

class EventAgent {

    #emitter    = new model.EventEmitter();
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
        util.assert(util.isString(eventType), 'expected eventType to be a string');
        util.assert(util.isFunction(validator), 'expected validator to be a function');
        util.assert(!this.#validators.has(eventType), 'eventType="' + eventType + '" has already been added');
        this.#validators.set(eventType, validator);
        return this;
    } // EventAgent#addValidator

    /**
     * @template T
     * @param {CloudEvent<T>} eventParam
     * @returns {Event<T>}
     */
    createEvent(eventParam) {
        const cloudEvent = (eventParam instanceof model.CloudEvent)
            ? eventParam
            : new model.CloudEvent(eventParam);
        if (this.#validators.has(cloudEvent.type))
            this.#validators.get(cloudEvent.type).call(this, cloudEvent);
        return new model.Event(cloudEvent, this.#emitter);
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
     * @param {string | StructuredEncoding | BinaryEncoding} encoded
     * @returns {Event<T>}
     */
    decode(encoded) {
        const eventParam = (typeof encoded === 'string')
            ? JSON.parse(encoded)
            : util.decodeCloudEvent(encoded);
        return this.createEvent(eventParam);
    } // EventAgent#decode

    /**
     * @param {CloudEvent} defaultParam
     * @returns {Template}
     */
    createTemplate(defaultParam) {
        return new model.EventTemplate(this, defaultParam);
    } // EventAgent#createTemplate

} // EventAgent

module.exports = EventAgent;
