const should = require('should');

const Web3 = require('web3');
const TestRpc = require('ethereumjs-testrpc');

const code = require('../abi.json');

describe('Keychain Contract', function() {
    let web3;
    let Keychain;
    let keychain;
    let coinbase;
    let accounts;

    before(async function() {
        web3 = new Web3(
            TestRpc.provider({
                accounts: [{
                    secretKey: Web3.utils.soliditySha3('x1'),
                    balance: Web3.utils.toWei(String(10), 'ether'),
                },{
                    secretKey: Web3.utils.soliditySha3('x2'),
                    balance: Web3.utils.toWei(String(10), 'ether'),
                }],
            }),
        );

        accounts = await web3.eth.getAccounts();
        coinbase = accounts[0];

        Keychain = new web3.eth.Contract(code.interface, {
            from: coinbase,
            gas: 5000000,
        });
    });

    describe('Keychain()', function() {
        it('Should instantiate contract', async function() {
            keychain = await Keychain.deploy({
                data: code.bytecode,
                arguments: [],
            })
            .send();

            const owner = await keychain.methods.owner().call();

            should(owner).be.equal(coinbase);
        });
    });

    describe('addKey()', function() {
        it('Should add key to keychain', async function() {
            const key = '0x' + Buffer.alloc(32).fill('a').toString('hex');

            await keychain.methods.addKey(key).send();

            const added = await keychain.methods.getKeyAddDate(coinbase, key).call();

            should(added).be.above(0);
        });

        it('Should emit error on duplicate key', async function() {
            const key = '0x' + Buffer.alloc(32).toString('hex');

            await keychain.methods.addKey(key).send();
            let error;

            try {
                await keychain.methods.addKey(key).send();
            }
            catch (_error) {
                error = _error;
            }

            should(error).be.match({
                message: /revert/,
            });
        });

        it('Should add another key to keychain', async function() {
            const key = '0x' + Buffer.alloc(32).fill('b').toString('hex');

            await keychain.methods.addKey(key).send();

            const added = await keychain.methods.getKeyAddDate(coinbase, key).call();

            should(added).be.above(0);
        });
    });

    describe('removeKey()', function() {
        it('Should add key to keychain', async function() {
            const key = '0x' + Buffer.alloc(32).fill('a').toString('hex');

            await keychain.methods.removeKey(key).send();

            const removed = await keychain.methods.getKeyRemoveDate(coinbase, key).call();

            should(removed).be.above(0);
        });

        it('Should emit error on duplicate key', async function() {
            const key = '0x' + Buffer.alloc(32).fill('b').toString('hex');

            await keychain.methods.removeKey(key).send();
            let error;

            try {
                await keychain.methods.removeKey(key).send();
            }
            catch (_error) {
                error = _error;
            }

            should(error).be.match({
                message: /revert/,
            });
        });
    });

    describe('isActiveNow()', function() {
        it('Should return true for active key', async function() {
            const key = '0x' + Buffer.alloc(32).fill('c').toString('hex');

            await keychain.methods.addKey(key).send();

            const isActive = await keychain.methods.isActiveNow(coinbase, key).call();

            should(isActive).be.equal(true);
        });

        it('Should return true for active key', async function() {
            const key = '0x' + Buffer.alloc(32).fill('c').toString('hex');

            await keychain.methods.removeKey(key).send();

            const isActive = await keychain.methods.isActiveNow(coinbase, key).call();

            should(isActive).be.equal(false);
        });
    });

    describe('isActiveAt()', function() {
        it('Should return true for active key', async function() {
            // Extend timeout
            this.timeout(5000);

            const key = '0x' + Buffer.alloc(32).fill('d').toString('hex');
            await keychain.methods.addKey(key).send();

            const isActiveAt = await keychain.methods.isActiveAt(
                coinbase, key, Math.round((Date.now() + 1000) / 1000)
            )
            .call();

            should(isActiveAt).be.equal(true);
        });

        it('Should return true for removed key when it was active', async function() {
            // Extend timeout
            this.timeout(5000);

            const key = '0x' + Buffer.alloc(32).fill('e').toString('hex');
            await keychain.methods.addKey(key).send();

            // Make key live 3 seconds.
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await keychain.methods.removeKey(key).send();

            const isActiveAt = await keychain.methods.isActiveAt(
                coinbase, key, Math.round((Date.now() - 2000) / 1000)
            )
            .call();

            should(isActiveAt).be.equal(true);

            const isActiveNow = await keychain.methods.isActiveNow(
                coinbase, key
            )
            .call();

            should(isActiveNow).be.equal(false);
        });
    });
});
