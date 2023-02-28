const
    model = require('../model.js'),
    assert = require('@nrd/fua.core.assert');

class EmittingEventTemplate {

    #defaultParam = {};
    #emitter = null;
    #validators = null;

    /**
     * @param {CloudEventParams} defaultParam
     * @param {EventPatternEmitter} emitter
     * @param {Map<EventName, Function>} validators
     */
    constructor(defaultParam, emitter, validators) {
        assert.object(defaultParam);
        assert.instance(emitter, model.EventPatternEmitter);
        assert.instance(validators, Map);
        this.#defaultParam = defaultParam;
        this.#emitter = emitter;
        this.#validators = validators;
    }

    /**
     * @template T
     * @param {CloudEventParams<T>} eventParam
     * @returns {EmittingCloudEvent<T>}
     */
    fromEvent(eventParam) {
        assert.object(eventParam);
        const cloudEvent = new model.CloudEvent({...this.#defaultParam, ...eventParam});
        if (this.#validators.has(cloudEvent.type)) this.#validators.get(cloudEvent.type).call(null, cloudEvent);
        return new model.EmittingCloudEvent(cloudEvent, this.#emitter);
    }

    /**
     * @template T
     * @param {any} eventData
     * @param {string} [contentType]
     * @returns {EmittingCloudEvent<T>}
     */
    fromData(eventData, contentType) {
        const eventParam = contentType ? {data: eventData, datacontenttype: contentType} : {data: eventData};
        return this.fromEvent(eventParam);
    }

    /**
     * @template T
     * @param {Object} eventData
     * @returns {EmittingCloudEvent<T>}
     */
    fromJSON(eventData) {
        return this.fromData(eventData, 'application/json');
    }

}

module.exports = EmittingEventTemplate;
