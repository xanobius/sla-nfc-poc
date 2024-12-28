
class Store {
    items =  {};

    constructor() {
        this.populate();
    }

    populate () {
        Object.keys(window.sessionStorage)
            .forEach(key => this.set(key, window.sessionStorage.getItem(key)));
    };

    set (key, value) {
        this.items[key] = value;
        window.sessionStorage.setItem(key, value);
    }

    get (key) {
        if(this.items.hasOwnProperty(key))return this.items[key];
        return false;
    }

    remove (key) {
        window.sessionStorage.removeItem(key);
        delete this.items[key];
    }
}

export default Store;