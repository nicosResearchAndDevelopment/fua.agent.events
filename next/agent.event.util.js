const
    _util = require('@nrd/fua.core.util'),
    util  = {
        ..._util,
        assert: _util.Assert('agent.event')
    };

Object.freeze(util);
module.exports = util;
