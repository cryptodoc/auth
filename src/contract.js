
const GAS = 5000000;

function withAbi(abi, bytecode) {
    return function(Class) {
        Class.bytecode = bytecode;
        Class.abi = abi;
        defineMethods(Class.prototype, abi);
        return Class;
    };
}

function defineMethods(target, abi) {
    abi.forEach((item) => {
        if (item.type !== 'function') {
            return;
        }

        let name = item.name;

        if (item.name in target) {
            name = '_' + name;
        }

        if (name in target) {
            return;
        }

        let method;
        if (item.constant === false) {
            method = async function(...args) {
                if (this._readOnly) {
                    throw new Error3('readonly', 'Contract is in read mode');
                }

                return this._contract.methods[item.name](...args).send();
            };
        }
        else {
            method = async function(...args) {
                return this._contract.methods[item.name](...args).call();
            };
        }

        Object.defineProperty(target, name, {
            value: method,
        });
    });
}

class Contract {
    static deploy(contract, ...args) {
        if (contract instanceof Contract === false) {
            throw new Error('Not a contract');
        }

        return contract._contract.deploy({
            data: contract.constructor.bytecode,
            arguments: args,
        })
        .send();
    }

    constructor({
        web3,
        abi = null,
        address,
        from,
        gas = GAS,
        gasPrice = 0,
        readOnly = false,
    }) {
        if (! abi) {
            abi = this.constructor.abi;
        }

        let cArgs = [];
        if (address) {
            cArgs = [abi, address, {from, gas, gasPrice}];
        }
        else {
            cArgs = [abi, {from, gas, gasPrice}];
        }

        this._contract = new web3.eth.Contract(...cArgs);
        this._readOnly = readOnly || ! from;
    }
}

module.exports = Contract;
Contract.withAbi = withAbi;
