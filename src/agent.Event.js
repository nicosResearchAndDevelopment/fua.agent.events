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
                   '@context':              parent_context = [],
                   '@id':                   id = undefined,
                   'prefix_event':          prefix_event = "",
                   'prefix_event_position': prefix_event_position = "",
                   'type':                  type = [],
                   //
                   'time': time,
                   'fn':   fn,
                   //
                   'owner':        owner,
                   'hasBeginning': hasBeginning,
                   'hasEnd':       hasEnd,
                   //
                   'contextHasPrefix': contextHasPrefix,
                   'idAsBlankNode':    idAsBlankNode
               }) {

    let
        event,
        tmp_node = undefined
    ;

    id = ((id) ? id : idAsBlankNode("session/"));
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
        event = new time['Instant'](hasBeginning);
    } else {
        event = new time['ProperInterval'](hasBeginning, hasEnd);
    } // if ()

    Object.defineProperties(fn, {
            [(`${prefix_event}owner`)]:          {
                value:      async () => {
                    return ((owner) ? ((typeof owner === "string") ? owner : ((typeof owner === "object") ? owner['@id'] : owner)) : null);
                },
                enumerable: true
            },
            [(`setEnd`)]:                        {
                value:        (end) => {
                    event = new time['ProperInterval'](hasBeginning, end);
                },
                enumerable: false
            },
            [(`${prefix_event}hasBeginning`)]:   {
                value:      async () => {
                    try {
                        TODO TODO TODO let has = event['$serialize']()['hasBeginning'];

                        return {
                            '@type':              "Instant",
                            'hasBeginning':       has['inXSDDateTimeStamp'],
                            'hasDuration':        has['hasDuration'],
                            'hasEnd':             has['inXSDDateTimeStamp'],
                            'inDateTime':         has['inDateTime'],
                            'inTimePosition':     has['inTimePosition'],
                            'inXSDgYear':         has['inXSDgYear'],
                            'inXSDgYearMonth':    has['inXSDgYearMonth'],
                            'inXSDDateTimeStamp': has['inXSDDateTimeStamp']
                        };
                    } catch (jex) {
                        throw jex;
                    } // try

                },
                enumerable: true
            },
            [(`${prefix_event}hasDuration`)]:    {
                value:      async () => {
                    try {

                        let
                            has    = event['$serialize'](),
                            result = has['hasDuration']
                        ;
                        return result;
                    } catch (jex) {
                        throw jex;
                    } // try
                },
                enumerable: true
            },
            [(`${prefix_event}hasXSDDuration`)]: {
                value:      async () => {
                    try {

                        let
                            has    = event['$serialize'](),
                            result = has['hasXSDDuration']
                        ;
                        return result;
                    } catch (jex) {
                        throw jex;
                    } // try
                },
                enumerable: true
            },
            [(`${prefix_event}hasEnd`)]:         {
                value:      async () => {
                    try {

                        let has = event['$serialize']()['hasEnd'];
                        return {
                            '@type':              "Instant",
                            'hasBeginning':       has['inXSDDateTimeStamp'],
                            'hasDuration':        has['hasDuration'],
                            'hasEnd':             has['inXSDDateTimeStamp'],
                            'inDateTime':         has['inDateTime'],
                            'inTimePosition':     has['inTimePosition'],
                            'inXSDgYear':         has['inXSDgYear'],
                            'inXSDgYearMonth':    has['inXSDgYearMonth'],
                            'inXSDDateTimeStamp': has['inXSDDateTimeStamp']
                        };
                    } catch (jex) {
                        throw jex;
                    } // try
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

        presentation             = (presentation || {});
        presentation['@context'] = ((presentation['@context']) ? presentation['@context'].concat(Event['@context']) : Event['@context']);

        if (!presentation['@id'])
            presentation['@id'] = node['@id'];
        if (!presentation['@type'])
            presentation['@type'] = [Event['@id']];

        presentation['owner']          = await node['owner']();
        //
        presentation['hasBeginning']   = await node['hasBeginning']();
        presentation['hasDuration']    = await node['hasDuration']();
        presentation['hasXSDDuration'] = await node['hasXSDDuration']();
        presentation['hasEnd']         = await node['hasEnd']();

        let temp_prefix = "";

        return presentation;
    } catch (jex) {
        // TODO : own error...
        throw jex;
    } // try
} // async function serialize

Object.defineProperties(Event, {
    '@context':        {
        value:          [{
            'time': "http://www.w3.org/2006/time#",
            'evem': "http://testbed.nicos-rd.com/fua/event#",
            //
            'Event': "http://testbed.nicos-rd.com/fua/event#Event",
            'event': "http://testbed.nicos-rd.com/fua/event#event",
            'owner': "http://testbed.nicos-rd.com/fua/event#owner",
            //

            'Instant':            "http://www.w3.org/2006/time#Instant",
            'ProperInterval':     "http://www.w3.org/2006/time#ProperInterval",
            'Duration':           "http://www.w3.org/2006/time#Duration",
            'hasBeginning':       "http://www.w3.org/2006/time#hasBeginning",
            'hasDuration':        "http://www.w3.org/2006/time#hasDuration",
            'hasEnd':             "http://www.w3.org/2006/time#hasEnd",
            'inDateTime':         "http://www.w3.org/2006/time#inDateTime",
            'inTimePosition':     "http://www.w3.org/2006/time#inTimePosition",
            'inXSDgYear':         "http://www.w3.org/2006/time#inXSDgYear",
            'inXSDgYearMonth':    "http://www.w3.org/2006/time#inXSDgYearMonth",
            'inXSDDateTimeStamp': "http://www.w3.org/2006/time#inXSDDateTimeStamp",
            'numericDuration':    "http://www.w3.org/2006/time#numericDuration",
            'unitType':           "http://www.w3.org/2006/time#unitType"
        }], enumerable: true
    },
    '@id':             {value: "http://www.nicos-rd.com/fua/event#Event", enumerable: true},
    'rdfs:subClassOf': ["http://www.w3.org/2006/time#ProperInterval"],
    //
    '$serialize': {value: serialize, enumerable: false}
});

exports.Event = Event;