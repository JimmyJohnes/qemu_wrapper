export class ISOImage{
    private __name: string;
    private __location: string;
    constructor(name: string, location: string) {
        this.__name = name;
        this.__location = location;
    }
    get name(): string {
        return this.__name;
    }
    set name(name: string) {
        this.__name = name;
    }
    get location(): string {
        return this.__location;
    }
    set location(location: string) {
        this.__location = location;
    }
    get properties(){
        return {
            name: this.__name,
            loaction: this.__location
        }
    }
}