
const GAS = 5000000;

function withAbi(abi) {
    return function(Class) {
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
                if (this.readOnly) {
                    throw new Error3('readonly', 'Contract is in read mode');
                }

                return this.contract.methods[item.name](...args).send();
            };
        }
        else {
            method = async function(...args) {
                return this.contract.methods[item.name](...args).call();
            };
        }

        Object.defineProperty(target, name, {
            value: method,
        });
    });
}

class Contract {
    constructor({
        web3,
        abi,
        address,
        from,
        gas,
        gasPrice,
        readOnly = false,
    }) {
        this.contract = new web3.eth.Contract(abi, address, {
            from,
            gas,
            gasPrice,
        });
        this.readOnly = readOnly || ! from;
    }
}

module.exports = Contract;
Contract.withAbi = withAbi;
