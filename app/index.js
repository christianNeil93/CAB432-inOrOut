// --------------- Imports and npm modules -------------------------------- //
const express = require('express');
let bodyParser = require('body-parser');
let path = require('path');

// --------------- Basic Server Config ------------------------------------ //
let app = express();
const PORT = 80;

// --------------- Setting up file paths and server directory structure -- //
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, "views"));
app.use('/', bodyParser.urlencoded({ extended: false }));
app.use("/static", express.static(path.join(__dirname, "public")));

// ---------------------------------------------- //
// ---------------- START ROUTES ---------------- //
// ---------------------------------------------- //

    // ------------------------------ //
    // ----- Random Food Search ----- //
    // ------------------------------ //
    let randSearch = require('./randsearch');
    app.use('/', randSearch);

    // ------------------------------ //
    // ----- Normal Food Search ----- //
    // ------------------------------ //
    let foodSearch = require('./foodsearch');
    app.use('/', foodSearch);

    // ---------------------------------------- //
    // ----- Show Food/Restaurant Results ----- //
    // ---------------------------------------- //
    let foodResults = require('./foodresults');
    app.use('/', foodResults);

// ---------------------------------------------- //
// --------------- Home Page Request ------------ //
// ---------------------------------------------- //
app.get('/', function(req, res) {
    console.log('Home Page Loading...')
    res.render('index.pug');
});

// ---------------------------------------------- //
// --------------- Home Page Search Submit ------ //
// ---------------------------------------------- //
app.post('/', function(req, res) {
    res.redirect('/food?food=' + JSON.stringify(req.body.food_search));
});

// ---------------------------------------------- //
// --------------- Search Page Form Submit ------ //
// ---------------------------------------------- //
app.post('/food', function(req, res) {
    res.redirect('/');
}); 

// ----------------------------------------------------------------------------------- //
// -------------- Redirecting user to Food Results page after changing location ------ //
// ----------------------------------------------------------------------------------- //
app.post('/foodres', function(req, res) {
    console.log(req.body.location);
    let foodItem = req.query.result;
    let location = req.body.location;
    res.redirect('/foodres?result=' + foodItem + '&loc=' + location);
});

// -------- Hosting the App :) --------- //
app.listen(PORT)
console.log('server restarted on port %d\n',PORT);
