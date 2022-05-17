const
    util         = require('./agent.event.util.js'),
    {CloudEvent} = require('cloudevents'),
    EventEmitter = require('events');

class EventAgent {

    #eventPrototype = {};
    #eventEmitter   = new EventEmitter();

    #createEventPrototype(param) {
        const agent = this;
        return {
            async emit(ensureDelivery = true) {
                const event = this;
                if (ensureDelivery) {
                    await Promise.all(
                        agent.#eventEmitter
                            .listeners(event.type)
                            .map(async (listener) => listener(event))
                    );
                } else {
                    agent.#eventEmitter.emit(event.type, event);
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

    off(eventName, callback) {
        this.#eventEmitter.off(eventName, callback);
        return this;
    } // EventAgent#off

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
