require('dotenv').config();

const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
var cors = require('cors')

app.use(express.json());
app.use(cors())

db.connect((err)=>{
    if(err){
        throw err;
    }
    console.log('MySql Connected...');
});

let refreshTokens = [];

var users = [];  
/*
app.get('/todos', async(req,res)=>{
    let sql = 'SELECT * FROM fruits';
    db.query(sql, (err, result)=>{
        if(err) throw err;
        res.send(result)
    });

})
*/

app.post('/users/create', async(req,res)=>{
    try {
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        console.log(`\nsalt is ${salt}`);
        console.log(`hashedPassword is ${hashedPassword}`);

        var createdDate = new Date(Date.now());
        console.log(createdDate.toString());

        let sql = `INSERT INTO users (username, password, createdAt, updateAt) VALUES ('${req.body.username}', '${hashedPassword}', '${createdDate.toString()}', '${createdDate.toString()}');`;
        db.query(sql, (err, result)=>{
            if(err) return res.status(500).json({ message: err })
            return res.status(200).json({result});
        });
    } catch (error) {
        if(err) return res.status(500).json({ message: error })
    }
})


app.post('/users/login', async(req,res)=>{
    let dbPassword = '';
    let dbUsername = '';
    let isUsernameFound = false;

    let sql = `SELECT * FROM users WHERE username = '${req.body.username}'`

    db.query(sql, async(err, result)=>{
        console.log(result)
        console.log(typeof result)

        if(err) {
            return res.status(500).json({ message: err })
        }

        if(result.length == 0){
            //console.log('Running If');
            return res.status(404).json({ message: "Invalid username or password" })
        }else{
            console.log('Running Else');

            dbPassword = result[0].password;
            dbUsername = result[0].username;

            try{
                if(await bcrypt.compare(req.body.password, dbPassword)){
                    let user = {
                        username: dbUsername,
                    } 

                    const accessToken = generateAccessToken(user);
                    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
                    refreshTokens.push(refreshToken)
        
                    let data = {
                        "message":"Success",
                        "username": dbUsername,
                        "accessToken":accessToken,
                        "refreshToken":refreshToken
                    }
        
                    return res.status(200).json(data);
                }else{
                    return res.status(404).json({ message: "Invalid username or password" })
                }
            } catch (error) {
                console.log(error);
                return res.status(500).json({ message: "Server error" })
            }

        }

    });
})


app.post('/refreshToken', (req, res) => {
    const refreshToken = req.body.token
    if(refreshToken == null) return res.sendStatus(401)
    if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ name: user.name })
        res.json({ accessToken: accessToken })
    })
});

app.delete('/logout',(req, res) =>{
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
});

app.get('/users/privateRoute', authenticateToken,(req,res)=>{
    console.log('')
    console.log('req.header in /users/privateRoute')
    console.log(req.headers)

    res.status(200).json({
        message:"Authorized User!",
        data: req.user
    })
})

app.get('/users/retrieve', async(req,res)=>{
    let sql = `SELECT * FROM users`;


    db.query(sql, async(err, result)=>{
        if(err) {
            return res.status(500).json({ message: err })
        }
    
        if(result.length == 0){
            //console.log('Running If');
            return res.status(404).json({ message: "Users are empty" })
        }else{
            console.log('Running Else');
    
            return res.status(200).json(result)
    
        }
    })

    
    //res.status(200).json(users)
});

//---------------

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
        if(err) return res.sendStatus(403)
        req.user = user;
        next();
    })
}

//==============================================================================================================================



function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5s' });
}

app.listen(3002, () => {
    console.log(`\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nServer is running on port: http://:3002`);
})


