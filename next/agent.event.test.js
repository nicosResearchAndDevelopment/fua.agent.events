const
    EventAgent = require('./agent.event.js'),
    agent      = new EventAgent();

agent.on('type.method.step', console.log);

const
    event = agent.createEvent({
        type:   'type.method.step',
        // type:   'fua.module.weather.temperature.modified',
        source: 'http://...',
        datacontenttype: 'application/json',
        // datacontenttype: 'text/turtle',
        data: {
            prov: 'agent.event',
            value: '...',
            tss: 0,
            tsv: 0
        }
    });

// console.log(event);
event.emit();
// event.emit().emit();
// event.emit(true).then(val => val.emit()).catch(console.error);
