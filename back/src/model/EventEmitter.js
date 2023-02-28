/// <reference types="../types.d.ts" />

const
    util  = require('../agent.event.util.js'),
    model = require('../agent.event.model.js');

/**
 * @alias fua.agent.event.EventEmitter
 */
class EventEmitter {

    /** @type {Map<string | RegExp, Map<Function, boolean>>} */
    #events = new Map();

    on(eventPattern, listener) {
        util.assert(util.isEventPattern(eventPattern), 'expected eventPattern to be an event string');
        util.assert(util.isFunction(listener), 'expected listener to be a function');

        let listeners = this.#events.get(eventPattern);
        if (!listeners) this.#events.set(eventPattern, listeners = new Map());
        listeners.set(listener, false);

        return this;
    } // EventEmitter#on

    once(eventPattern, listener) {
        util.assert(util.isEventPattern(eventPattern), 'expected eventPattern to be an event string');
        util.assert(util.isFunction(listener), 'expected listener to be a function');

        let listeners = this.#events.get(eventPattern);
        if (!listeners) this.#events.set(eventPattern, listeners = new Map());
        listeners.set(listener, true);

        return this;
    } // EventEmitter#once

    off(eventPattern, listener) {
        util.assert(util.isEventPattern(eventPattern), 'expected eventPattern to be an event string');
        util.assert(util.isFunction(listener), 'expected listener to be a function');

        let listeners = this.#events.get(eventPattern);
        if (listeners) listeners.delete(listener);
        if (listeners && listeners.size === 0) this.#events.delete(eventPattern);

        return this;
    } // EventEmitter#off

    emit(eventName, ...args) {
        util.assert(util.isEventName(eventName), 'expected eventName to be an event string');

        let matchedListeners = [];
        for (let [eventPattern, listeners] of this.#events.entries()) {
            if (util.eventNameMatchesPattern(eventName, eventPattern)) {
                for (let [listener, once] of listeners.entries()) {
                    matchedListeners.push(listener);
                    if (once) listeners.delete(listener);
                }
                if (listeners.size === 0) this.#events.delete(eventPattern);
            }
        }

        return Promise.all(matchedListeners.map(async listener => listener.apply(null, args)));
    } // EventEmitter#emit

    clear(clearPattern) {
        util.assert(util.isEventPattern(clearPattern), 'expected clearPattern to be an event string');

        for (let [eventPattern, listeners] of this.#events.entries()) {
            if (util.eventNameMatchesPattern(eventPattern, clearPattern)) {
                for (let listener of listeners.keys()) {
                    listeners.delete(listener);
                }
                if (listeners.size === 0) this.#events.delete(eventPattern);
            }
        }

        return this;
    } // EventEmitter#clear

} // EventEmitter

module.exports = EventEmitter;
