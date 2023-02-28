class EventAgent {

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
            eventReceiver = (eventParam) => this.emit(eventParam),
            // eventReceiver  = (eventParam, acknowledge) => this.emit(eventParam, true).then(acknowledge),
            eventSender = (event) => socket.emit(transportEvent, event),
            // eventSender    = (event) => new Promise(resolve => socket.emit(transportEvent, event, resolve)),
            attachSender = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        socket.on(transportEvent, eventReceiver);
        if (!socket.disconnected) attachSender();
        socket.on('connect', attachSender);
        socket.on('disconnect', detachSender);
    }

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
    }

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
            eventReceiver = (data) => this.emit(JSON.parse(data)),
            eventSender = (event) => socket.write(JSON.stringify(event)),
            // eventSender    = (event) => new Promise(resolve => socket.write(JSON.stringify(event), resolve)),
            attachSender = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        socket.on('data', eventReceiver);
        // if (!socket.pending) attachSender();
        // else socket.on('connect', attachSender);
        attachSender();
        socket.on('close', detachSender);
    }

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
    }

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
            eventSender = (event) => new Promise((resolve, reject) => {
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
            attachSender = () => outgoingEvents.every(eventPattern => this.on(eventPattern, eventSender)),
            detachSender = () => outgoingEvents.every(eventPattern => this.off(eventPattern, eventSender));

        attachSender();
        return {close: detachSender};
    }

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
                body: request.body
            }).emit();
            response.writeHead(202, 'Accepted').end();
        } catch (err) {
            console.error(err);
            response.writeHead(400, 'Bad Request').end();
        }
    }

    /**
     * @param {module:http.Server} server
     * @returns {void}
     * @see https://nodejs.org/docs/latest-v16.x/api/http.html#class-httpserver
     */
    connectHttpServer(server) {
        util.assert(util.isFunction(server?.on),
            'expected server to be an http Server');

        server.on('request', (request, response) => this.connectHttpRequest(request, response));
    }

}

module.exports = EventAgent;
