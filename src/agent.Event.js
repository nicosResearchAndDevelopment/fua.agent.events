const
    path                  = require('path'),
    //
    util                  = require('@nrd/fua.core.util'),
    //
    module_time           = require('@nrd/fua.module.time'),
    //
    event_preferredPrefix = "event:"
;

//region error

class ErrorEventIdIsMissing extends Error {
    constructor(message) {
        super(`[${timestamp()}] : fua.agent.Event : Event :: ${message}`);
    }
}

//endregion error

//region fn

function timestamp() {
    return (new Date).toISOString();
}

//endregion fn

function Event({
                   '@id':                   id = `_:${(new Date).valueOf()}_${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
                   'prefix_event':          prefix_event = "",
                   'prefix_event_position': prefix_event_position = "",
                   'type':                  type = [],
                   //
                   'time': time,
                   'fn':   fn,
                   //
                   'hasBeginning': hasBeginning,
                   'hasEnd':       hasEnd
               }) {

    let
        event,
        tmp_node = undefined
    ;

    type.push(Event);

    fn = (fn || async function () {
        return null;
    });

    if (new.target) {
        //if (!node['@id'])
        //    throw new ErrorEventIdIsMissing("id is missing");
        Object.defineProperties(fn, {
            '@id':   {value: id, enumerable: true},
            '@type': {value: type, enumerable: true}
        });
    } // if ()

    if (!hasEnd) {
        event = new time['time:Instant'](hasBeginning);
    } else {
        event = new time['time:ProperInterval'](hasBeginning, hasEnd);
    } // if ()

    Object.defineProperties(fn, {
            [(`${prefix_event}hasBeginning`)]: {
                value:      async () => {
                    return await event['$serialize']();
                },
                enumerable: true
            },
            [(`${prefix_event}hasEnd`)]:       {
                value:      async () => {
                    return "TODO";
                },
                enumerable: true
            }
        }
    );

    type.push(Event);

    return fn;

} // Event

async function serialize(presentation, node) {
    try {
        presentation = (presentation || {});
        if (!presentation['@id'])
            presentation['@id'] = node['@id'];
        if (!presentation['@type'])
            presentation['@type'] = [System['@id']];

        let temp_prefix = "";

        //temp_prefix = `${system_preferredPrefix}startedAt`;
        //if (node[temp_prefix] && !presentation[temp_prefix])
        //    presentation[temp_prefix] = await node[temp_prefix]();
        //
        //temp_prefix = `${system_preferredPrefix}uptime`;
        //if (node[temp_prefix] && !presentation[temp_prefix])
        //    presentation[temp_prefix] = await node[temp_prefix]();

        return presentation;
    } catch (jex) {
        // TODO : own error...
        throw jex;
    } // try
} // async function serialize

Object.defineProperties(Event, {
    '@id':        {value: "fua.agent.Event", enumerable: true},
    '$serialize': {value: serialize, enumerable: false}
});

exports.Event = Event;