/// <reference types="../types.d.ts" />

const
    util  = require('../agent.event.util.js'),
    model = require('../agent.event.model.js');

/**
 * @alias fua.agent.event.EventAgent
 */
class EventAgent {

    #emitter    = new model.EventEmitter();
    #validators = new Map();

    /**
     * @param {string} eventPattern
     * @param {Function} callback
     * @returns {EventAgent}
     */
    on(eventPattern, callback) {
        this.#emitter.on(eventPattern, callback);
        return this;
    } // EventAgent#on

    /**
     * @param {string} eventPattern
     * @param {Function} callback
     * @returns {EventAgent}
     */
    once(eventPattern, callback) {
        this.#emitter.once(eventPattern, callback);
        return this;
    } // EventAgent#once

    /**
     * @param {string} eventPattern
     * @param {Function} [callback]
     * @returns {EventAgent}
     */
    off(eventPattern, callback) {
        if (callback) this.#emitter.off(eventPattern, callback);
        else this.#emitter.clear(eventPattern);
        return this;
    } // EventAgent#off

    addValidator(eventName, validator) {
        util.assert(util.isEventName(eventName), 'expected eventName to be an event string');
        util.assert(util.isFunction(validator), 'expected validator to be a function');
        util.assert(!this.#validators.has(eventName), 'eventName="' + eventName + '" has already been added');
        this.#validators.set(eventName, validator);
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
        util.assert(util.isEventName(cloudEvent.type), 'expected cloudEvent.type to be an event string');
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
     * @returns {EventTemplate}
     */
    createTemplate(defaultParam) {
        return new model.EventTemplate(this, defaultParam);
    } // EventAgent#createTemplate

    /**
     * @param {import('socket.io').Socket | import('socket.io-client').Socket | {
     *     on(eventName: string, callback: Function): any,
     *     emit(eventName: string, ...args: any): any,
     *     disconnected?: boolean
     * }} socket
     * @param {string | Array<string>} [outgoing='**']
     * @param {boolean} [binary=false]
     * @returns {void}
     * @see https://socket.io/docs/v4/server-api/#socket IO Server Socket
     * @see https://socket.io/docs/v4/client-api/#socket IO Client Socket
     */
    connectIOSocket(socket, outgoing = '**', binary = false) {
        util.assert(util.isFunction(socket?.on) && util.isFunction(socket?.emit),
            'expected socket to be an IO Socket');
        util.assert(util.isEventPattern(outgoing) || util.isEventPatternArray(outgoing),
            'expected outgoing to be an event string or event string array');

        const
            transportEvent = 'fua.agent.event',
            outgoingEvents = util.toArray(outgoing),
            eventReceiver  = (encoded) => this.decode(encoded).emit(),
            eventSender    = (event) => socket.emit(transportEvent, event.encode(binary)),
            attachSender   = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender   = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        socket.on(transportEvent, eventReceiver);
        if (!socket.disconnected) attachSender();
        socket.on('connect', attachSender);
        socket.on('disconnect', detachSender);
    } // EventAgent#connectIOSocket

} // EventAgent

module.exports = EventAgent;
