import { EventEmitter } from 'events';

type eventCallback = (...args: any[]) => void;
class EventSink {
    private eventEmitter: EventEmitter;
    /**
     *
     */
    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    public addObserver(eventName: string, callback: eventCallback): void {
        this.eventEmitter.on(eventName, callback);
    }

    public raiseEvent(eventName: string, ...args: any[]): void {
        this.eventEmitter.emit(eventName, args);
    }
}
const eventSink = new EventSink();

export { eventSink };
