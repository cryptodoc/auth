const elliptic = require('elliptic');
const Error3 = require('error3');

const Contract = require('./keys.js');

const ec = new elliptic.eddsa('ed25519');

class SDK {
    constructor({web3, contract = null}) {
        if (! contract) {
            this.contract = new Contract({web3});
        }
        else if (contract instanceof Contract === false) {
            throw new Error3('contract_instance');
        }
        else {
            this.contract = contract;
        }
    }

    async verify(address, _publicKey, message, signature, date) {
        let key;
        let key0x;

        if (publicKey.startsWith('0x')) {
            key = publickey.slice(2);
            key0x = publicKey;
        }
        else {
            key = publicKey;
            key0x = '0x'+ key;
        }

        if (! this.verifySignature(key, message, signature)) {
            return false;
        }

        return this.verifyKey(address, key0x, date);
    }

    verifySignature(publicKey, message, signature) {
        const key = ec.keyFromPublic(publicKey);

        return key.verify(message, signature);
    }

    verifyKey(address, _key, date) {
        let key;
        if (_key.startsWith('0x')) {
            key = _key;
        }
        else {
            key = '0x' + _key;
        }

        return this.contract.isActiveAt(address, key, date);
    }
}


module.exports = SDK;
SDK.Contract = Contract;
SDK.utils = require('./utils.js');
