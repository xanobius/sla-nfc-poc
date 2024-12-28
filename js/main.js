import Connector from "./Connector.js";
import Store from "./Store.js";
import terms from "./terms.js";

((store) => {
    const connector = new Connector(store);
    let nfcReader = null;
    let readingActive = false;

    const refs = {

        btnClientAuth : document.querySelector('#client-authorize'),
        btnBack : document.querySelector('#back'),

        txtClientCode : document.querySelector('#client-code'),
        txtStatusMsg : document.querySelector('#status-message'),
        txtMemberName : document.querySelector('#member-name'),
        txtEventCount : document.querySelector('#event-count'),

        loaderCA : document.querySelector('#client-authorize-loader')
    };

    const setStatus = (msg) => {
        refs.txtStatusMsg.innerText = msg;
    }

    const activateScreen = (screen) => {
        [...document.querySelectorAll('.screen')]
            .filter(node => node.id !== screen)
            .forEach(node => node.classList.add('hidden'));
        document.getElementById(screen).classList.remove('hidden');

        if(screen === 'scan'){
            readingActive = true;
            nfcReader.scan();
        }else{
            readingActive = false
        }
    }

    const handlers = {
        clientAuthAttempt : () => {
            refs.btnClientAuth.classList.toggle('hidden');
            refs.loaderCA.classList.toggle('hidden');
            const clientSig = md5(refs.txtClientCode.value);

            const finishUp = () => {
                refs.txtClientCode.value = '';
                refs.btnClientAuth.classList.toggle('hidden');
                refs.loaderCA.classList.toggle('hidden');
            }

            connector.clientAuthAttempt(clientSig,
                (e) => {
                    store.set('client-code-md5', clientSig)
                    setStatus(terms.clientAuthSuccess);
                    activateScreen('scan');
                    finishUp();
                },
                () => {
                    setStatus(terms.clientAuthFailed)
                    finishUp();
                })
        },
        readingError : () => setStatus(terms.err_nfc_reading_error),
        readMemberCards : ({ message} ) => {
            if(! readingActive) return;
            const memberRecord = message.records
                .filter(r => r.recordType === 'text')
                .map(r => JSON.parse((new TextDecoder()).decode(r.data)))
                .filter(obj => ['type', 'uuid', 'signature'].filter(n => obj.hasOwnProperty(n)).length === 3)
                .find(obj => obj.hasOwnProperty('type') && obj.type === 'sla-member');

            if(memberRecord === undefined) {
                setStatus(terms.err_no_member_card);
                return;
            }
            connector.signInAttempt(memberRecord,
                (obj) => {
                    setStatus(terms.success_signin);
                    refs.txtEventCount.innerText = obj.events;
                    refs.txtMemberName.innerText = obj.name;
                    activateScreen('signed');
                    console.log(obj)
                },
                (msg) => setStatus(msg))

            console.log('Checking card and try to sign in!')
        }
    }

    refs.btnClientAuth.addEventListener('click', handlers.clientAuthAttempt);
    refs.btnBack.addEventListener('click', () => activateScreen('scan'));

    (() => {
        if(! ("NDEFReader" in window)){
            setStatus(terms.invalidDevice);
            activateScreen('invalid');
            return;
        }

        nfcReader = new NDEFReader();
        nfcReader.addEventListener('reading', handlers.readMemberCards);
        nfcReader.addEventListener('readingerror', handlers.readingError );

        const startScreen = () => {
            setStatus(terms.clientAuthRequest);
            activateScreen('client-login');
        }
        if(!store.get('client-code-md5')) {
            startScreen();
            return;
        }
        connector.clientAuthAttempt(store.get('client-code-md5'),
            (response) => {
                setStatus(terms.clientAuthSuccess);
                activateScreen('scan');
            },
            () => {
                store.remove('client-code-md5')
                startScreen()
            })
    })();

})(new Store())
