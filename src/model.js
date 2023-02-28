/**
 * @template T
 * @typedef {{
 *     id: string,
 *     specversion: string,
 *     source: string,
 *     type: string,
 *     datacontenttype?: string,
 *     dataschema?: string,
 *     subject?: string,
 *     time?: string,
 *     data?: T,
 *     data_base64?: string,
 *     [other: string]: unknown
 * }} CloudEvent
 */
exports.CloudEvent = require('cloudevents').CloudEvent;
/**
 * @typedef {{
 *     headers: {
 *         'content-type': 'application/cloudevents+json' | 'application/cloudevents+json; charset=utf-8',
 *         [other: string]: string
 *     },
 *     body: string
 * }} StructuredEncoding
 */
/**
 * @typedef {{
 *     headers: {
 *         'content-type': string,
 *         'ce-id': string,
 *         'ce-time': string,
 *         'ce-type': string,
 *         'ce-source': string,
 *         'ce-specversion': string,
 *         'ce-subject'?: string,
 *         [other: string]: string
 *     },
 *     body: string
 * }} BinaryEncoding
 */
/** @typedef {string} EventName */
/** @typedef {string} EventPattern */
/**
 * @template T
 * @typedef {{
 *     id?: string,
 *     specversion?: string,
 *     source?: string,
 *     type?: EventName,
 *     datacontenttype?: string,
 *     dataschema?: string,
 *     subject?: string,
 *     time?: string,
 *     data?: T,
 *     data_base64?: string,
 *     [other: string]: unknown
 * }} CloudEventParams
 */
exports.EmittingCloudEvent = require('./model/EmittingCloudEvent.js');
exports.EventPatternEmitter = require('./model/EventPatternEmitter.js');
exports.EmittingEventTemplate = require('./model/EmittingEventTemplate.js');
