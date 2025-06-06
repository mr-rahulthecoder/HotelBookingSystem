if(process.env.NODE_ENV != "PRODUCTION"){
    require('dotenv').config();
}
 
const express= require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride=require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter =require("./routes/user.js");


app.set("view engine","ejs");
app.set("views" ,path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
app.engine("ejs",ejsMate);


 const db_url=process.env.ATLAS_URL;

main().then((res)=>{
    console.log("connection succesful");
}).catch((err)=>{
    console.log(err);
})

async function main(){
     await mongoose.connect(db_url);
  
}



 const store = MongoStore.create({
    mongoUrl:db_url,
    crypto:{
        secret:process.env.SECRET,     
    },
    touchAfter: 24 * 3600,
 })

 store.on("error",() => {
    console.log("error in mongostore session " , err);

 })

const sessionOptions ={
    store,
    secret :process.env.SECRET,
    resave :false,
    saveUninitialized :true,
    cookie :{
        expires:Date.now() + 7*24*60*60*1000,
        maxAge :7*24*60*60*1000,
        htppOnly :true
    },
};


// app.get("/",(req,res)=>{
//     res.send("home");
// });

app.use(session(sessionOptions));
app.use(flash());

// passport set up
app.use(passport.initialize());
app.use(passport.session());
passport.use( new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next) =>{
    res.locals.success= req.flash("success");
    res.locals.error= req.flash("error");
    res.locals.currUser = req.user;
    next();


});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email:"sudent@gmail.com",
//         username:"deltastudent"

//     });
//    let registerUser = await User.register(fakeUser,"helloworld");
//    res.send(registerUser);
// })

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter)


app.all("*",(req,res,next)=>{
next(new ExpressError(404,"page is not found"));
});

app.use( (err,req,res,next)=>{
    let {status=500,message="something went wrong"}= err;

    res.status(status).render("error.ejs",{message});
    //  res.status(status).send(message);
 
});

app.listen(8080,()=>{
    console.log("app is listining on port 8080");
});