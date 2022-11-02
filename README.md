# fua.agent.Event

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

## [Interface](./src/types.d.ts)

```ts
type CloudEvent<T> = {
    id: string;
    specversion: string;

    source: string;
    type: string;

    datacontenttype?: string;
    dataschema?: string;
    subject?: string;
    time?: string;
    data?: T;
    data_base64?: string;

    [other: string]: unknown;
}

interface Event<T> extends CloudEvent<T> {
    emitted: boolean;
    emit(ensureDelivery?: boolean): Event<T> | Promise<Event<T>>;
    encode(binary?: boolean): StructuredEncoding | BinaryEncoding;
}

type StructuredEncoding = {
    headers: {
        'content-type': 'application/cloudevents+json' | 'application/cloudevents+json; charset=utf-8',
        [other: string]: string
    },
    body: string
}

type BinaryEncoding = {
    headers: {
        'content-type': string,
        'ce-id': string,
        'ce-time': string,
        'ce-type': string,
        'ce-source': string,
        'ce-specversion': string,
        'ce-subject'?: string,
        [other: string]: string
    },
    body: string
}

interface EventTemplate {
    fromEvent<T>(eventParam: CloudEvent<T>): Event<T>;
    fromData<T>(eventData: any, contentType?: string): Event<T>;
    fromJSON<T>(eventData: Object): Event<T>;
}

interface EventEmitter {
    on(eventPattern: string, listener: Function): EventEmitter;
    once(eventPattern: string, listener: Function): EventEmitter;
    off(eventPattern: string, listener: Function): EventEmitter;
    emit(eventName: string, ...args: any): Promise<Array<any>>;
}

interface EventAgent {
    on(eventType: string, callback: Function): EventAgent;
    once(eventType: string, callback: Function): EventAgent;
    off(eventType: string, callback?: Function): EventAgent;
    addValidator(eventType: string, validator: Function): EventAgent;
    createEvent<T>(eventParam: CloudEvent<T>): Event<T>;
    createTemplate(defaultParam: CloudEvent<undefined>): EventTemplate;
    emit<T>(eventParam: CloudEvent<T>, ensureDelivery?: boolean): Event<T> | Promise<Event<T>>;
    decode<T>(encoded: string | StructuredEncoding | BinaryEncoding): Event<T>;

    connectIOSocket(socket: import('socket.io').Socket | import('socket.io-client'), outgoing?: string | Array<string>): void;
    connectIOServer(socket: import('socket.io').Server, outgoing?: string | Array<string>): void;
    connectNetSocket(socket: import('net').Socket, outgoing?: string | Array<string>): void;
    connectNetServer(socket: import('net').Server, outgoing?: string | Array<string>): void;
    connectHttpTarget(requestOptions: import('http').RequestOptions, outgoing?: string | Array<string>, binary?: boolean): { close: Function };
    connectHttpRequest(request: import('http').IncomingMessage, response: import('http').ServerResponse): void;
    connectHttpServer(server: import('http').Server): void;
}
```

---
