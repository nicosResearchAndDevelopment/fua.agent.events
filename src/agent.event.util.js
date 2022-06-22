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

module.exports = util;
