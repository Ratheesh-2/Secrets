require('dotenv').config(); 

const express = require('express');

const ejs = require('ejs');

const app = express();

const mongoose = require('mongoose');

const encrypt = require('mongoose-encryption');

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User  = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', (req, res) => {
    const user = new User({
        email: req.body.username,
        password: req.body.password
    })
    user.save().then(() => {
        res.render("secrets");
    }).catch((err) => {
        console.log(err);
    })
});



app.post('/login', (req, res) => {
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({email: userName}).then((foundUser) => {
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
        
    }).catch((err) => {
        console.log(err);
    })
})

app.listen(3000, (req, res) => {
    console.log("listening to port 3000");
})
