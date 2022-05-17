const
    EventAgent = require('./agent.event.js'),
    agent      = new EventAgent();

agent.on('type.method.step', console.log);

const
    event = agent.createEvent({
        type:   'type.method.step',
        source: 'agent.event'
    });

event.emit();
// event.emit().emit();
// event.emit(true).then(val => val.emit()).catch(console.error);
