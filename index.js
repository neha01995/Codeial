const express=require('express');
const http=require('http');
const port=8000;
const cookieParser=require('cookie-parser');
const expressLayouts=require('express-ejs-layouts');

const db=require('./config/mongoose');

// used for session cookie
const session=require('express-session');

const passport=require('passport');
const passportLocal=require('./config/passport-local-strategy');
const MongoStore=require('connect-mongo')(session);

const sassMiddleware=require('node-sass-middleware');

app.use(sassMiddleware({
    src:'assets/scss',
    dest:'assets/css',
    debug:true,
    outputStyle:'extended',
    prefix:'/css'
}));

const User=require('./models/user');



const app=express();

app.use(express.urlencoded());
app.use(cookieParser());
app.use(express.static('assets'));

app.use(expressLayouts);
app.set('layout extractStyles',true);
app.set('layout extractScripts',true);




// set up the view engine
app.set('view engine','ejs');
app.set('views','./views');

// mongo store is used to store the session cookie
app.use(session({
    name:'codeial',
    secret:'blahsomething',
    saveUninitialized:false,
    resave:false,
    cookie:{
        maxAge:(1000*60*100)
    },
    store: new MongoStore(
        {
            mongooseConnection:db,
            autoRemove:'disabled'
        },
        function(err){
            console.log(err || 'connect-mongodb setup ok');
        }
    )
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

// set up the routes

app.use('/', require('./routes'));




// listen to port
app.listen(port,function(err){
    if(err){
        console.log(`Error in running the server : ${err}`);
    }
    console.log(`server is running on port : ${port}`);
});

