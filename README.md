# @fua/agent.events

## Usage Analysis

- The format of the used events should be
  the [CloudEvent](https://github.com/cloudevents/sdk-javascript/blob/main/src/event/interfaces.ts) syntax.
- An event will be sent over any transport layer. The http syntax with headers and body may apply to every transport.
- If an event occurs like some threshold that has been reached, an event should be constructed at the agent and
  submitted into the application for anyone to handle.
- If the application emits a specific event that my implementation listens to, I want to use the data for my algorithm.
- If the application emits an event that is relevant for another component in the network, I want an easy serialization
  and deserialization on the other end.
- If an event is created, the specific type of the event should be used to validate its data.
- Multiple events should be selected/listened to via appropriate patterns.
