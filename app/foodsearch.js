// *************************************************************** //
// ******** Contains search query requests to Spoonacular ******** //
// *************************************************************** //

const express = require('express');
const router = express.Router();

// --------------- Requiring unirest for Spoonacular API requests ------------ //
let unirest = require('unirest');

// ---------------------------------------------- //
// --------------- Normal Page Request ---------- //
// ---------------------------------------------- //
router.get('/food', function(req, res){
    console.log('\nRouting to Search Page...')
    console.log('Search Page Loading...');
    
    let food = req.query.food;
    let foodQuery = food.split(' ').join('+');
    foodQuery = foodQuery.replace(/"/g,"");
    console.log(foodQuery);

    // ----------------------------------------------------------------------------------- //
    // -------------- Code for getting recipe results based on search query -------------- //
    // ----------------------------------------------------------------------------------- //
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?number=50&offset=0&query=" + foodQuery)
    .header("X-Mashape-Key", "SPOONACULARKEY")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {

        console.log('Requesting food results');

        // --------------- ERROR HANDLING --------------- //

        if (result.status !== 200) {
            console.log('Error searching for \'' + foodQuery + '\' Status Code = ' + result.status);
            res.render('index.pug');
        }

        let dataParsed = result.body;
        let recipeIDs = [];
        let recipeNames = [];
        let recipePicURLS = [];
        let baseURI = dataParsed.baseUri;            

        dataParsed.results.forEach(result => {
            recipeIDs.push(result.id)
            recipeNames.push(result.title);
            recipePicURLS.push(baseURI + result.image);
        });            

        let anyResults;

        dataParsed.totalResults == 0 ? anyResults = false : anyResults = true;            

        res.render('food', {food: food, recipeIds: recipeIDs, recipes: recipeNames, recipePics: recipePicURLS, anyResults: anyResults});
    });
});

// ------------- Exporting the route
module.exports = router;
