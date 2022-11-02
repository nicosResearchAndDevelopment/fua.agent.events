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
     * @returns {void}
     * @see https://socket.io/docs/v4/server-api/#socket IO Server Socket
     * @see https://socket.io/docs/v4/client-api/#socket IO Client Socket
     */
    connectIOSocket(socket, outgoing = '**') {
        util.assert(util.isFunction(socket?.on) && util.isFunction(socket?.emit),
            'expected socket to be an IO Socket');
        util.assert(util.isEventPattern(outgoing) || util.isEventPatternArray(outgoing),
            'expected outgoing to be an event string or event string array');

        const
            transportEvent = 'fua.agent.event',
            outgoingEvents = util.toArray(outgoing),
            eventReceiver  = (eventParam) => this.emit(eventParam),
            // eventReceiver  = (eventParam, acknowledge) => this.emit(eventParam, true).then(acknowledge),
            eventSender    = (event) => socket.emit(transportEvent, event),
            // eventSender    = (event) => new Promise(resolve => socket.emit(transportEvent, event, resolve)),
            attachSender   = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender   = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        socket.on(transportEvent, eventReceiver);
        if (!socket.disconnected) attachSender();
        socket.on('connect', attachSender);
        socket.on('disconnect', detachSender);
    } // EventAgent#connectIOSocket

    /**
     * @param {import('socket.io').Server | {
     *     on(eventName: string, callback: Function): any
     * }} server
     * @param {string | Array<string>} [outgoing='**']
     * @returns {void}
     * @see https://socket.io/docs/v4/server-api/#socket IO Server Socket
     * @see https://socket.io/docs/v4/client-api/#socket IO Client Socket
     */
    connectIOServer(server, outgoing = '**') {
        util.assert(util.isFunction(server?.on),
            'expected server to be an IO Server');
        util.assert(util.isEventPattern(outgoing) || util.isEventPatternArray(outgoing),
            'expected outgoing to be an event string or event string array');

        server.on('connection', (socket) => this.connectIOSocket(socket, outgoing));
    } // EventAgent#connectIOServer

    /**
     * @param {module:net.Socket} socket
     * @param {string | Array<string>} [outgoing='**']
     * @returns {void}
     * @see https://nodejs.org/docs/latest-v16.x/api/net.html#class-netsocket
     */
    connectNetSocket(socket, outgoing = '**') {
        util.assert(util.isFunction(socket?.on) && util.isFunction(socket?.write) && !socket?.destroyed,
            'expected socket to be an active net Socket');
        util.assert(util.isEventPattern(outgoing) || util.isEventPatternArray(outgoing),
            'expected outgoing to be an event string or event string array');

        const
            outgoingEvents = util.toArray(outgoing),
            eventReceiver  = (data) => this.emit(JSON.parse(data)),
            eventSender    = (event) => socket.write(JSON.stringify(event)),
            // eventSender    = (event) => new Promise(resolve => socket.write(JSON.stringify(event), resolve)),
            attachSender   = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender   = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        socket.on('data', eventReceiver);
        // if (!socket.pending) attachSender();
        // else socket.on('connect', attachSender);
        attachSender();
        socket.on('close', detachSender);
    } // EventAgent#connectNetSocket

    /**
     * @param {module:net.Server} server
     * @param {string | Array<string>} [outgoing='**']
     * @returns {void}
     * @see https://nodejs.org/docs/latest-v16.x/api/net.html#class-netserver
     */
    connectNetServer(server, outgoing = '**') {
        util.assert(util.isFunction(server?.on),
            'expected server to be a net Server');
        util.assert(util.isEventPattern(outgoing) || util.isEventPatternArray(outgoing),
            'expected outgoing to be an event string or event string array');

        server.on('connection', (socket) => this.connectNetSocket(socket, outgoing));
    } // EventAgent#connectNetServer

    /**
     * @param {module:http.RequestOptions} requestOptions
     * @param {string | Array<string>} [outgoing='**']
     * @param {boolean} [binary=false]
     * @returns {{close: Function}}
     * @see https://nodejs.org/docs/latest-v16.x/api/http.html#httprequestoptions-callback
     */
    connectHttpTarget(requestOptions = {}, outgoing = '**', binary = false) {
        util.assert(util.isObject(requestOptions),
            'expected requestOptions to be an object');
        util.assert(util.isEventPattern(outgoing) || util.isEventPatternArray(outgoing),
            'expected outgoing to be an event string or event string array');

        const
            outgoingEvents = util.toArray(outgoing),
            protocolModule = requestOptions.protocol === 'https' ? require('https') : require('http'),
            eventSender    = (event) => new Promise((resolve, reject) => {
                const {headers, body} = event.encode(binary);
                protocolModule.request({
                    method: 'POST',
                    ...requestOptions,
                    headers: {
                        ...requestOptions.headers,
                        ...headers
                    }
                }).on('error', reject).end(body, resolve);
            }),
            attachSender   = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender   = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        attachSender();
        return {close: detachSender};
    } // EventAgent#connectHttpTarget

    /**
     * @param {module:http.IncomingMessage | { completed: true, headers: Object, body?: string | Object }} request
     * @param {module:http.ServerResponse} response
     * @returns {void}
     * @see https://nodejs.org/docs/latest-v16.x/api/http.html#class-httpincomingmessage
     */
    connectHttpRequest(request, response) {
        util.assert(util.isFunction(request?.on),
            'expected request to be an http incoming message');

        if (!request.complete) {
            const chunks = [];
            request.on('data', chunk => chunks.push(chunk));
            request.on('end', () => {
                request.body = chunks.join('');
                this.connectHttpRequest(request, response);
            });
            return;
        }

        try {
            this.decode({
                headers: request.headers,
                body:    request.body
            }).emit();
            response.writeHead(202, 'Accepted').end();
        } catch (err) {
            console.error(err);
            response.writeHead(400, 'Bad Request').end();
        }
    } // EventAgent#connectHttpRequest

    /**
     * @param {module:http.Server} server
     * @returns {void}
     * @see https://nodejs.org/docs/latest-v16.x/api/http.html#class-httpserver
     */
    connectHttpServer(server) {
        util.assert(util.isFunction(server?.on),
            'expected server to be an http Server');

        server.on('request', (request, response) => this.connectHttpRequest(request, response));
    } // EventAgent#connectHttpServer

} // EventAgent

module.exports = EventAgent;
