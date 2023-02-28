const
    events = exports,
    util = require('./util.js'),
    model = require('./model.js'),
    assert = require('@nrd/fua.core.assert'),
    patternEmitter = new model.EventPatternEmitter(),
    eventValidators = new Map();

// TODO improve event validators and usage with templates

/**
 * @param {EventPattern} eventPattern
 * @param {Function} callback
 */
events.on = function (eventPattern, callback) {
    patternEmitter.on(eventPattern, callback);
    return events;
};

/**
 * @param {EventPattern} eventPattern
 * @param {Function} callback
 */
events.once = function (eventPattern, callback) {
    patternEmitter.once(eventPattern, callback);
    return events;
};

/**
 * @param {EventPattern} eventPattern
 * @param {Function} [callback]
 */
events.off = function (eventPattern, callback) {
    patternEmitter.off(eventPattern, callback);
    return events;
};

/**
 * @param {EventName} eventName
 * @param {Function} validator
 */
events.addValidator = function (eventName, validator) {
    assert.string(eventName, util.eventNamePattern);
    assert.function(validator);
    assert(!eventValidators.has(eventName), 'eventName="' + eventName + '" has already been added');
    eventValidators.set(eventName, validator);
    return events;
};

/**
 * @template T
 * @param {CloudEvent<T>} eventParam
 * @returns {EmittingCloudEvent<T>}
 */
events.createEvent = function (eventParam) {
    const cloudEvent = (eventParam instanceof model.CloudEvent) ? eventParam : new model.CloudEvent(eventParam);
    assert.string(cloudEvent.type, util.eventNamePattern);
    if (eventValidators.has(cloudEvent.type)) eventValidators.get(cloudEvent.type).call(null, cloudEvent);
    return new model.EmittingCloudEvent(cloudEvent, patternEmitter);
};

/**
 * @template T
 * @param {CloudEvent<T>} eventParam
 * @param {boolean} [ensureDelivery=false]
 * @returns {EmittingCloudEvent<T> | Promise<EmittingCloudEvent<T>>}
 */
events.emit = function (eventParam, ensureDelivery = false) {
    return this.createEvent(eventParam).emit(ensureDelivery);
};

/**
 * @template T
 * @param {string | StructuredEncoding | BinaryEncoding} encoded
 * @returns {EmittingCloudEvent<T>}
 */
events.decode = function (encoded) {
    const eventParam = (typeof encoded === 'string') ? JSON.parse(encoded) : util.decodeCloudEvent(encoded);
    return events.createEvent(eventParam);
};

/**
 * @param {CloudEvent} defaultParam
 * @returns {EmittingEventTemplate}
 */
events.createTemplate = function (defaultParam) {
    return new model.EmittingEventTemplate(defaultParam, patternEmitter, eventValidators);
};

util.sealModule(events);
