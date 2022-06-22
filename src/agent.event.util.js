const
    {CloudEvent, HTTP} = require('cloudevents'),
    _util              = require('@nrd/fua.core.util'),
    util               = {
        ..._util,
        assert: _util.Assert('agent.event')
    };

util.encodeCloudEvent = function (cloudEvent, binary = false) {
    return binary ? HTTP.binary(cloudEvent) : HTTP.structured(cloudEvent);
};

util.decodeCloudEvent = function (encodedEvent) {
    return HTTP.toEvent(encodedEvent);
};

util.isEventName = util.StringValidator(/^[a-z_][a-z_\d\-+]*(?:\.[a-z_][a-z_\d\-+]*)*$/i);

util.isEventPattern = util.StringValidator(/^(?:[a-z_][a-z_\d\-+]*|\*|\*\*(?=$))(?:\.(?:[a-z_][a-z_\d\-+]*|\*|\*\*(?=$)))*$/i);

util.eventNameMatchesPattern = function (eventName, eventPattern) {
    const
        nameParts    = eventName.split('.'),
        patternParts = eventPattern.split('.');

    while (nameParts.length > 0 && patternParts.length > 0) {
        const
            namePart    = nameParts.shift(),
            patternPart = patternParts.shift();

        if (patternPart === '**') return true;
        if (patternPart === '*') continue;
        if (patternPart === namePart) continue;
        return false;
    }

    return patternParts.length === nameParts.length;
};

module.exports = util;
