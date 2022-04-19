class EventAgent {

    static '@context' = {
        '@base':  'http://testbed.nicos-rd.com/fua/event',
        '@vocab': '#',
        //
        'Event': {'@type': '@vocab'},
        'event': {'@type': '@vocab'},
        //'owner': {'@type': '@vocab'}, // REM : so it is reflected as object...
        // TODO : OR
        'owner': {'@type': '@id'}, // REM : so it is reflected in good ol' string...
        // tine
        'time':               'http://www.w3.org/2006/time#',
        'Instant':            'http://www.w3.org/2006/time#Instant',
        'ProperInterval':     'http://www.w3.org/2006/time#ProperInterval',
        'Duration':           'http://www.w3.org/2006/time#Duration',
        'hasBeginning':       'http://www.w3.org/2006/time#hasBeginning',
        'hasDuration':        'http://www.w3.org/2006/time#hasDuration',
        'hasEnd':             'http://www.w3.org/2006/time#hasEnd',
        'inDateTime':         'http://www.w3.org/2006/time#inDateTime',
        'inTimePosition':     'http://www.w3.org/2006/time#inTimePosition',
        'inXSDgYear':         'http://www.w3.org/2006/time#inXSDgYear',
        'inXSDgYearMonth':    'http://www.w3.org/2006/time#inXSDgYearMonth',
        'inXSDDateTimeStamp': 'http://www.w3.org/2006/time#inXSDDateTimeStamp',
        'numericDuration':    'http://www.w3.org/2006/time#numericDuration',
        'unitType':           'http://www.w3.org/2006/time#unitType',
        'day':                'http://www.w3.org/2006/time#day',
        'hour':               'http://www.w3.org/2006/time#hour',
        'minute':             'http://www.w3.org/2006/time#minute',
        'year':               'http://www.w3.org/2006/time#year'
    }; // EventAgent.@context

    static '@id' = 'http://www.nicos-rd.com/fua/event#Event';

    static 'rdfs:subClassOf' = ['http://www.w3.org/2006/time#ProperInterval'];

    static async $serialize(presentation, node) {
        try {

            presentation             = (presentation || {});
            presentation['@context'] = ((presentation['@context']) ? presentation['@context'].concat(EventAgent['@context']) : EventAgent['@context']);

            if (!presentation['@id'])
                presentation['@id'] = node['@id'];
            if (!presentation['@type'])
                presentation['@type'] = [EventAgent['@id']];

            presentation['owner']          = await node['owner']();
            //
            presentation['hasBeginning']   = await node['hasBeginning']();
            presentation['hasDuration']    = await node['hasDuration']();
            presentation['hasXSDDuration'] = await node['hasXSDDuration']();
            presentation['hasEnd']         = await node['hasEnd']();

            //let temp_prefix = '';

            return presentation;
        } catch (jex) {
            // TODO : own error...
            throw jex;
        } // try
    } // EventAgent.$serialize

    #fn                       = async () => null;
    #event_as_temporal_entity = null;

    constructor({
                    '@context':     parent_context = [],
                    '@id':          id = undefined,
                    'prefix_event': prefix_event = '',
                    //'prefix_event_position': prefix_event_position = '',
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

        if (fn) this.#fn = fn;

        this.#event_as_temporal_entity = hasEnd
            ? new time.ProperInterval(hasBeginning, hasEnd)
            : new time.Instant(hasBeginning);

        id = ((id) ? id : idAsBlankNode('event#'));
        type.push(EventAgent);

        Object.defineProperties(this, {
            '@id':                               {value: id, enumerable: true},
            '@type':                             {value: type, enumerable: true},
            [(`${prefix_event}owner`)]:          {
                value:      async () => {
                    return {
                        '@id':   ((typeof owner === 'string') ? owner : (owner['@id'] || null)),
                        '@type': 'foaf:Agent'
                    };
                },
                enumerable: true
            },
            [(`${prefix_event}hasBeginning`)]:   {
                value:      async () => {
                    try {
                        let node = this.#event_as_temporal_entity['$serialize']()['hasBeginning'];

                        return {
                            '@context':           [EventAgent['@context']],
                            '@type':              'ProperInterval',
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
                            has = this.#event_as_temporal_entity['$serialize']()
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
                            has = this.#event_as_temporal_entity['$serialize']()
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

                        let has = this.#event_as_temporal_entity['$serialize']()['hasEnd'];
                        return {
                            '@type':              'Instant',
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
            }, // hasEnd
            [(`setEnd`)]:                        {
                value:      async (end) => {
                    try {
                        let result                     = {'success': false, 'message': ''};
                        hasEnd                         = new time['Instant'](end);
                        this.#event_as_temporal_entity = new time['ProperInterval'](hasBeginning, hasEnd);
                        result['success']              = true;
                        result['message']              = undefined;
                        return result;
                    } catch (jex) {
                        throw jex;
                    } // try
                },
                enumerable: false
            }, // setEnd
            [(`isProper`)]:                      {
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
        }); // Object.defineProperties()

    } // EventAgent#constructor

    call(thisArg, ...args) {
        return this.apply(thisArg, args);
    }

    apply(thisArg, args) {
        return this.#fn.apply(thisArg, args);
    }

} // EventAgent

exports.Event = EventAgent;
