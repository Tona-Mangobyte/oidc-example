//const express = require('express')
import express from 'express';
import { Provider } from 'oidc-provider';
// const helmet = require('helmet')
// const path = require('path')
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import * as url from 'node:url';

/*const Account = require('./support/account.js')
const configuration = require('./support/configuration.js')
const routes = require('./routes/express.js')
const adapter = require('./adapters/memory.js')*/

import Account from './support/account.js';
import configuration from './support/configuration.js';
import routes from './routes/express.js';
import adapter from './adapters/memory.js';

const app = express()
const port = 3000


const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives['form-action'];
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives,
    },
}));

// Convert URL to path for __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
app.set('view engine', 'ejs');

// Home route
app.get('/', (req, res) => {
    res.render('hello', { name: 'Tona' })
})

// OIDC Provider setup
const prod = process.env.NODE_ENV === 'production';
const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;
configuration.findAccount = Account.findAccount;
const provider = new Provider(ISSUER, { adapter, ...configuration });

// Trust proxy in production for secure cookies
if (prod) {
    app.enable('trust proxy');
    provider.proxy = true;

    app.use((req, res, next) => {
        if (req.secure) {
            next();
        } else if (req.method === 'GET' || req.method === 'HEAD') {
            res.redirect(url.format({
                protocol: 'https',
                host: req.get('host'),
                pathname: req.originalUrl,
            }));
            // res.redirect(301, `https://${req.headers.host}${req.url}`);
        } else {
            res.status(400).json({
                error: 'invalid_request',
                error_description: 'do yourself a favor and only use https',
            });
        }
    });
}

// Integrate OIDC routes and start the server
routes(app, provider);
app.use(provider.callback());

// Start the server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// Dynamically import oidc-provider
/*
let provider;
(async () => {
    const { default: Provider } = await import('oidc-provider');
    const prod = process.env.NODE_ENV === 'production';
    const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;
    configuration.findAccount = Account.findAccount;
    provider = new Provider(ISSUER, { adapter, ...configuration });

    // Trust proxy in production for secure cookies
    if (prod) {
        app.enable('trust proxy');
        provider.proxy = true;
        // HTTPS redirect and error handling code...
    }

    // Integrate OIDC routes and start the server
    routes(app, provider);
    app.use(provider.callback());

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
})();*/
