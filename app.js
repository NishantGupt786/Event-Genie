const bodyParser = require("body-parser");
const express = require("express");
const _ = require('lodash');
const validator = require('validator');
const nodemailer = require("nodemailer");
const notifier = require('node-notifier');
const app = express();
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const port = 3000;
app.set('view engine', 'ejs');
const saltRounds = 10;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let currentUser = "";
let currentPlanner = "";

mongoose.connect('mongodb://127.0.0.1:27017/eventgenieDB');



const userSchema = new mongoose.Schema ({
    firstname: String,
    secondname: String,
    email: String,
    mobilenum: String,
    password: String,
    requests:[{
        reqdescription: String,
        location : String,
        dateofevent: Date,
        urgent: Boolean
    }],
    interestedplanners:[{
        Aname: String,
        Anum: String,
        Amail: String
    }]
  });

const User = new mongoose.model("User", userSchema);

const plannerSchema = new mongoose.Schema({
    agencyName: String,
    agencyEmail: String,
    agencyNumber: String,
    password: String,
    description: String,
    location: String,
    reviews:[{
        reviewby: String,
        Comment: String
    }]
});

const Planner = new mongoose.model("Planner", plannerSchema);

const fpSchema = new mongoose.Schema({
    email: String,
    OTP: Number
});

const Forgpass = new mongoose.model("Forgpass", fpSchema);


    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing

  
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'johnnie.schmitt43@ethereal.email',
            pass: '1jYHctvdD8nSuuPkAV'
        }
    });


app.get('/', (req,res)=>{
    res.render("webmain");
});

app.get('/registerusers',async (req, res) => {
    res.render("registerusers");
});

app.get('/about', (req, res)=>{
    res.render("about");
});

app.get('/index1', (req, res)=>{
    res.render("index1");
});

app.get('/index', (req, res)=>{
    res.render("index");
});

app.get('/registerplanner',async (req, res) => {
    res.render("registerplanner");
});

app.get('/forgotpassword', (req, res) => {
    res.render("forgotpassword");
});

app.post('/forgotpassword',async function (req,res){
    console.log("1");
    const fpemail = req.body.mail;
    const otp = Math.floor(1000 + (Math.random()*9000));
    let info = await transporter.sendMail({
        from: '"Event-Genie" <event_genie@gmail.com>', // sender address
        to: fpemail, // list of receivers
        subject: "Forgot Password", // Subject line
        text: "Your OTP is "+otp // plain text body
    });
    await User.findOne({email: fpemail}).then(function ()  {
        const fpUser = new Forgpass({
            email: fpemail,
            OTP: otp
        });
        fpUser.save();
        console.log("2");
        res.redirect("enterotp");
    });
});

app.get('/enterotp', (req, res) => {
    res.render("enterotp");
});

app.post('/enterotp',async function(req, res){
    const mail = req.body.mail;
    const otp = req.body.otp;
    const newpassword = req.body.newpassword;
    console.log(otp);
    await Forgpass.findOne({email: mail}).then(function(userdata){
        console.log(userdata.OTP);
        if (otp==userdata.OTP) {

            if (validator.isAlphanumeric(newpassword) === false && newpassword.length >= 8){
                bcrypt.hash(newpassword, saltRounds, function(err, hash) {
                    User.findOne({email: userdata.email}).then(function(changecreds){
                        console.log(changecreds.password);
                        console.log(hash);
                        changecreds.password = hash;
                        changecreds.save();
                    });
            
                });
                res.redirect("index1");
            }
            else{
                notifier.notify({
                    title: 'Error',
                    message: 'Password should have Letters, numbers and special characters and should be atleast 8 characters',
                    wait: true
                  });
                  res.redirect(req.originalUrl);
            }
        }
        else{
            notifier.notify({
                title: 'Error',
                message: 'Please enter valid number',
                wait: true
              });
              res.redirect(req.originalUrl);
        }
    })
});

app.get('/plannerotp', (req, res) => {
    res.render("plannerotp");
});

app.get('/forgotpart1planner', (req, res) => {
    res.render("forgotpart1planner");
});

app.post('/forgotpart1planner',async function (req,res){
    const fpemail = req.body.mail;
    const otp = Math.floor(1000 + (Math.random()*9000));
    let info = await transporter.sendMail({
        from: '"Event-Genie" <event_genie@gmail.com>', // sender address
        to: fpemail, // list of receivers
        subject: "Forgot Password", // Subject line
        text: "Your OTP is "+otp // plain text body
    });
    await Planner.findOne({agencyEmail: fpemail}).then(function ()  {
        const fpUser = new Forgpass({
            email: fpemail,
            OTP: otp
        });
        fpUser.save();
        res.redirect("plannerotp");
    });
});

app.post('/plannerotp',async function(req, res){
    const mail = req.body.mail;
    const otp = req.body.otp;
    const newpassword = req.body.newpassword;
    console.log(otp);
    await Forgpass.findOne({email: mail}).then(function(userdata){
        console.log(userdata.OTP);
        if (otp==userdata.OTP) {

            if (validator.isAlphanumeric(newpassword) === false && newpassword.length >= 8){
                bcrypt.hash(newpassword, saltRounds, function(err, hash) {
                    Planner.findOne({agencyEmail: userdata.email}).then(function(changecreds){
                        console.log(changecreds.password);
                        console.log(hash);
                        changecreds.password = hash;
                        changecreds.save();
                    });
                });
                res.redirect("index");
            }
            else{
                notifier.notify({
                    title: 'Error',
                    message: 'Password should have Letters, numbers and special characters and should be atleast 8 characters',
                    wait: true
                  });
                  res.redirect(req.originalUrl);
            }
        }
        else{
            notifier.notify({
                title: 'Error',
                message: 'Incorrect OTP',
                wait: true
              });
              res.redirect(req.originalUrl);;
        }
    })
});

app.post('/registerusers', (req, res)=> {
    const usermail = req.body.email;
    const userpassword = req.body.password;
    const usernumber = req.body.mnum;
    const val = Number(usernumber)?true:false
    console.log(val);
    if (validator.isEmail(usermail)===false) {
        notifier.notify({
            title: 'Error',
            message: 'Please enter valid email',
            wait: true
          });
          res.redirect(req.originalUrl);
    }
    else if(usernumber.length<10 || val===false || usernumber.length>10){
         
            notifier.notify({
                title: 'Error',
                message: 'Please enter valid number',
                wait: true
              });
              res.redirect(req.originalUrl);
        
    }
    else if (validator.isAlphanumeric(userpassword) === true || userpassword.length < 8){
         
            notifier.notify({
                title: 'Error',
                message: 'Password should have Letters, numbers and special characters and should be atleast 8 characters',
                wait: true
              });
              res.redirect(req.originalUrl);
        
    }
    else{
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            const newUser = new User({
              firstname: req.body.ufname,
              secondname: req.body.ulname,
              email: req.body.email,
              mobilenum: req.body.mnum,
              password: hash
            });
            newUser.save().then(function () {
                currentUser = req.body.ufname;
                res.redirect("index1");});
        });
    }
});


app.post('/index1',async function (req, res){
    const username = req.body.email;
    const password = req.body.password;

    const foundUser = await User.findOne({email: username});
    if (foundUser) {
      bcrypt.compare(password, foundUser.password, function(err, result) {
        console.log(username);
          if (result === true) {
            currentUser = foundUser.firstname;
            console.log(currentUser);
            res.redirect('index2');
          }
          else{
            notifier.notify({
                title: 'Error',
                message: 'Wrong Password',
                wait: true
              });
              res.redirect(req.originalUrl);
          }
      });
    }
  });

  app.post('/registerplanner', (req, res)=> {
    const planneremail = req.body.email;
    const plannerpassword = req.body.password;
    const plannernumber = req.body.mnum;
    const plannername = req.body.name.split(" ").join("");
    const val = Number(plannernumber)?true:false;
    if (validator.isEmail(planneremail)===false) {
        notifier.notify({
            title: 'Error',
            message: 'Please enter valid email',
            wait: true
          });
          res.redirect(req.originalUrl);
    }
    else if(plannernumber.length<10 || val === false || plannernumber.length>10){
        notifier.notify({
            title: 'Error',
            message: 'Please enter valid number',
            wait: true
          });
          res.redirect(req.originalUrl);
    }
    else if (validator.isAlphanumeric(plannerpassword) === true || plannerpassword.length < 8){
        notifier.notify({
            title: 'Error',
            message: 'Password should have Letters, numbers and special characters and should be atleast 8 characters',
            wait: true
          });
          res.redirect(req.originalUrl);
    }
    else{
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            const newPlanner = new Planner({
                agencyEmail: req.body.email,
                agencyName: plannername,
                agencyNumber: req.body.mnum,
                password: hash,
                description: req.body.description,
                location: req.body.loc
            });
        newPlanner.save().then(function () {res.redirect("index");});
        });
    }
});

app.post('/index',async function (req,res){
    const username = req.body.email;
    const password = req.body.password;

    const foundPlanner = await Planner.findOne({agencyEmail: username});
    currentPlanner = foundPlanner.agencyName;
    if (foundPlanner) {
      bcrypt.compare(password, foundPlanner.password, function(err, result) {
          if (result === true) {
            res.redirect("main");
          }
          else{
            notifier.notify({
                title: 'Error',
                message: 'Wrong Password',
                wait: true
              });
              res.redirect(req.originalUrl);
        }
      });
    }
    
});


app.get('/index2',async function (req,res){
    const specificuser = await User.findOne({firstname: currentUser});
    console.log(specificuser.email);
    if(specificuser.interestedplanners.length !== 0){
        console.log(specificuser.interestedplanners);
        res.render("index2", {newListItems: specificuser.interestedplanners});}
    else{
        res.render("index2",{newListItems: ["No Requests"]});
    }
});

app.post('/index2',async function (req,res){
    const specificuser = await User.findOne({firstname: currentUser});
    console.log(specificuser.email);
    const rdescription = req.body.desc;
    const eventlocation = req.body.location;
    const checkedurgent = req.body.checkbox;
    const eventdate = req.body.date;
    specificuser.requests.push({
        reqdescription: rdescription,
        location : _.lowerCase(eventlocation),
        dateofevent: eventdate,
        urgent: checkedurgent
    });
    await specificuser.save();
    notifier.notify({
        title: 'Confirmation',
        message: 'Yor event has been submitted',
        wait: true
      });
      res.redirect(req.originalUrl);
});

app.get('/useraccinfo',async function (req, res){
    res.redirect("useraccinfo");
    const specificuser =await User.findOne({firstname: req.params.username});
    if (specificuser) {
        res.send(specificuser.interestedplanners);
    }
    else{
        res.send(404);
    }
});

app.post('/user/:username/accinfo',async function (req,res){
    const specificuser = await User.findOne({firstname: req.params.username});
    if (specificuser) {
        specificuser.requests = [];
        await specificuser.save();
        res.send('Cleared requests');
        console.log(specificuser.requests);
    }
    else{
        res.send(404);
    }
});


app.get('/main', async function(req, res){
    const specificplanner = await Planner.findOne({agencyName: currentPlanner});
    
    res.write("<h1>Event requests near your location</h1>");
    if (specificplanner) {
        for await(const doc of User.find()){
            doc.requests.forEach(element=>{
                if (element.location === specificplanner.location) {
                    res.write("<p>"+element.reqdescription+"</p>");
                    res.write("<p>"+element.location+"</p>");
                    res.write("<p>"+element.date+"</p>");
                    res.write("<button>Show interest</button>");
                }
            })
        }
        console.log("Successful");
    }
    else{
        res.send(404);
    }
});




app.listen(port, () => {
    console.log(`website running on port ${port}`)
});


