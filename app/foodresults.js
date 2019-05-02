// ***************************************************************************** //
// *** Contains foodID Request made to Spoonacular and ************************* //
// *** also related city/location and restaurant requests (based on cuisine) *** //
// ***************************************************************************** //

const express = require('express');
const router = express.Router();

// --------------- Requiring unirest for Spoonacular API requests ------------ //
let unirest = require('unirest');

// --------------- Requiring RapidAPI Connect for Zomato API requests -------- //
const RapidAPI = require('rapidapi-connect');
let rapid = new RapidAPI("default-application_5b838370e4b0e54f757f3197", 
                            "d223e628-0674-4181-82bc-fcc8663a4171");

// ---------------------------------------------- //
// --------------- Food Result Page Request ----- //
// ---------------------------------------------- //
router.get('/foodres', (req, res) => {
    console.log('Result Page Loading...')

    let foodItem = req.query.result;
    let location;
    if (typeof(req.query.loc) === 'undefined' || req.query.loc == "undefined" || req.query.loc == "") {
        location = "brisbane";
    } else {
        location = req.query.loc;
    }
    
    console.log('Using location: ' + location);

    // ----------------------------------------------------------------------------------- //
    // -------------- Code for getting recipe information based on recipe ID ------------- //
    // ----------------------------------------------------------------------------------- //

    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + foodItem + "/information")
    .header("X-Mashape-Key", "yABkY0V2i3mshSsQNwSFzMYBfEk2p1egJWhjsncEHkROPEitFh")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {

        console.log('Requesting recipe information');  
        
        // --------------- ERROR HANDLING --------------- //

        if (result.status !== 200) {
            console.log('Error searching for food ID ' + foodItem + ' Status Code = ' + result.status);
            res.render('index.pug')
        }

        let dataParsed = result.body;
        let foodName = dataParsed.title;
        let cuisines = dataParsed.cuisines;
        let dietReqs = dataParsed.diets;
        let imageSrc = dataParsed.image;


            // Getting analyzed instruction list
        let analyzedInstructs = dataParsed.analyzedInstructions;
        let ingredients = dataParsed.extendedIngredients;
        let cookingTime = dataParsed.cookingMinutes;
        let prepTime = dataParsed.preparationMinutes;    
        
        let instructList = [];
        let stepList = [];
        let ingredientList = [];

        analyzedInstructs.forEach(instruct => {
            instructList.push(instruct);
        }); 

        ingredients.forEach(ingredient => {
            ingredientList.push(ingredient.originalString);
        });

        if (typeof instructList !== 'undefined' && instructList.length > 0){
            for (let i = 0; i <instructList[0].steps.length; i++) {
                if ((instructList[0].steps[i].step.toString()).length > 2){
                    stepList.push(instructList[0].steps[i].step)
                }            
            }
        }        

        let cuisineIDs = [], cuisineList = [], cityID, cuisineIDStrArr = [], cityName;

        // ----------------------------------------------------------------------------------- //
        // -------------- Request for getting cityIDs based on location search query --------- //
        // ----------------------------------------------------------------------------------- //

        rapid.call('Zomato', 'searchCity', { 
            'searchQuery': location,
            'apiKey': '50bf937e9da1a151e70e4fda5f754951 '
        
        }).on('success', (payload)=>{

            // ---------- Special testing case for invalid location search ---------- //
            if (payload.result.location_suggestions.length > 0) {  

                cityID = payload.result.location_suggestions[0].id
                
                // ----------------------------------------------------------------------------------- //
                // -------------- Request for getting city string based on current cityID ------------ //
                // ----------------------------------------------------------------------------------- //

                rapid.call('Zomato', 'getCities', { 
                    'apiKey': '50bf937e9da1a151e70e4fda5f754951 ',
                    'cityIds': [String(cityID)]
                
                }).on('success', (payload)=>{
                     cityName = payload.result.location_suggestions[0].name;
                }).on('error', (payload)=>{
                     console.log('Error requesting the city name...') 
                });

                // ----------------------------------------------------------------------------------- //
                // -------------- Request for getting all possible cuisine ID's and names for city ID  //
                // ----------------------------------------------------------------------------------- //

                rapid.call('Zomato', 'getCuisines', { 
                    'cityId': cityID,
                    'apiKey': '50bf937e9da1a151e70e4fda5f754951 '
                
                }).on('success', (payload)=>{
                    payload.result.cuisines.forEach(result => {                    
                        cuisineIDs.push(result.cuisine.cuisine_id);
                        cuisineList.push(result.cuisine.cuisine_name);
                    });
        
                    let cuisineTested, cuisineOptions, cuisineMatchIDs;
        
                    if (Object.keys(cuisines).length == 0) {
                        cuisineTested = [];
                        cuisineOptions = false;
                        cuisineMatchIDs = [];                        
        
                    } else {
                        cuisineTested = cuisines;  
                        cuisineOptions = true;              
                        cuisineMatchIDs = [];
                        
                        for (let j = 0; j < Object.keys(cuisines).length; j++) {
                            for (let i = 0; i < Object.keys(cuisineList).length; i++) {
                                if (cuisineList[i].toUpperCase() === cuisines[j].toUpperCase()) {
                                    cuisineMatchIDs.push(cuisineIDs[i]);
                                    cuisineIDStrArr.push(String(cuisineIDs[i]));
                                } 
                            }
                        }
                    }                    

                    // --------- Testing for special case where cuisine --------- //
                    // --------- is tagged for food but not location ------------ //
                    let missingCuisineLocation, numCuisines;

                    if(cuisineMatchIDs.length < 1 && cuisineOptions) {
                        console.log('NO RESTAURANTS TAGGED WITH RECIPE CUISINES AT LOCATION');
                        missingCuisineLocation = true;
                        numCuisines = cuisines.length;
                    } else {
                        missingCuisineLocation = false;
                        numCuisines = cuisineMatchIDs.length;
                    }
    
                    let numRests, restNames = [], restCuisines = [], restRatings = [], 
                        restImgs = [], restLats = [], restLngs = [], restAddresses = [];

                    // ----------------------------------------------------------------------------------- //
                    // -------------- Request for getting restaurant details based on city and cuisine IDs //
                    // ----------------------------------------------------------------------------------- //

                    rapid.call('Zomato', 'search', { 
                        'apiKey': '50bf937e9da1a151e70e4fda5f754951 ',
                        'entityType': 'city',
                        'count': '20',
                        'entityId': cityID,
                        'cuisinesIds': cuisineIDStrArr
                    
                    }).on('success', (payload)=>{
                        console.log('Parsing Zomato Restaurant Details');                                                
        
                        numRests = payload.result.results_shown
        
                        // -------------------------------------------------------------------- //
                        // ----- Pushing relevent restaurant to variables to send to pug ------ //
                        // -------------------------------------------------------------------- //

                        for (let i = 0; i < numRests; i++) {
                            restNames.push(payload.result.restaurants[i].restaurant.name);
                            restCuisines.push('Cuisines: ' + payload.result.restaurants[i].restaurant.cuisines);
                            restRatings.push('User Ratings: ' + payload.result.restaurants[i].restaurant.user_rating.aggregate_rating + ' - ' + 
                                            payload.result.restaurants[i].restaurant.user_rating.rating_text);
                            restImgs.push(payload.result.restaurants[i].restaurant.featured_image);
                            restLats.push(payload.result.restaurants[i].restaurant.location.latitude);
                            restLngs.push(payload.result.restaurants[i].restaurant.location.longitude);
                            restAddresses.push(payload.result.restaurants[i].restaurant.location.address);
                        }

                        // ----------------------------------------------------------------------------------- //
                        // -------------- Displaying the Food Results page with required variables ----------- //
                        // ----------------------------------------------------------------------------------- //

                        res.render('foodres', {foodItem: foodItem, location: location, cityName: cityName, title: foodName, ingredients: ingredientList,
                            cuisines: cuisineTested, cuisineIDs: cuisineMatchIDs, numCuisines: numCuisines, dietary: dietReqs, 
                            instructs: stepList, image: imageSrc, anyCuisine: cuisineOptions, restNames: restNames, 
                            restCuisines: restCuisines, restRatings: restRatings, numRests: numRests, restImgs: restImgs, cookTime: cookingTime, prepTime: prepTime,
                            restLats: restLats, restLngs: restLngs, restAddresses: restAddresses, missingCuisineLocation: missingCuisineLocation}); 
                    
                    
                    }).on('error', (payload)=>{
                        console.log('Error getting restaurant details'); 
                        res.render('index.pug');
                    });   
        
                }).on('error', (payload)=>{
                    console.log('Error getting cuisine names/IDs');
                    res.render('index.pug');
                });  

            } else {
                console.log('Invalid Location Search');
                console.log(foodItem);
                res.render('noresults.pug', {foodItem: foodItem, location: location});
            }
              
        }).on('error', (payload)=>{
             console.log('Error Getting City ID')
             res.render('index.pug')
        });             
    });        
});  

// ------------- Exporting the route
module.exports = router;