if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express(); // init express instance
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');



// require routs
const userRoutes = require('./routes/users');
const galleryRoutes = require('./routes/gallery');


// connect to MongoDB
mongoose.connect('mongodb://localhost:27017/CoffeeDB', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});




// config the partials folder and enable ejs templates
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true })); // body-parser
app.use(methodOverride('_method')); // for PUT/DELETE support
app.use(express.static(path.join(__dirname, 'public'))) // enable static files server in public directory

// session configuration
const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig)) // middleware express session

app.use(flash()); // middleware enable flash messages using connect-flash

app.use(passport.initialize());
app.use(passport.session());

// Userscheme methods was created by mongoose plugin in models/user.js
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




// res.locals stores data only for a particular response
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


app.use(userRoutes); // include register/login/logout routs
app.use('/gallery', galleryRoutes) // new/edit store and reviews



app.get('/', (req, res) => {
    res.render('landing')
});


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Serving on port 3000')
})