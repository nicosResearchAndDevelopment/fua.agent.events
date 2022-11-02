const
    {describe, test, before} = require('mocha'),
    expect                   = require('expect'),
    EventAgent               = require('../src/agent.event.js'),
    SocketIO                 = require('socket.io'),
    SocketIOClient           = require('socket.io-client'),
    net                      = require('net'),
    tls                      = require('tls');

describe('agent.event', function () {

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

    test('connectIOSocket', async function () {

        const
            PORT         = 3000,
            ioServer     = new SocketIO.Server(PORT),
            serverAgent  = new EventAgent(),
            clientSocket = SocketIOClient.io('ws://localhost:' + PORT),
            clientAgent  = new EventAgent();

        clientAgent.connectIOSocket(clientSocket, 'client.to.server.*');
        ioServer.on('connection', function (serverSocket) {
            serverAgent.connectIOSocket(serverSocket, 'server.to.client.*');
        });

        try {
            await new Promise(resolve => clientSocket.on('connect', resolve));
            await new Promise(async function (resolve, reject) {
                try {
                    clientAgent
                        .on('server.to.client.hello', async function (serverEvent) {
                            try {
                                console.log(serverEvent);
                                expect(serverEvent).toMatchObject({
                                    type:   'server.to.client.hello',
                                    source: 'server'
                                });
                                await serverAgent.emit({
                                    type:   'client.to.server.hello',
                                    source: 'client'
                                }, true);
                            } catch (err) {
                                reject(err);
                            }
                        })
                        .on('server.to.client.world', async function (serverEvent) {
                            try {
                                console.log(serverEvent);
                                expect(serverEvent).toMatchObject({
                                    type:   'server.to.client.world',
                                    source: 'server'
                                });
                                await serverAgent.emit({
                                    type:   'client.to.server.world',
                                    source: 'client'
                                }, true);
                            } catch (err) {
                                reject(err);
                            }
                        });
                    await serverAgent
                        .on('client.to.server.hello', async function (clientEvent) {
                            try {
                                console.log(clientEvent);
                                expect(clientEvent).toMatchObject({
                                    type:   'client.to.server.hello',
                                    source: 'client'
                                });
                                await serverAgent.emit({
                                    type:   'server.to.client.world',
                                    source: 'server'
                                }, true);
                            } catch (err) {
                                reject(err);
                            }
                        })
                        .on('client.to.server.world', async function (clientEvent) {
                            try {
                                console.log(clientEvent);
                                expect(clientEvent).toMatchObject({
                                    type:   'client.to.server.world',
                                    source: 'client'
                                });
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        })
                        .emit({
                            type:   'server.to.client.hello',
                            source: 'server'
                        }, true);
                } catch (err) {
                    reject(err);
                }
            });
        } finally {
            clientSocket.close();
            await new Promise(resolve => ioServer.close(resolve));
        }

    }); // test('connectIOSocket')

}); // describe
