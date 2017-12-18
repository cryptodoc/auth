const Error3 = require('error3');
const defaults = require('../contract.json');
const Contract = require('./contract.js');

const {withAbi} = Contract;

class Keys extends Contract {
    constructor(options) {
        super({
            ...options,
            abi: defaults.interface,
        });
    }

    addKey(key) {
        if (this.readonly) {
            throw new Error3('readonly');
        }

        if (! key.startsWith('0x')) {
            throw new Error('Invalid key content');
        }

        return this.contract.methods
        .addKey(key)
        .send();
    }

    removeKey(key) {
        if (this.readonly) {
            throw new Error3('readonly');
        }

        if (! key.startsWith('0x')) {
            throw new Error('Invalid key content');
        }

        return this.contract.methods
        .removeKey(key)
        .send();
    }

    isActiveNow(address, key) {
        return this.contract.methods
        .isActiveNow(address, key)
        .call();
    }

    isActiveAt(address, key, _date) {
        let date;
        const dateType = typeof _date;

        if (dateType === 'number' || dateType === 'string') {
            date = new Date(_date);
        }
        else if (_date instanceof Date) {
            date = _date;
        }
        else {
            throw new Error(`Invalid date value ${_date}`);
        }

        return this.contract.methods
        .isActiveAt(address, key, Math.floor(date.getTime() / 1000))
        .call();
    }

    getKeyAddDate(address, key) {
        return this.contract.methods
        .getKeyAddDate(address, key)
        .call()
        .then((result) => {
            if (result) {
                return new Date(parseInt(result, 10) * 1000);
            }
            else {
                return null;
            }
        });
    }

    getKeyRemoveDate(address, key) {
        return this.contract.methods
        .getKeyRemoveDate(address, key)
        .call()
        .then((result) => {
            if (result) {
                return new Date(parseInt(result, 10) * 1000);
            }
            else {
                return null;
            }
        });
    }
}

module.exports = withAbi(defaults.interface)(Keys);
