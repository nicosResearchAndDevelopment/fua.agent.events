const
    {describe, test} = require('mocha'),
    expect = require('expect'),
    util = require('../src/util.js');

describe('fua.agent.events.util', function () {

    test('eventNameMatchesPattern', async function () {

        const
            _events = new Map(),
            _on = (eventPattern = '**', listener = () => null, once = false) => {
                let listeners = _events.get(eventPattern);
                if (!listeners) _events.set(eventPattern, listeners = new Map());
                listeners.set(listener, once);
            },
            _examples = [
                'test.hello',
                'test.hello.world',
                'test.hello.world.123456789',
                '**',
                '*.hello.**',
                '*.hello.*.**',
                'test.hello.*',
                'test.*.world'
            ],
            clearPattern = '*.hello.**';

        for (let eventPattern of _examples) {
            _on(eventPattern)
        }

        for (let [eventPattern, listeners] of _events.entries()) {
            if (util.eventNameMatchesPattern(eventPattern, clearPattern)) {
                for (let listener of listeners.keys()) {
                    listeners.delete(listener);
                }
                if (listeners.size === 0) _events.delete(eventPattern);
            }
        }

        console.log('events: ' + _events.size);
        for (let [eventName, listeners] of _events.entries()) {
            console.log('- ' + eventName + ': ' + listeners.size);
        }

    });

});
