//const
//    //path                  = require('path'),
//    //
//    //util                  = require('@nrd/fua.core.util'),
//    //
//    //module_time           = require('@nrd/fua.module.time'),
//    //
//    //event_preferredPrefix = "event:"
//;

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
                   '@context':     parent_context = [],
                   '@id':          id = undefined,
                   'prefix_event': prefix_event = "",
                   //'prefix_event_position': prefix_event_position = "",
                   'type': type = [],
                   //
                   'time': time,
                   'fn':   fn,
                   //
                   'owner':        owner,
                   'hasBeginning': hasBeginning,
                   'hasEnd':       hasEnd,
                   //
                   //'contextHasPrefix': contextHasPrefix,
                   'idAsBlankNode': idAsBlankNode
               }) {

    let
        event_as_temporal_entity
        //tmp_node = undefined
    ;

    id = ((id) ? id : idAsBlankNode("event#"));
    type.push(Event);

    fn = (fn || async function () {
        return null;
    });

    if (new.target) {
        Object.defineProperties(fn, {
            '@id':   {value: id, enumerable: true},
            '@type': {value: type, enumerable: true}
        });
    } // if ()

    if (!hasEnd) {
        event_as_temporal_entity = new time['Instant'](hasBeginning);
    } else {
        event_as_temporal_entity = new time['ProperInterval'](hasBeginning, hasEnd);
    } // if ()

    Object.defineProperties(fn, {
        '@id':                               {value: id, enumerable: true},
        [(`${prefix_event}owner`)]:          {
            value:      async () => {
                return {
                    '@id':   ((typeof owner === "string") ? owner : (owner['@id'] || null)),
                    '@type': "foaf:Agent"
                };
            },
            enumerable: true
        },
        [(`${prefix_event}hasBeginning`)]:   {
            value:      async () => {
                try {
                    let node = event_as_temporal_entity['$serialize']()['hasBeginning'];

                    return {
                        '@context':           [Event['@context']],
                        '@type':              "ProperInterval",
                        'hasBeginning':       node['hasBeginning'],
                        'hasDuration':        node['hasDuration'],
                        'hasEnd':             node['hasEnd'],
                        'inDateTime':         node['inDateTime'],
                        'inTimePosition':     node['inTimePosition'],
                        'inXSDgYear':         node['inXSDgYear'],
                        'inXSDgYearMonth':    node['inXSDgYearMonth'],
                        'inXSDDateTimeStamp': node['inXSDDateTimeStamp']
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

                    const
                        has = event_as_temporal_entity['$serialize']()
                    ;
                    return has['hasDuration'];
                } catch (jex) {
                    throw jex;
                } // try
            },
            enumerable: true
        },
        [(`${prefix_event}hasXSDDuration`)]: {
            value:      async () => {
                try {
                    const
                        has = event_as_temporal_entity['$serialize']()
                    ;
                    return has['hasXSDDuration'];
                } catch (jex) {
                    throw jex;
                } // try
            },
            enumerable: true
        },
        [(`${prefix_event}hasEnd`)]:         {
            value:      async () => {
                try {

                    let has = event_as_temporal_entity['$serialize']()['hasEnd'];
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
        } // hasEnd
        //region fn
        ,
        [(`setEnd`)]:   {
            value:      async (end) => {
                try {
                    let result               = {'success': false, 'message': ""};
                    hasEnd                   = new time['Instant'](end);
                    event_as_temporal_entity = new time['ProperInterval'](hasBeginning, hasEnd);
                    result['success']        = true;
                    result['message']        = undefined;
                    return result;
                } catch (jex) {
                    throw jex;
                } // try
            },
            enumerable: false
        }, // setEnd
        [(`isProper`)]: {
            value:      async () => {
                try {
                    //let result = {};
                    return undefined;
                } catch (jex) {
                    throw jex;
                } // try
            },
            enumerable: false
        } // setEnd
        //endregion fn
    }); // Object.defineProperties()

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

        //let temp_prefix = "";

        return presentation;
    } catch (jex) {
        // TODO : own error...
        throw jex;
    } // try
} // async function serialize

Object.defineProperties(Event, {
    '@context':        {
        value:          [{
            "@base":  "http://testbed.nicos-rd.com/fua/event",
            "@vocab": "#",
            //
            "Event": {"@type": "@vocab"},
            "event": {"@type": "@vocab"},
            //"owner": {"@type": "@vocab"}, // REM : so it is reflected as object...
            // TODO : OR
            "owner": {"@type": "@id"}, // REM : so it is reflected in good ol' string...
            // tine
            "time":               "http://www.w3.org/2006/time#",
            "Instant":            "http://www.w3.org/2006/time#Instant",
            "ProperInterval":     "http://www.w3.org/2006/time#ProperInterval",
            "Duration":           "http://www.w3.org/2006/time#Duration",
            "hasBeginning":       "http://www.w3.org/2006/time#hasBeginning",
            "hasDuration":        "http://www.w3.org/2006/time#hasDuration",
            "hasEnd":             "http://www.w3.org/2006/time#hasEnd",
            "inDateTime":         "http://www.w3.org/2006/time#inDateTime",
            "inTimePosition":     "http://www.w3.org/2006/time#inTimePosition",
            "inXSDgYear":         "http://www.w3.org/2006/time#inXSDgYear",
            "inXSDgYearMonth":    "http://www.w3.org/2006/time#inXSDgYearMonth",
            "inXSDDateTimeStamp": "http://www.w3.org/2006/time#inXSDDateTimeStamp",
            "numericDuration":    "http://www.w3.org/2006/time#numericDuration",
            "unitType":           "http://www.w3.org/2006/time#unitType",
            "day":                "http://www.w3.org/2006/time#day",
            "hour":               "http://www.w3.org/2006/time#hour",
            "minute":             "http://www.w3.org/2006/time#minute",
            "year":               "http://www.w3.org/2006/time#year"
        }], enumerable: true
    },
    '@id':             {value: "http://www.nicos-rd.com/fua/event#Event", enumerable: true},
    'rdfs:subClassOf': {value: ["http://www.w3.org/2006/time#ProperInterval"], enumerable: true},
    //
    '$serialize': {value: serialize, enumerable: false}
});

exports.Event = Event;