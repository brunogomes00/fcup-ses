const express = require("express");
const fs = require("fs");
const https = require('https');
const path = require('path');
const cors = require('cors')
const bodyParser = require('body-parser')
const crypto = require('crypto');
const pki = require('node-forge').pki;
const rateLimit = require("express-rate-limit");

const app = express();
app.disable('x-powered-by');
const app2 = express();
app2.disable('x-powered-by');
app.use(function (req, res, next) {
    res.setHeader("Content-Security-Policy", "script-src 'self'");
    return next();
});
app2.use(function (req, res, next) {
    res.setHeader("Content-Security-Policy", "script-src 'self'");
    return next();
});
app.use(express.static('web_layout'))
app2.use(express.static('web_layout'))
app2.use(express.urlencoded({
    extended: false
}))
app.use(cors())
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app2.use(cors())
app2.use(bodyParser.urlencoded({
    extended: true
}));
app2.use(bodyParser.json());

const casigningcert = fs.readFileSync('certificates/server_cert.pem');
let user_data = {};

let server_data = {
    host: "localhost",
    port: 8080
}

function sendRequest(send_path, port, host, key, cert, check) {
    let options = {
        hostname: host,
        port: port,
        path: send_path,
        method: 'GET',
        ca: casigningcert
    };

    if (key !== null && check === true) {
        options.key = key;
        options.cert = cert;
        options.rejectUnauthorized = false;

    } else if (key !== null) {
        options.key = key;
        options.cert = cert;
    }

    return new Promise((resolve, reject) => {

        https.get(options, (response) => {
            let data = '';
            let certificate = response.socket.getPeerCertificate(false);
            // A chunk of data has been received.
            response.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            response.on('end', () => {
                resolve({
                    data: data,
                    certificate: certificate,
                    statusCode: response.statusCode
                });
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}

function sendPost(post_path, data, port, host, key, cert, check) {

    let options = {
        hostname: host,
        port: port,
        path: post_path,
        method: 'POST',
        ca: casigningcert,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    if (key !== null && check === true) {
        options.key = key;
        options.cert = cert;
        options.rejectUnauthorized = false;

    } else if (key !== null) {
        options.key = key;
        options.cert = cert;
    }

    return new Promise((resolve, reject) => {

        const req = https.request(options, (res) => {
            res.on('data', (d) => {
                process.stdout.write(d)
            })
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode
                });
            })
        })

        req.on('error', (error) => {
            reject(error)
        })

        req.write(data)
        req.end()

    });
}

app.post('/signup', async function (req, res) {
    const settings = req.body;

    let username_filtered = req.body.username.replace(/[^a-zA-Z0-9 -]/g, '');
    let onetimeid_filtered = req.body.onetimeid.replace(/[^a-zA-Z0-9 -]/g, '');


    if (username_filtered != req.body.username || req.body.username.length > 12 || onetimeid_filtered != req.body.onetimeid){
        res.status(400).send("Username or Onetimeid is wrong.");
        return;
    }

    const settings = {
        username: username_filtered,
        onetimeid: onetimeid_filtered
    }


    let keys = await sendRequest("/first_sign_in?username=" + settings.username + "&onetimeid=" + settings.onetimeid, server_data.port, server_data.host);
    keys = keys.data;
    try {
        keys = JSON.parse(keys);
    } catch (e) {
        res.status(400).send("Username or Onetimeid is wrong.");
        return;
    }

    if (settings.password != settings.confirmpassword) {
        res.status(400).send("Password error");
        return;
    }

    user_data.username = settings.username;
    user_data.key = keys.private;
    user_data.cert = keys.cert;
    user_data.received_messages = [];
    user_data.sent_messages = [];
    user_data.pending = [];
    user_data.password = settings.password;

    const hash = crypto.createHash('sha512');
    hash.update(settings.username);
    const encryption_key = crypto.pbkdf2Sync(settings.password, hash.digest('hex'), 100000, 256 / 8, 'sha512');

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('id-aes256-GCM', encryption_key, iv);
    fs.writeFileSync(settings.username, Buffer.concat([iv, cipher.update(JSON.stringify(user_data)), cipher.final(), cipher.getAuthTag()]).toString('base64'));

    user_data.key = Buffer.from(user_data.key, 'base64');
    user_data.cert = Buffer.from(user_data.cert, 'base64');

    startingServer.close();

    continuousServer = https
        .createServer({
                cert: user_data.cert,
                key: user_data.key,
                ca: casigningcert,
                sessionTimeout: 1
            },
            app2
        )
        .listen();

    await sendRequest("/info?port=" + continuousServer.address().port, server_data.port, server_data.host, user_data.key, user_data.cert);

    res.json({
        port: continuousServer.address().port
    });



});

app.post('/signin', async function (req, res) {
    const settings = req.body;

    let temp_buffer = fs.readFileSync(settings.username, 'utf-8')

    const hash = crypto.createHash('sha512');
    hash.update(settings.username);
    const encryption_key = crypto.pbkdf2Sync(settings.password, hash.digest('hex'), 100000, 256 / 8, 'sha512');

    temp_buffer = Buffer.from(temp_buffer, 'base64');
    const iv = temp_buffer.slice(0, 16);
    const cipher = crypto.createDecipheriv('id-aes256-GCM', encryption_key, iv);
    cipher.setAuthTag(temp_buffer.slice(-16))
    try {
        user_data = JSON.parse(Buffer.concat([cipher.update(temp_buffer.slice(16, -16)), cipher.final()]).toString());
    } catch (e) {
        res.status(400).send("Wrong password!")
        return;
    }
    user_data.key = Buffer.from(user_data.key, 'base64');
    user_data.cert = Buffer.from(user_data.cert, 'base64');
    user_data.password = settings.password;
    user_data.received_messages = [];
    user_data.sent_messages = [];
    const ca = pki.certificateFromPem(casigningcert);
    const client = pki.certificateFromPem(user_data.cert);

    try {
        if (!ca.verify(client)) throw new Error()
    } catch (err) {
        res.status(400).send("Wrong password!");
        return;
    }

    startingServer.close();

    continuousServer = https
        .createServer({
                cert: user_data.cert,
                key: user_data.key,
                ca: casigningcert,
                sessionTimeout: 1
            },
            app2
        )
        .listen();

    await sendPending();
    await sendRequest("/info?port=" + continuousServer.address().port, server_data.port, server_data.host, user_data.key, user_data.cert);

    res.json({
        port: continuousServer.address().port
    });



});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/web_layout/index.html'));
});

app2.post('/root_value', async function (req, res) {
    const reply = await sendRequest("/square_root?value=" + req.body.root_value, server_data.port, server_data.host, user_data.key, user_data.cert);
    res.status(reply.statusCode).send("" + reply.data);
});

app2.post('/cubic_value', async function (req, res) {
    const reply = await sendRequest("/cubic_root?value=" + req.body.cubic_value, server_data.port, server_data.host, user_data.key, user_data.cert)
    res.status(reply.statusCode).send("" + reply.data);
});

app2.post('/n_root_value', async function (req, res) {
    const reply = await sendRequest("/n_root?value=" + req.body.value + "&root=" + req.body.root, server_data.port, server_data.host, user_data.key, user_data.cert);
    res.status(reply.statusCode).send("" + reply.data);
});

app2.get('/list_users', async function (req, res) {
    const reply = await sendRequest("/list_users", server_data.port, server_data.host, user_data.key, user_data.cert)
    res.status(reply.statusCode).send(reply.data);
});

app2.get('/status', async function (req, res) {
    res.sendStatus(200);
});

app2.get('/close', async function (req, res) {
    res.sendStatus(200);
    closeProgram();
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});

// only apply to requests that begin with /message
app2.use("/message", apiLimiter);

app2.post('/message', async function (req, res) {

    var date = new Date(Date.now()).toUTCString();
    user_data.received_messages.push({
        username: req.body.username,
        message: req.body.message,
        date: date
    })
    res.sendStatus(200);
});


app2.get('/send_message', async function (req, res) {
    const ip = req.query.ip;
    const port = req.query.port;
    const certificate = req.query.certificate;
    const message = req.query.message;
    const username = req.query.username;

    const reply = await sendRequest("/status", port, ip, user_data.key, user_data.cert, true);

    if (reply == "ok") {}

    const x509 = new crypto.X509Certificate(Buffer.from(certificate, 'base64')).fingerprint256;
    let check = true;

    try {
        for (let i = 0; i < reply.certificate.fingerprint256.length; i++) {
            if (x509[i] != reply.certificate.fingerprint256[i]) {
                check = false;
                break;
            }
        }
    } catch (e) {
        user_data.pending.push({
            ip,
            port,
            certificate,
            message,
            username
        });
        res.status(400).send("Server is Unavailable");
        return;
    }

    if (!check) res.status(400).send("Certificate is not valid");

    else {

        const post = await sendPost("/message", JSON.stringify({
            username: user_data.username,
            message: message
        }), port, ip, user_data.key, user_data.cert, true)

        var date = new Date(Date.now()).toUTCString();
        if (post.statusCode == 200) {
            user_data.sent_messages.push({
                username: username,
                message: message,
                date: date
            })
            res.sendStatus(200);
        }


    }
});

async function sendPending() {

    let pending = user_data.pending;

    if (pending.length > 0) {
        const user_list = await sendRequest("/list_users", server_data.port, server_data.host, user_data.key, user_data.cert);
        for(let i = 0; i < pending.length; i++){
            for(let j = 0; j < user_list.length; j++){
                if (pending[i].username === user_list[j].username){
                    pending[i].port = user_list[j].port;
                    pending[i].ip = user_list[j].ip;
                }
            }
        }
    }

    for (let i = 0; i < pending.length; i++) {

        const reply = await sendRequest("/status", pending.port, pending.ip, user_data.key, user_data.cert, true);

        if (reply == "ok") {}

        const x509 = new crypto.X509Certificate(Buffer.from(pending.certificate, 'base64')).fingerprint256;
        let check = true;

        try {
            for (let i = 0; i < reply.certificate.fingerprint256.length; i++) {
                if (x509[i] != reply.certificate.fingerprint256[i]) {
                    check = false;
                    break;
                }
            }
        } catch (e) {
            continue;
        }

        if (!check) continue;
        else {
            const post = await sendPost("/message", JSON.stringify({
                username: pending.username,
                message: pending.message
            }), pending.port, pending.ip, user_data.key, user_data.cert, true)

            var date = new Date(Date.now()).toUTCString();
            if (post.statusCode == 200) {
                user_data.sent_messages.push({
                    username: pending.username,
                    message: pending.message,
                    date: date
                })
                continue;
            }
        }
    }

}


app2.get('/sent', async function (req, res) {
    await sendPending();
    res.send(user_data.sent_messages);
});
app2.get('/received', async function (req, res) {
    res.send(user_data.received_messages);
});

let startingServer = https.createServer({
            cert: fs.readFileSync('certificates/client_cert.pem'),
            key: fs.readFileSync('certificates/client_key.pem'),
            ca: casigningcert
        },
        app
    )
    .listen(8000);

let continuousServer;

function closeProgram() {
    if (user_data) {
        const hash = crypto.createHash('sha512');
        hash.update(user_data.username);
        const encryption_key = crypto.pbkdf2Sync(user_data.password, hash.digest('hex'), 100000, 256 / 8, 'sha512');

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('id-aes256-GCM', encryption_key, iv);
        fs.writeFileSync(user_data.username, Buffer.concat([iv, cipher.update(JSON.stringify(user_data)), cipher.final(), cipher.getAuthTag()]).toString('base64'));
    }

    process.exit();
}

process.on('SIGINT', () => {
    closeProgram();
});