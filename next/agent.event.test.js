const
    EventAgent = require('./agent.event.js'),
    agent      = new EventAgent();

agent.on('type.method.step', console.log);

const
    event = agent.createEvent({
        type: 'type.method.step',
        // id:     '',
        source: 'agent.event'
        // time:   0
    });

event.emit();

// console.log();
