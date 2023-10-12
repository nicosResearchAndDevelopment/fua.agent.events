const
    {describe, test, afterEach} = require('mocha'),
    expect                      = require('expect'),
    Events                      = require('../src/events.js');

describe('fua.agent.events', function () {

    let cleanUp = null;
    afterEach(async function () {
        if (!cleanUp) return;
        await cleanUp();
        cleanUp = null;
    });

    test('basic usage', async function () {

        let sum = 0;

        Events.on('type.method.add', (event) => {
            const {value} = event.data;
            if (typeof value !== 'number' || isNaN(value))
                throw new Error('not a number');
            sum += value;
        });

        const event = Events.createEvent({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 2}
        });

        expect(typeof event.emit).toBe('function');
        await event.emit(true); // sum += 2

        expect(sum).toBe(2);

        await Events.createEvent({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 3}
        }).emit(true); // sum += 3

        expect(() => event.emit()).toThrow();
        await Events.createEvent(event).emit(true); // sum += 2

        expect(sum).toBe(7);

        await Events.emit({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 1}
        }, true); // sum += 1

        await Events.emit(event, true); // sum += 2

        expect(sum).toBe(10);

        await expect(Events.emit({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'text/plain',
            data:            Buffer.from('Hello World!').toString('base64')
        }, true)).rejects.toThrow();

        const
            event2            = Events.createEvent({
                type:            'type.method.add',
                source:          'http://...',
                datacontenttype: 'application/json',
                data:            {value: 5}
            }),
            event2_structured = event2.encode(),
            event2_binary     = event2.encode(true);

        Events.decode(event2_structured.body).emit(true); // sum += 5
        Events.decode(event2_binary).emit(true); // sum += 5

        expect(sum).toBe(20);

        const template = Events.createTemplate({
            type:   'type.method.add',
            source: 'http://...'
        });

        Events.addValidator('type.method.add', function (cloudEvent) {
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

}); // describe
