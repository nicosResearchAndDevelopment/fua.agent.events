const
    util         = require('@nrd/fua.core.util'),
    {CloudEvent} = require('cloudevents'),
    EventEmitter = require('events');

class EventAgent {

    #eventPrototype = {};
    #eventEmitter   = new EventEmitter();

    #createEventPrototype(param) {
        const agent = this;
        return {
            _emitted: false,
            emit(ensureDelivery = false) {
                const event = this;
                if (event._emitted) throw new Error('Event<' + event.id + '> was already emitted');
                Object.defineProperties(event, {
                    _emitted: {value: true, enumerable: false}
                });
                if (ensureDelivery) {
                    return Promise.all(
                        agent.#eventEmitter
                            .listeners(event.type)
                            .map(async (listener) => listener(event))
                    ).then(() => event);
                } else {
                    agent.#eventEmitter.emit(event.type, event);
                    return event;
                }
            }
        };
    } // EventAgent##createEventPrototype

    constructor(param = {}) {
        this.#eventPrototype = this.#createEventPrototype(param);
    } // EventAgent#constructor

    on(eventName, callback) {
        this.#eventEmitter.on(eventName, callback);
        return this;
    } // EventAgent#on

    once(eventName, callback) {
        this.#eventEmitter.once(eventName, callback);
        return this;
    } // EventAgent#once

    /**
     *
     * @param eventName
     * @param callback
     * @returns {EventAgent}
     */
    off(eventName, callback) {
        this.#eventEmitter.off(eventName, callback);
        return this;
    } // EventAgent#off

    /**
     * @template T
     * @param {import("./types.d.ts").CloudEvent<T>} param
     * @returns {import("./types.d.ts").Event<T>}
     */
    createEvent(param) {
        const
            cloudEvent      = new CloudEvent(param),
            eventEntries    = Object.entries(cloudEvent.toJSON()).filter((entry) => entry[1]),
            eventProperties = Object.fromEntries(eventEntries.map(([key, value]) => [key, {value, enumerable: true}]));
        return Object.create(this.#eventPrototype, eventProperties);
    } // EventAgent#createEvent

    // TODO

} // EventAgent

module.exports = EventAgent;
