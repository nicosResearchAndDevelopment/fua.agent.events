const
    Events             = exports,
    {name: identifier} = require('../package.json'),
    assert             = require('@fua/core.assert');

assert(!global[identifier], 'unable to load a second uncached version of the singleton ' + identifier);
Object.defineProperty(global, identifier, {value: Events, configurable: false, writable: false, enumerable: false});

const
    _Events = Object.create(null),
    is      = require('@fua/core.is'),
    util    = require('./util.js'),
    model   = require('./model.js');

// TODO improve event validators and usage with templates

_Events.patternEmitter  = new model.EventPatternEmitter();
_Events.eventValidators = new Map();

/**
 * @param {model.EventPattern} eventPattern
 * @param {Function} callback
 */
Events.on = function (eventPattern, callback) {
    _Events.patternEmitter.on(eventPattern, callback);
    return Events;
};

/**
 * @param {model.EventPattern} eventPattern
 * @param {Function} callback
 */
Events.once = function (eventPattern, callback) {
    _Events.patternEmitter.once(eventPattern, callback);
    return Events;
};

/**
 * @param {model.EventPattern} eventPattern
 * @param {Function} [callback]
 */
Events.off = function (eventPattern, callback) {
    _Events.patternEmitter.off(eventPattern, callback);
    return Events;
};

/**
 * @param {model.EventName} eventName
 * @param {Function} validator
 */
Events.addValidator = function (eventName, validator) {
    assert.string(eventName, util.eventNamePattern);
    assert.function(validator);
    assert(!_Events.eventValidators.has(eventName), 'eventName="' + eventName + '" has already been added');
    _Events.eventValidators.set(eventName, validator);
    return Events;
};

/**
 * @template T
 * @param {model.CloudEvent<T>} eventParam
 * @returns {model.EmittingCloudEvent<T>}
 */
Events.createEvent = function (eventParam) {
    const cloudEvent = (eventParam instanceof model.CloudEvent) ? eventParam : new model.CloudEvent(eventParam);
    assert.string(cloudEvent.type, util.eventNamePattern);
    if (_Events.eventValidators.has(cloudEvent.type)) _Events.eventValidators.get(cloudEvent.type).call(null, cloudEvent);
    return new model.EmittingCloudEvent(cloudEvent, _Events.patternEmitter);
};

/**
 * @template T
 * @param {model.CloudEvent<T>} eventParam
 * @param {boolean} [ensureDelivery=false]
 * @returns {model.EmittingCloudEvent<T> | Promise<model.EmittingCloudEvent<T>>}
 */
Events.emit = function (eventParam, ensureDelivery = false) {
    return Events.createEvent(eventParam).emit(ensureDelivery);
};

/**
 * @template T
 * @param {string | model.StructuredEncoding | model.BinaryEncoding} encoded
 * @returns {model.EmittingCloudEvent<T>}
 */
Events.decode = function (encoded) {
    const eventParam = (typeof encoded === 'string') ? JSON.parse(encoded) : util.decodeCloudEvent(encoded);
    return Events.createEvent(eventParam);
};

/**
 * @param {model.CloudEventParams} defaultParam
 * @returns {model.EmittingEventTemplate}
 */
Events.createTemplate = function (defaultParam) {
    return new model.EmittingEventTemplate(defaultParam, _Events.patternEmitter, _Events.eventValidators);
};

Object.freeze(Events);
module.exports = Events;
