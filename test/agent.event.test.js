const
    {describe, test, afterEach} = require('mocha'),
    expect                      = require('expect'),
    EventAgent                  = require('../src/agent.event.js'),
    SocketIO                    = require('socket.io'),
    SocketIOClient              = require('socket.io-client'),
    net                         = require('net'),
    http                        = require('http');

describe('agent.event', function () {

    let cleanUp = null;
    afterEach(async function () {
        if (!cleanUp) return;
        await cleanUp();
        cleanUp = null;
    });

    test('basic usage', async function () {

        const agent = new EventAgent();
        let sum     = 0;

        agent.on('type.method.add', (event) => {
            const {value} = event.data;
            if (typeof value !== 'number' || isNaN(value))
                throw new Error('not a number');
            sum += value;
        });

        const event = agent.createEvent({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 2}
        });

        expect(typeof event.emit).toBe('function');
        await event.emit(true); // sum += 2

        expect(sum).toBe(2);

        await agent.createEvent({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 3}
        }).emit(true); // sum += 3

        expect(() => event.emit()).toThrow();
        await agent.createEvent(event).emit(true); // sum += 2

        expect(sum).toBe(7);

        await agent.emit({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 1}
        }, true); // sum += 1

        await agent.emit(event, true); // sum += 2

        expect(sum).toBe(10);

        await expect(agent.emit({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'text/plain',
            data:            Buffer.from('Hello World!').toString('base64')
        }, true)).rejects.toThrow();

        const
            event2            = agent.createEvent({
                type:            'type.method.add',
                source:          'http://...',
                datacontenttype: 'application/json',
                data:            {value: 5}
            }),
            event2_structured = event2.encode(),
            event2_binary     = event2.encode(true);

        agent.decode(event2_structured.body).emit(true); // sum += 5
        agent.decode(event2_binary).emit(true); // sum += 5

        expect(sum).toBe(20);

        const template = agent.createTemplate({
            type:   'type.method.add',
            source: 'http://...'
        });

        agent.addValidator('type.method.add', function (cloudEvent) {
            if (typeof cloudEvent.data !== 'object')
                throw new Error('expected data to be an object');
            if (cloudEvent.datacontenttype !== 'application/json')
                throw new Error('expected datacontenttype to be "application/json"');
            if (typeof cloudEvent.data.value !== 'number')
                throw new Error('expected data.value to be a number');
            console.log(cloudEvent);
        });

        expect(() => template.fromData(6)).toThrow('expected data to be an object');
        expect(() => template.fromEvent({data: {value: 6}})).toThrow('expected datacontenttype to be "application/json"');
        await template.fromData({value: 4}, 'application/json').emit(true); // sum += 4
        await template.fromJSON({value: 4}).emit(true); // sum += 4
        expect(() => template.fromJSON({value: '4'})).toThrow('expected data.value to be a number');

        expect(sum).toBe(28);

    }); // test

    test('socket.io connection', async function () {
        const PORT = 3000;

        const serverAgent = new EventAgent();
        const ioServer    = new SocketIO.Server(PORT);
        serverAgent.connectIOServer(ioServer, 'server.to.**');
        console.log('io server is listening');

        cleanUp = async function () {
            await new Promise(resolve => ioServer.close(resolve));
        };

        const clientAgent  = new EventAgent();
        const clientSocket = SocketIOClient.io('ws://localhost:' + PORT);
        clientAgent.connectIOSocket(clientSocket, 'client.to.**');

        await new Promise(resolve => clientSocket.on('connect', resolve));
        console.log('io socket is connected');

        cleanUp = async function () {
            clientSocket.close();
            await new Promise(resolve => ioServer.close(resolve));
        };

        await agentHelloWorldHandshake(serverAgent, clientAgent);
        console.log('handshake is finished');
    });

    test('net connection', async function () {
        const PORT = 3001;

        const serverAgent = new EventAgent();
        const netServer   = net.createServer();
        serverAgent.connectNetServer(netServer, 'server.to.**');

        await new Promise(resolve => netServer.listen(PORT, resolve));
        console.log('net server is listening');

        cleanUp = async function () {
            await new Promise(resolve => netServer.close(resolve));
        };

        const clientAgent  = new EventAgent();
        const clientSocket = net.connect(PORT);
        clientAgent.connectNetSocket(clientSocket, 'client.to.**');

        await new Promise(resolve => clientSocket.on('connect', resolve));
        console.log('net socket is connected');

        cleanUp = async function () {
            await Promise.all([
                new Promise(resolve => clientSocket.end(resolve)),
                new Promise(resolve => netServer.close(resolve))
            ]);
        };

        await agentHelloWorldHandshake(serverAgent, clientAgent);
        console.log('handshake is finished');
    });

    test('http connection', async function () {
        const PORT = 3002, BINARY = false;

        const serverAgent = new EventAgent();
        const httpServer  = http.createServer();
        serverAgent.connectHttpServer(httpServer);

        await new Promise(resolve => httpServer.listen(PORT, resolve));
        console.log('http server is listening');

        cleanUp = async function () {
            await new Promise(resolve => httpServer.close(resolve));
        };

        const clientAgent = new EventAgent();
        clientAgent.connectHttpTarget({port: PORT}, 'client.to.**', BINARY);

        await agentTestRequest(serverAgent, clientAgent);
        console.log('request is finished');
    });

}); // describe

/**
 * @param {EventAgent} serverAgent
 * @param {EventAgent} clientAgent
 * @returns {Promise<void>}
 */
async function agentTestRequest(serverAgent, clientAgent) {
    const LOG_EVENTS = false, LOG_ERROR = false;
    await new Promise(async function (resolve, reject) {
        try {
            serverAgent.once('client.to.server.test', function (clientEvent) {
                try {
                    if (LOG_EVENTS) console.log(clientEvent);
                    expect(clientEvent).toMatchObject({
                        type:   'client.to.server.test',
                        source: 'client'
                    });
                    resolve();
                } catch (err) {
                    if (LOG_ERROR) console.error(err);
                    reject(err);
                }
            });
            await clientAgent.emit({
                type:   'client.to.server.test',
                source: 'client'
            }, true);
        } catch (err) {
            if (LOG_ERROR) console.error(err);
            reject(err);
        }
    });
} // agentTestRequest

/**
 * @param {EventAgent} serverAgent
 * @param {EventAgent} clientAgent
 * @returns {Promise<void>}
 */
async function agentHelloWorldHandshake(serverAgent, clientAgent) {
    const LOG_EVENTS = false, LOG_ERROR = false;
    expect(serverAgent).toBeInstanceOf(EventAgent);
    expect(clientAgent).toBeInstanceOf(EventAgent);
    await new Promise(async function (resolve, reject) {
        try {
            clientAgent
                .on('server.to.client.hello', async function (serverEvent) {
                    try {
                        if (LOG_EVENTS) console.log(serverEvent);
                        expect(serverEvent).toMatchObject({
                            type:   'server.to.client.hello',
                            source: 'server'
                        });
                        await serverAgent.emit({
                            type:   'client.to.server.hello',
                            source: 'client'
                        }, true);
                    } catch (err) {
                        if (LOG_ERROR) console.error(err);
                        reject(err);
                    }
                })
                .on('server.to.client.world', async function (serverEvent) {
                    try {
                        if (LOG_EVENTS) console.log(serverEvent);
                        expect(serverEvent).toMatchObject({
                            type:   'server.to.client.world',
                            source: 'server'
                        });
                        await serverAgent.emit({
                            type:   'client.to.server.world',
                            source: 'client'
                        }, true);
                    } catch (err) {
                        if (LOG_ERROR) console.error(err);
                        reject(err);
                    }
                });
            await serverAgent
                .on('client.to.server.hello', async function (clientEvent) {
                    try {
                        if (LOG_EVENTS) console.log(clientEvent);
                        expect(clientEvent).toMatchObject({
                            type:   'client.to.server.hello',
                            source: 'client'
                        });
                        await serverAgent.emit({
                            type:   'server.to.client.world',
                            source: 'server'
                        }, true);
                    } catch (err) {
                        if (LOG_ERROR) console.error(err);
                        reject(err);
                    }
                })
                .on('client.to.server.world', async function (clientEvent) {
                    try {
                        if (LOG_EVENTS) console.log(clientEvent);
                        expect(clientEvent).toMatchObject({
                            type:   'client.to.server.world',
                            source: 'client'
                        });
                        resolve();
                    } catch (err) {
                        if (LOG_ERROR) console.error(err);
                        reject(err);
                    }
                })
                .emit({
                    type:   'server.to.client.hello',
                    source: 'server'
                }, true);
        } catch (err) {
            if (LOG_ERROR) console.error(err);
            reject(err);
        }
    });
} // agentHelloWorldHandshake
