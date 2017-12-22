const should = require('should');

const Web3 = require('web3');
const TestRpc = require('ethereumjs-testrpc');
const {Contract} = require('../');

const code = require('../abi.json');

describe('Sdk.Contract', function() {
    let web3;
    let keys;
    let coinbase;
    let accounts;
    let date = new Date(Date.now() - 60 * 1e3);

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

        const contract = new Contract({
            web3,
            from: coinbase,
        });

        const result = await Contract.deploy(contract);

        keys = new Contract({
            web3,
            address: result.options.address,
            from: coinbase,
        });
    });

    describe('Keychain()', function() {
        it('Should instantiate contract', async function() {
            const owner = await keys._contract.methods.owner().call();

            should(owner).be.equal(coinbase);
        });
    });

    describe('addKey()', function() {
        it('Should add key to keychain', async function() {
            const key = '0x' + Buffer.alloc(32).fill('a').toString('hex');

            await keys.addKey(key);

            const added = await keys.getKeyAddDate(coinbase, key);

            should(added).be.above(date);
            should(added).be.below(new Date());
        });

        it('Should emit error on duplicate key', async function() {
            const key = '0x' + Buffer.alloc(32).toString('hex');

            await keys.addKey(key);
            let error;

            try {
                await keys.addKey(key);
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

            await keys.addKey(key);

            const added = await keys.getKeyAddDate(coinbase, key);

            should(added).be.above(date);
        });
    });

    describe('removeKey()', function() {
        it('Should remove key to keychain', async function() {
            const key = '0x' + Buffer.alloc(32).fill('a').toString('hex');

            await keys.removeKey(key);

            const removed = await keys.getKeyRemoveDate(coinbase, key);

            should(removed).be.above(0);
        });

        it('Should emit error on duplicate key', async function() {
            const key = '0x' + Buffer.alloc(32).fill('b').toString('hex');

            await keys.removeKey(key);
            let error;

            try {
                await keys.removeKey(key);
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

            await keys.addKey(key);

            const isActive = await keys.isActiveNow(coinbase, key);

            should(isActive).be.equal(true);
        });

        it('Should return true for active key', async function() {
            const key = '0x' + Buffer.alloc(32).fill('c').toString('hex');

            await keys.removeKey(key);

            const isActive = await keys.isActiveNow(coinbase, key);

            should(isActive).be.equal(false);
        });
    });

    describe('isActiveAt()', function() {
        it('Should return true for active key', async function() {
            // Extend timeout
            this.timeout(5000);

            const key = '0x' + Buffer.alloc(32).fill('d').toString('hex');
            await keys.addKey(key);

            const isActiveAt = await keys.isActiveAt(
                coinbase, key, Date.now() + 1000
            );

            should(isActiveAt).be.equal(true);
        });

        it('Should return true for removed key when it was active', async function() {
            // Extend timeout
            this.timeout(5000);

            const key = '0x' + Buffer.alloc(32).fill('e').toString('hex');
            await keys.addKey(key);

            // Make key live 3 seconds.
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await keys.removeKey(key);

            const isActiveAt = await keys.isActiveAt(
                coinbase, key, Date.now() - 2000
            );

            should(isActiveAt).be.equal(true);

            const isActiveNow = await keys.isActiveNow(
                coinbase, key
            );

            should(isActiveNow).be.equal(false);
        });
    });
});
