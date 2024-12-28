class Connector
{
    #baseUrl = '';
    #routes = {
        'clientAuth' : 'client-connect',
        'memberSignIn': 'member-sign-in',
    };
    #store = {};

    constructor(store) {
        this.#store = store;
    }

    getDefaultHeaders () {
        return {
            'Accept': 'application/json',
            ... this.#store.get('client-code-md5') ? {
                'x-client-signature' : this.#store.get('client-code-md5')
            } : {}
        }
    }

    getReq(route,  headers = {}) {
        return fetch(this.#baseUrl + route, {
                headers: { ...this.getDefaultHeaders(), ...headers }
            })
            .then(r => {
                console.log(r.body);
                if(! (Math.trunc(r.status / 100) === 2)) throw new Error(r.statusText);
                return r.json();
            });
    }

    postReq(route, payload) {
        return fetch(this.#baseUrl + route, {
                method: 'POST',
                headers: {...this.getDefaultHeaders(), 'Content-Type' : 'application/json'},
                body: JSON.stringify(payload)
            })
            .then(r => {
                // if(! (Math.trunc(r.status / 100) === 2)) throw new Error(r.statusText);
                return r.json();
            })
            .then(objRes => {
                if(objRes.hasOwnProperty('error')) throw new Error(objRes.error);
                return objRes;
            });
    }

    clientAuthAttempt (key, successCB, failCB) {
        this.getReq(this.#routes.clientAuth, {
            'x-client-signature' : key
        }).then(successCB).catch(failCB);
    }

    signInAttempt ({uuid, signature}, successCB, failCB) {
        this.postReq(this.#routes.memberSignIn, {uuid, signature})
            .then(successCB).catch(failCB);
    }
}


export default Connector;
