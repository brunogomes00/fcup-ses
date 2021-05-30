const crypto = require('crypto');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const {
    Client
} = require('pg')

readline.question(`Please Insert First Name:\n`, first_name => {
    readline.question(`Please Insert Last Name:\n`, last_name => {
        readline.question(`Please Insert Username(Max 12 alphanumeric characters):\n`, username => {
            readline.question(`Please Insert Age(18-118):\n`, age => {
                readline.question(`Please Insert Clearance Level(1-3):\n`, async (clearance_level) => {

                    age = Math.floor(+age);
                    clearance_level = Math.floor(+clearance_level);
                    if (age < 18 || age > 118 || isNaN(age))
                        throw "Age outside limit";
                    if (clearance_level < 1 || clearance_level > 3 || isNaN(clearance_level))
                        throw "Wrong Clearance level"

                    let first_name_filtered = first_name.replace(/[^a-zA-Z -]/g, '');
                    let last_name_filtered = last_name.replace(/[^a-zA-Z -]/g, '');
                    let username_filtered = username.replace(/[^a-zA-Z0-9 -]/g, '');

                    if (first_name_filtered != first_name)
                        throw "Invalid characters on First name";
                    if (last_name_filtered != last_name)
                        throw "Invalid characters on Last name";
                    if (username_filtered != username)
                        throw "Invalid characters on Username";
                    if (username.length > 12)
                        throw "Too many characters on Username"
                    readline.question(`Please Insert database username:\n`, async (dbuser) => {
                        readline.question(`Please Insert database password:\n`, async (password) => {
                            await createNewUser(first_name, last_name, username, age, clearance_level, password, dbuser);
                            readline.close();
                        })
                    })
                })
            })
        })
    })

});

async function createNewUser(first_name, last_name, username, age, clearance_level, password, dbuser) {

    let userRandomId = crypto.randomBytes(16).toString('base64');
    userRandomId = userRandomId.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');

    const query = {
        text: 'INSERT INTO users(first_name, last_name, username, age, clearance_level, randomID) VALUES($1, $2, $3, $4, $5, $6)',
        values: [first_name, last_name, username, age, clearance_level, userRandomId],
    }

    const client = new Client({
        user: dbuser,
        host: 'localhost',
        database: 'mydb',
        password: password,
        port: 5432
    });

    await client.connect();
    const res = await client.query(query)
    await client.end()

    console.log("User Id =", userRandomId);

}