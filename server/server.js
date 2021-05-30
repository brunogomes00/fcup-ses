const fs = require("fs");
const https = require('https');
const {
  exec,
  execSync
} = require("child_process");
const express = require("express");
const {
  Client
} = require('pg')
const rateLimit = require("express-rate-limit");

let password;
let dbuser;

function root(value, root) {
  return Math.pow(value, 1 / root);
}

async function generate_client_certificates(username, res, clearance_level) {

  if (!fs.existsSync("certificates/" + username)) {
    fs.mkdirSync("certificates/" + username);
  } else {
    res.status(404)
    res.send("User already created")
    return;
  }

  execSync("openssl req -newkey rsa:4096 -keyout certificates/" + username + "/" + username + "_key.pem -out certificates/" + username + "/" + username + "_csr.pem -nodes -days 365 -subj \"/CN=" + clearance_level + "," + username + "\"", async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }

  });

  execSync("openssl x509 -req -in certificates/" + username + "/" + username + "_csr.pem -CA certificates/server_cert.pem -CAkey certificates/server_key.pem -out certificates/" + username + "/" + username + "_cert.pem -set_serial 01 -days 365", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
  });

  const priv_file = fs.readFileSync('certificates/' + username + '/' + username + '_key.pem');
  const cert_file = fs.readFileSync('certificates/' + username + '/' + username + '_cert.pem');

  fs.unlinkSync('certificates/' + username + '/' + username + '_key.pem');
  fs.unlinkSync('certificates/' + username + '/' + username + '_csr.pem');

  res.send({
    private: priv_file.toString('base64'),
    cert: cert_file.toString('base64'),
  });
}

const app = express();
app.disable('x-powered-by');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.get('/square_root', (req, res) => {
  const username = req.socket.getPeerCertificate().subject.CN;

  if (req.client.authorized) {
    const value = +req.query.value;
    res.send("" + root(value, 2))
  } else {
    res.status(401)
      .send(`Sorry, but you need to provide a valid client certificate to continue.`)
  }
});

app.get('/cubic_root', async (req, res) => {
  const username = req.socket.getPeerCertificate().subject.CN;
  if (req.client.authorized) {
    const query = {
      // give the query a unique name
      name: 'fetch-user',
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username.split(",")[1]],
    }

    const client = new Client({
      user: dbuser,
      host: 'localhost',
      database: 'mydb',
      password: password,
      port: 5432
    });

    await client.connect();
    const db_res = await client.query(query)
    await client.end();

    if (db_res.rowCount == 0 || db_res.rowCount > 1) {
      res.status(401).send(`Sorry, but you need to provide a valid client username to continue.`);
      return;
    }

    if (db_res.rows[0].clearance_level < 2) {
      res.status(401).send(`Sorry, but you need to provide a client with enough clearance level to continue.`);
      return;
    }

    const value = +req.query.value;
    res.send("" + root(value, 3))
  } else {
    res.status(401)
      .send(`Sorry, but you need to provide a valid client certificate to continue.`)
  }
});

app.get('/n_root', async (req, res) => {
  const username = req.socket.getPeerCertificate().subject.CN;
  if (req.client.authorized) {
    const query = {
      // give the query a unique name
      name: 'fetch-user',
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username.split(",")[1]],
    }

    const client = new Client({
      user: dbuser,
      host: 'localhost',
      database: 'mydb',
      password: password,
      port: 5432
    });

    await client.connect();
    const db_res = await client.query(query)
    await client.end()

    if (db_res.rowCount == 0 || db_res.rowCount > 1) {
      res.status(401).send(`Sorry, but you need to provide a valid client username to continue.`);
      return;
    }

    if (db_res.rows[0].clearance_level < 3) {
      res.status(401).send(`Sorry, but you need to provide a client with enough clearance level to continue.`);
      return;
    }

    //TODO validate input for number only
    const value = +req.query.value;
    const root_value = +req.query.root;
    res.send("" + root(value, root_value));
  } else {
    res.status(401)
      .send(`Sorry, but you need to provide a valid client certificate to continue.`)
  }

});

app.get('/first_sign_in', async (req, res) => {
  const username = req.query.username;
  const onetimeid = req.query.onetimeid;

  const query = {
    // give the query a unique name
    name: 'fetch-user',
    text: 'SELECT * FROM users WHERE username = $1',
    values: [username],
  }

  const client = new Client({
    user: dbuser,
    host: 'localhost',
    database: 'mydb',
    password: password,
    port: 5432
  });

  await client.connect();
  const db_res = await client.query(query)
  await client.end()

  if (db_res.rowCount == 0 || db_res.rowCount > 1) {
    res.status(401).send(`Sorry, but you need to provide a valid client username to continue.`);
    return;
  }

  if (db_res.rows[0].randomid !== onetimeid) {
    res.status(401).send(`Sorry, but you need to provide a valid client randomid to continue.`);
    return;
  }

  generate_client_certificates(username, res, db_res.rows[0].clearance_level);

});

app.get('/list_users', async (req, res) => {

  const username = req.socket.getPeerCertificate().subject.CN;

  if (req.client.authorized) {

    const query = {
      // give the query a unique name
      name: 'fetch-user',
      text: `SELECT users.username as username, user_connection.port as port, user_connection.ip as ip
      FROM users, user_connection
      WHERE users.username <> $1 AND users.clearance_level <= $2 AND users.username = user_connection.username`,
      values: [username.split(",")[1], username.split(",")[0]],
    }

    const client = new Client({
      user: dbuser,
      host: 'localhost',
      database: 'mydb',
      password: password,
      port: 5432
    });

    await client.connect();
    const db_res = await client.query(query)
    await client.end()

    for (let i = 0; i < db_res.rows.length; i++) {
      db_res.rows[i].certificate = fs.readFileSync('certificates/' + db_res.rows[i].username + '/' + db_res.rows[i].username + '_cert.pem').toString('base64');
    }

    res.send(db_res.rows);
  } else {
    res.status(401)
      .send(`Sorry, but you need to provide a valid client certificate to continue.`)
  }

});

app.get('/info', async (req, res) => {

  const username = req.socket.getPeerCertificate().subject.CN;

  //TODO get userinfo from database

  if (req.client.authorized) {
    const ip = req.connection.remoteAddress;
    const port = req.query.port;

    const query = {
      // give the query a unique name
      name: 'fetch-user',
      text: `INSERT INTO user_connection (username, port, ip)
      VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE 
      SET port = $2;`,
      values: [username.split(",")[1], port, ip],
    }
    //"62405"

    const client = new Client({
      user: dbuser,
      host: 'localhost',
      database: 'mydb',
      password: password,
      port: 5432
    });

    await client.connect();
    await client.query(query)
    await client.end()

    res.send("OK");
  } else {
    res.status(401)
      .send(`Sorry, but you need to provide a valid client certificate to continue.`)
  }

});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});


readline.question(`Please Insert database username:\n`, async (dbusr) => {
  readline.question(`Please Insert database password:\n`, async (pass) => {
    dbuser = dbusr;
    password = pass;
    readline.close();
  })
})


https
  .createServer({
      cert: fs.readFileSync('certificates/server_cert.pem'),
      key: fs.readFileSync('certificates/server_key.pem'),
      requestCert: true,
      rejectUnauthorized: false,
      ca: fs.readFileSync('certificates/server_cert.pem'),
    },
    app
  )
  .listen(8080);