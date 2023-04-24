require('dotenv').config(); 

const express = require('express');

const ejs = require('ejs');

const app = express();

const mongoose = require('mongoose');

// const md5 = require('md5'); level 3

// const encrypt = require('mongoose-encryption'); level 1

// const bcrypt = require('bcrypt');
// const saltRounds = 10;  level 4

const session = require('express-session');
const passport = require('passport');
const passportLocalMongooose = require('passport-local-mongoose');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));


app.use(session({
  secret: 'Our little secrets',
  resave: false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});level 1
userSchema.plugin(passportLocalMongooose);
userSchema.plugin(findOrCreate);

const User  = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) => {
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/secrets', (req, res) => {
    User.find({"secret": {$ne: null}}).then((foundUser) => {
        res.render("secrets", {userwithsecrets: foundUser});
    }).catch((err) => {
        console.log(err);
    })
});

app.get('/submit', (req, res)=> {
    if(req.isAuthenticated){
        res.render("submit");
    }else{
        res.redirect('/login');
    }
});

app.post('/submit', (req, res) => {
    const secretSubmitted = req.body.secret;

    User.findById(req.user.id).then((foundUser) => {
        foundUser.secret = secretSubmitted;
        foundUser.save().then(()=> {
            res.redirect('/secrets');
        })
    }).catch(err => {
        console.log(err);
    })
})

app.get('/logout', (req, res)=> {
    req.logout(function(err) {
        if (err){ 
            console.log(err);
        }
        res.redirect('/');
      });
})

app.post('/register', (req, res) => {
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const user = new User({
    //         email: req.body.username,
    //         // password: md5(req.body.password)
    //         password: hash
    //     })
    //     user.save().then(() => {
    //         res.render("secrets");
    //     }).catch((err) => {
    //         console.log(err);
    //     });  
    // });level 1 to level 4

    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err) {
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate("local")(req, res, () => {
                res.redirect('/secrets');
            }) 
        }
    })
});

app.post('/login', (req, res) => {
    // const userName = req.body.username;
    // const password = req.body.password;
    // // const password = md5(req.body.password);
    // User.findOne({email: userName}).then((foundUser) => {
    //     if(foundUser){
    //         bcrypt.compare(password, foundUser.password, function(err, result) {
    //             res.render("secrets");
    //         });  
    //     }
    // }).catch((err) => {
    //     console.log(err);
    // }); level 1 to level 4

    const user = new User({
        username : req.body.username,
        password : req.body.password
    })

    req.login(user, (err) => {
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, () => {
                res.redirect('/secrets');
            }) 
        }
    });
})

app.listen(3000, (req, res) => {
    console.log("listening to port 3000");
});
