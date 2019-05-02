// *************************************************************** //
// *** Contains random food search requests to Spoonacular API *** //
// *************************************************************** //

const express = require('express');
const router = express.Router();

// --------------- Requiring unirest for Spoonacular API requests ------------ //
let unirest = require('unirest');

// ---------------------------------------------- //
// --------------- Random Page Request ---------- //
// ---------------------------------------------- //
router.get('/random', function(req, res) {
    console.log('Random Food Page Loading...');

    // -------------------------------------------------------------- //
    // --------------- Code for getting randomly selected recipes --- //
    // -------------------------------------------------------------- //
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/random?number=10")
    .header("X-Mashape-Key", "SPOONACULARKEY")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {

        // --------------- ERROR HANDLING --------------- //

        if (result.status !== 200) {
            console.log('Error searching for random recipes, Status Code = ' + result.status);
            res.render('index.pug');
        }

        let randResults = result.body;
        let recipeIDs = [], recipeNames= [], recipePics = [];

        randResults.recipes.forEach(recipe => {
            recipeIDs.push(recipe.id);
            recipeNames.push(recipe.title);
            recipePics.push(recipe.image);
        });     

        res.render('randomfood.pug', {recipeIDs: recipeIDs, recipeNames: recipeNames, recipePics: recipePics});
    });
});

// ------------- Exporting the route
module.exports = router;
