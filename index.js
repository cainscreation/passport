const express = require('express');
var bodyParser = require('body-parser')
const sql = require('mysql');
const cors = require('cors');
const ejs = require('ejs');

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
app.set('views', './ejs');
app.set('view engine', 'ejs');

const port = process.env.PORT || 3001

app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, '/index.html'));
})


app.get('/logout', function (req, res) {
    //console.log(req);

    const email = req?.user?._json?.email;
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
app.get("/success", async (req, res) => {
    console.log(req.cookies);
    const email = req?.user?._json?.email;
    console.log('email ' + email);

    const result = await getRecord(email);
    console.log(result);
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

            email: req?.user?._json?.email,
            user_id: req?.user?._json?.sub
        }
        const configurations = getConfigurations(user);
        const jwtService = JWTService(configurations.secretKey);
        var token = jwtService.generateToken(configurations);
        //console.log(token);

        const sqlres = await getRecord(user.email);
        console.log(sqlres.length);
        if (sqlres.length == 1) {
            if (jwtService.isTokenValid(sqlres[0].token, configurations.secretKey)) {
                //true
                token = await sqlres[0].token;
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



        console.log("token" + token);
        res.cookie('token', token, {
            httpOnly: true
        }).redirect('/success');

    }
);
//get all questions
app.get('/add_question', async function(req, res) {
    const token = req?.cookies?.token;
    const configurations = getConfigurations();
    const jwtService = JWTService(configurations.secretKey);
    if (jwtService.isTokenValid(token, configurations.secretKey)) {

        console.log(token);
        res.render('post_question');
    } else {
        res.redirect('/');
    };

});

app.get('/questions',async function(req, res)  {
    const token = req?.cookies?.token;
    const configurations = getConfigurations();
    const jwtService = JWTService(configurations.secretKey);
    if (jwtService.isTokenValid(token, configurations.secretKey)) {

        console.log(token);
        const questions = await getAllQuestions();
        res.json(questions);
    } else {
        res.redirect('/');
    };

});
app.post('/post_question', async function(req, res) {
    let user = {

        email: req?.user?._json?.email,
        user_id: req?.user?._json?.sub
    }
    const configurations = getConfigurations();
    const jwtService = JWTService(configurations.secretKey);
    const token = req?.cookies?.token;
    if (jwtService.isTokenValid(token, configurations.secretKey)) {
        const userrec = await getRecord(user.email);
        console.log(req);
        const q = {
            title: req?.body?.title,
            class: req?.body?.class,
            subject_id: req?.body?.subject_id,
            studentid: userrec[0]?.id,
            additional: req?.body?.additional
        }
        console.log(q);
        await insertQuestion(q);
    } else {
        res.redirect("/");
    }

});

//comments 
app.post('/comments', async function(req, res) {
    const configurations = getConfigurations();
    const jwtService = JWTService(configurations.secretKey);
//console.log('comment api hit')
    const token = req?.cookies?.token;
    if (jwtService.isTokenValid(token, configurations.secretKey)) {
        const question_id = req?.body?.qid;
        const solution_text = req?.body?.comment;
        const email = req?.user?._json?.email;
        var res = await getRecord(email);
        const student_id = res[0]?.id;
        const comment = {
            question_id: question_id,
            text: solution_text,
            student_id: student_id
        }
        await insertComment(comment);
    } else {
        res.redirect('/');
    }


})
app.get('/comments/:id', async function(req, res) {
    const configurations = getConfigurations();
    const jwtService = JWTService(configurations.secretKey);
//console.log('comment api hit')
    const token = req?.cookies?.token;
    if (jwtService.isTokenValid(token, configurations.secretKey)) {
        const email = req?.user?._json?.email;
        //var response = await getRecord(email);
        
       
        const comments =await getSelectedQuestionComments(req.params.id);
        res.json(comments); 
    } else {
        res.redirect('/');
    }


})

//get selected questions
app.get('/question/:qid', async function(req, res) {
    const configurations = getConfigurations();
    const jwtService = JWTService(configurations.secretKey);

    const token = req?.cookies?.token;
    if (jwtService.isTokenValid(token, configurations.secretKey)) {
        console.log(req?.params?.qid);
        const response = await getSelectedQuestion(req?.params?.qid);
        console.log(response);
        res.json(response);
    } else {
        res.redirect("/")
    }
})




app.get('*', async function(req, res)  {
    res.status(404).send('404');
});

function getRecord(email) {
    return new Promise(function (resolve, reject) {
        connection.query('SELECT * FROM STUDENT where email=?', email, function (err, rows, fields) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    })
}

function insertQuestion(q) {
    return new Promise(function (resolve, reject) {
        const query = 'INSERT INTO QUESTIONS(question_title,class,subject_id,created_by_student_id,q_additional_info) VALUES(?,?,?,?,?)'
        connection.query(query, [q.title, q.class, q.subject_id, q.studentid, q.additional], function (err, rows, fields) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    })
}

function insertComment(q) {
    return new Promise(function (resolve, reject) {
        const query = 'INSERT INTO COMMENTS(questions_id,solution_text,student_id) VALUES(?,?,?)'
        connection.query(query, [q.question_id, q.text, q.student_id], function (err, rows, fields) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    })
}


function getSelectedQuestionComments(q) {
    return new Promise(function (resolve, reject) {
        const query =`SELECT c.solution_text,s.email as commentuser
        FROM COMMENTS as c 
        inner join student as s
        on s.id = c.student_id
        inner join 
        QUESTIONS as q 
        on q.id=c.questions_id 
        where q.id=?`;
            connection.query(query, [q], function (err, rows, fields) {
                if (err) {
                    return reject(err);

                }
                resolve(rows);
            })
    })
}
function getSelectedQuestion(q) {
    return new Promise(function (resolve, reject) {
        const query ='SELECT * FROM QUESTIONS where id=?';
            connection.query(query, [q], function (err, rows, fields) {
                if (err) {
                    return reject(err);

                }
                resolve(rows);
            })
    })
}


function getAllQuestions() {
    return new Promise(function (resolve, reject) {
        const query ='SELECT * FROM questions';
            connection.query(query, function (err, rows, fields) {
                if (err) {
                    return reject(err);

                }
                resolve(rows);
            })
    })
}

app.listen(port, () => console.log("server running on port" + port))