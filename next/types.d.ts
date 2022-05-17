/** @see https://github.com/cloudevents/sdk-javascript/blob/main/src/event/interfaces.ts */
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

    [key: string]: unknown;
}

export interface Event<T> extends CloudEvent<T> {
    _emitted: boolean;

    emit(ensureDelivery?: boolean): Event<T> | Promise<Event<T>>;
}
