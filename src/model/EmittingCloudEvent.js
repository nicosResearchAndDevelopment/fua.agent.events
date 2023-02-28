const
    util = require('../util.js'),
    model = require('../model.js'),
    assert = require('@nrd/fua.core.assert'),
    is = require('@nrd/fua.core.is'),
    tty = require('@nrd/fua.core.tty');

/**
 * @template T
 * @property {string} id
 * @property {string} specversion
 * @property {string} source
 * @property {EventName} type
 * @property {string} [datacontenttype]
 * @property {string} [dataschema]
 * @property {string} [subject]
 * @property {string} [time]
 * @property {T} [data]
 * @property {string} [data_base64]
 * @see https://github.com/cloudevents/sdk-javascript/blob/main/src/event/interfaces.ts JavaScript SDK for CloudEvents
 */
class EmittingCloudEvent {

    #emitter = null;
    #emitted = false;

    /**
     * @param {CloudEvent<T>} cloudEvent
     * @param {EventPatternEmitter} emitter
     */
    constructor(cloudEvent, emitter) {
        assert.instance(cloudEvent, model.CloudEvent);
        assert.instance(emitter, model.EventPatternEmitter);
        this.#emitter = emitter;
        for (let [key, value] of Object.entries(cloudEvent.toJSON())) {
            if (is.null(value)) continue;
            Object.defineProperty(this, key, {value, enumerable: true});
        }
        assert.string(this.type, util.eventNamePattern);
    }

    /**
     * @returns {boolean}
     */
    get emitted() {
        return this.#emitted;
    }

    /**
     * @param {boolean} [ensureDelivery=false]
     * @returns {this | Promise<this>}
     */
    emit(ensureDelivery = false) {
        assert(!this.#emitted, 'Event<' + this.id + '> was already emitted');
        this.#emitted = true;
        if (ensureDelivery) {
            return this.#emitter.emit(this.type, this).then(() => this);
        } else {
            this.#emitter.emit(this.type, this).catch(tty.error);
            return this;
        }
    }

    /**
     * @param {boolean} [binary=false]
     * @returns {StructuredEncoding | BinaryEncoding}
     */
    encode(binary = false) {
        const cloudEvent = new model.CloudEvent(this);
        return util.encodeCloudEvent(cloudEvent, binary);
    }

}

module.exports = EmittingCloudEvent;
