const http = require('http');
const Web3 = require('web3');
const Plant = require('@plant/plant');
const fs = require('fs');
const path = require('path');

const {run, forever, indent} = require('./lib/utils.js');

const originHandler = require('./lib/origin-handler.js');
const errorHandler = require('./lib/error-handler.js');
const indexPage = fs.readFileSync(
    path.join(__dirname, 'ui/index.html'), 'utf8'
);

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const {Contract} = require('./');

async function main() {
    // Initialize web3 instance with local network
    const web3 = new Web3(
        new Web3.providers.HttpProvider('http://localhost:8545')
    );

    // Get current account address
    const coinbase = await web3.eth.getCoinbase();

    // Initialize contract
    const contract = new Contract({
        // Web3 instance
        web3,
        // Set default from address
        from: coinbase,
        // Set default gas amount
        gas: 5000000,
    });

    // Create PiggyAPI Router
    const router = new Plant.Router();

    // Route to get state of balance and contract.
    // router.get('/state', async ({res}) => {
    //     const state = await getState();
    //     res.json(state);
    // });

    // Get UI page
    router.get('/', async ({res}) => {
        res.html(indexPage);
    });

    // Create server
    const plant = new Plant();
    plant.use(originHandler);
    plant.use(errorHandler);
    plant.use(router);

    const server = http.createServer(plant.handler());

    // Run server
    server.listen(PORT, HOST, () => {
        console.log(indent(`
            Server is started at port http://localhost:8080.

            GET / - Get UI
        `));
    });

    // Prevent from termination
    await forever;
}

run(main);
