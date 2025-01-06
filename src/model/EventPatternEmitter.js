const
    util = require('../util.js'),
    assert = require('@fua/core.assert');

class EventPatternEmitter {

    /** @type {Map<model.EventPattern, Map<Function, boolean>>} */
    #events = new Map();

    on(eventPattern, listener) {
        assert.string(eventPattern, util.eventPatternPattern);
        assert.function(listener);

        let listeners = this.#events.get(eventPattern);
        if (!listeners) this.#events.set(eventPattern, listeners = new Map());
        listeners.set(listener, false);

        return this;
    }

    once(eventPattern, listener) {
        assert.string(eventPattern, util.eventPatternPattern);
        assert.function(listener);

        let listeners = this.#events.get(eventPattern);
        if (!listeners) this.#events.set(eventPattern, listeners = new Map());
        listeners.set(listener, true);

        return this;
    }

    off(eventPattern, listener) {
        assert.string(eventPattern, util.eventPatternPattern);
        assert.function(listener);

        let listeners = this.#events.get(eventPattern);
        if (listeners) listeners.delete(listener);
        if (listeners && listeners.size === 0) this.#events.delete(eventPattern);

        return this;
    }

    emit(eventName, ...args) {
        assert.string(eventName, util.eventNamePattern);

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
    }

    clear(clearPattern) {
        assert.string(clearPattern, util.eventPatternPattern);

        for (let [eventPattern, listeners] of this.#events.entries()) {
            if (util.eventNameMatchesPattern(eventPattern, clearPattern)) {
                for (let listener of listeners.keys()) {
                    listeners.delete(listener);
                }
                if (listeners.size === 0) this.#events.delete(eventPattern);
            }
        }

        return this;
    }

}

module.exports = EventPatternEmitter;
