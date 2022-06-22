export type CloudEvent<T> = {
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

export interface Event<T> extends CloudEvent<T> {
    emitted: boolean;
    emit(ensureDelivery?: boolean): Event<T> | Promise<Event<T>>;
    encode(binary?: boolean): StructuredEncoding | BinaryEncoding;
}

export type StructuredEncoding = {
    headers: {
        'content-type': 'application/cloudevents+json' | 'application/cloudevents+json; charset=utf-8',
        [other: string]: string
    },
    body: string
}

export type BinaryEncoding = {
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

export interface EventTemplate {
    fromEvent<T>(eventParam: CloudEvent<T>): Event<T>;
    fromData<T>(eventData: any, contentType?: string): Event<T>;
    fromJSON<T>(eventData: Object): Event<T>;
}

export interface EventEmitter {
    on(eventPattern: string, listener: Function): EventEmitter;
    once(eventPattern: string, listener: Function): EventEmitter;
    off(eventPattern: string, listener: Function): EventEmitter;
    emit(eventName: string, ...args: any): Promise<Array<any>>;
}

export interface EventAgent {
    on(eventType: string, callback: Function): EventAgent;
    once(eventType: string, callback: Function): EventAgent;
    off(eventType: string, callback: Function): EventAgent;
    addValidator(eventType: string, validator: Function): EventAgent;
    createEvent<T>(eventParam: CloudEvent<T>): Event<T>;
    createTemplate(defaultParam: CloudEvent<undefined>): EventTemplate;
    emit<T>(eventParam: CloudEvent<T>, ensureDelivery?: boolean): Event<T> | Promise<Event<T>>;
    decode<T>(encoded: string | StructuredEncoding | BinaryEncoding): Event<T>;
}
