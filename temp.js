const express = require('express');
var bodyParser = require('body-parser')
const sql = require('mysql');
const cors = require('cors');

const connection = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'answers_doubtnut',
    multipleStatements: true
});

const cookieParser = require('cookie-parser')


var {
    JWTService
} = require('./JWTService');

function getConfigurations(dataModel) {
    const configurations = {
        data: dataModel,
        secretKey: 'DOUBTNUT@1234567890!@#$%^&*()',
        expireDate: {
            expiresIn: '14d'
        }
    };

    return configurations;
}


const passport = require('passport')

const cookieSession = require('cookie-session');
require('./passport');
const path = require('path');
const app = express();

app.use(cookieSession({
    name: 'google-auth-session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000 * 7
}))
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(cookieParser());

const port = process.env.PORT || 3001

app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, '/index.html'));
})


app.get('/logout', function (req, res) {
    //console.log(req);

    const email = req.user._json.email;
    const token = null;
    connection.query('SELECT * FROM STUDENT where email=?', [email], function (err, result) {
        if (result.length == 0) {
            //no user found with email if
        } else {
            //user found
            connection.query('UPDATE STUDENT set token=? where email = ?',
                [token, email]);
            req.logout();
            res.redirect('/');
        }
    });


});

app.get("/failed", (req, res) => {
    res.send("Failed")
})
app.get("/success", (req, res) => {
    console.log(req.headers.authorization);
    const email = req.user._json.email;
    console.log('email ' + email);

    connection.query('SELECT * FROM STUDENT where email=?', [email], function (err, result) {
        if (result.length == 0) {
            //user not found
            res.redirect('/');
        } else {
            //user found
            const configurations = getConfigurations();
            const jwtService = JWTService(configurations.secretKey);
            if (!jwtService.isTokenValid(result[0].token, configurations.secretKey)) {
                //token expired
                console.log("it is not valid")
                res.redirect('/');
            } else {
                //token valid
                res.sendFile(path.join(__dirname, '/logout.html'));
            }
        }
    });

})

app.get('/google',
    passport.authenticate('google', {
        scope: ['email', 'https://www.googleapis.com/auth/userinfo.email']
    }));

app.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/',
    }),
    async function (req, res) {
        // jwt token
        let user = {

            email: req.user._json.email,
            user_id: req.user._json.sub
        }
        const configurations = getConfigurations(user);
        const jwtService = JWTService(configurations.secretKey);
        var token = jwtService.generateToken(configurations);
        //console.log(token);

        connection.query('SELECT * FROM STUDENT WHERE EMAIL=?', [user.email], async function (err, sqlres) {
            console.log(sqlres.length);
            if (sqlres.length == 1) {
                //user is there
                //token check
                if (jwtService.isTokenValid(sqlres[0].token, configurations.secretKey)) {
                    //true
                    token =await sqlres[0].token;
                    console.log('nothing' + token);
                } else {
                    // false
                    if (sqlres.length == 0) {
                        console.log('insert' + token);

                        connection.query('INSERT INTO STUDENT(email,token,google_id) values(?,?,?)',
                            [user.email, token, user.user_id]);
                    } else {
                        console.log('update' + token);

                        connection.query('UPDATE STUDENT set token=? where email = ?',
                            [token, user.email]);
                    }

                }

            } else {
                //user is not present
                //generate token and insert
                console.log('creating new user');
                connection.query('INSERT INTO STUDENT(email,token,google_id) values(?,?,?)',
                    [user.email, token, user.user_id]);
            }

        });

        console.log("token" + token);
        res.cookie('token', token, {
            httpOnly: true
        }).redirect('/success');

    }
);

app.post('/post_question', (req, res) => {
    let user = {

        email: req.user._json.email,
        user_id: req.user._json.sub
    }
    const configurations = getConfigurations(user);
    const jwtService = JWTService(configurations.secretKey);
    console.log(req.cookies.token);
    const token = req.cookies.token;
    console.log(jwtService.isTokenValid(token, configurations.secretKey));
    console.log(req.body);
    res.json("test");
});

app.get('*', function (req, res) {
    res.status(404).send('404');
});

function getRecord(){
    return new Promise(function(resolve,reject){
        connection.query('SELECT * FROM STUDENT where email=?', [email],function (err, rows, fields){
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
             resolve(rows);
        });
    })
}


app.listen(port, () => console.log("server running on port" + port))