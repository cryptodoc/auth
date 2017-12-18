const should = require('should');

const elliptic = require('elliptic');
const Web3 = require('web3');
const TestRpc = require('ethereumjs-testrpc');

const ec = new elliptic.eddsa('ed25519');

const SDK = require('../');


const code = require('../abi.json');

describe('SDK', function() {
    let web3;
    let sdk;
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

        const contract = new web3.eth.Contract(code.interface, {
            from: coinbase,
            gas: 5000000,
        });

        const result = await contract.deploy({
            data: code.bytecode,
            arguments: [],
        }).send();

        sdk = new SDK({
            contract: new SDK.Contract({
                web3,
                address: result.options.address,
                from: coinbase,
            }),
        });
    });

    describe('verify()', function() {
        it('Should verify signature', async function() {
            const secret = Buffer.alloc(32).fill('a');
            const msg = Buffer.alloc(32).fill('b').toString('hex');

            const key = ec.keyFromSecret(secret.toString('hex'), 'hex');
            const publicKey = key.getPublic('hex');

            await sdk.contract.addKey(
                SDK.utils.keyFromBuffer(publicKey)
            );

            const signature = key.sign(msg).toHex();

            const isValidSign = await sdk.verifySignature(
                publicKey, msg, signature
            );
            should(isValidSign).be.equal(true);

            const isValidKey = await sdk.verifyKey(
                coinbase, publicKey, Date.now() + 10 * 1e3,
            );
            should(isValidKey).be.equal(true);
        });

        it('Should not verify damaged signature', async function() {
            const secret = Buffer.alloc(32).fill('c');
            const msg = Buffer.alloc(32).fill('d').toString('hex');

            const key = ec.keyFromSecret(secret.toString('hex'), 'hex');
            const publicKey = key.getPublic('hex');

            await sdk.contract.addKey(
                SDK.utils.keyFromBuffer(publicKey)
            );

            const signature = key.sign(msg).toHex();

            const isValidSign = await sdk.verifySignature(
                publicKey, msg, signature.replace(/[0-9]/g, 'F')
            );
            should(isValidSign).be.equal(false);

            const isValidKey = await sdk.verifyKey(
                coinbase, publicKey, Date.now() + 10 * 1e3,
            );
            should(isValidKey).be.equal(true);
        });
    });
});
