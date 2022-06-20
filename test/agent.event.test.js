const
    {describe, test, before} = require('mocha'),
    expect                   = require('expect'),
    EventAgent               = require('../src/agent.event.js');

describe('agent.domain', function () {

    test('basic usage', async function () {

        const agent = new EventAgent();
        let sum     = 0;

        agent.on('type.method.add', event => sum += event.data.value);

        const event = agent.createEvent({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 2}
        });

        expect(typeof event.emit).toBe('function');
        await event.emit(true);
        expect(() => event.emit()).toThrow();

        expect(sum).toBe(2);

        await agent.createEvent({
            type:            'type.method.add',
            source:          'http://...',
            datacontenttype: 'application/json',
            data:            {value: 3}
        }).emit(true);

        expect(sum).toBe(5);

    }); // test

}); // describe
