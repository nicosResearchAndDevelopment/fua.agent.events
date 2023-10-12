const
    util   = exports,
    {HTTP} = require('cloudevents');

util.encodeCloudEvent = function (cloudEvent, binary = false) {
    return binary ? HTTP.binary(cloudEvent) : HTTP.structured(cloudEvent);
};

util.decodeCloudEvent = function (encodedEvent) {
    return HTTP.toEvent(encodedEvent);
};

util.eventNamePattern    = /^[\w_\-+]+(?:\.[\w_\-+]+)*$/;
util.eventPatternPattern = /^(?:[\w_\-+]+|\*|\*\*(?=$))(?:\.(?:[\w_\-+]+|\*|\*\*(?=$)))*$/;

util.eventNameMatchesPattern = function (eventName, eventPattern) {
    const
        nameParts    = eventName.split('.'),
        patternParts = eventPattern.split('.');

    let namePart, patternPart;
    while (nameParts.length > 0 && patternParts.length > 0) {
        namePart    = nameParts.shift();
        patternPart = patternParts.shift();
        if (patternPart === '**') return true;
        if (patternPart === '*') continue;
        if (patternPart === namePart) continue;
        return false;
    }

    return patternParts.length === nameParts.length && (namePart !== '**' || patternPart === '**');
};
