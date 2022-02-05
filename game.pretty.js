/*  This file contains most of the javascript associated with the Dice game

    It contains a Game class which:
        - initialises the game (setup method)
        - iterates through rounds of the game (play method)
        - ends the game (end method)
        - several utility/help functions
        (Each of the above alter the associated webpage, game.html)

    A Dice class which:
        - creates a cluster of die(s)
        - allows the dice to be rolled
        - returns the most recent roll
        - returns the sum of the most recent roll"s values

    A Die class which:
        - allows the creation of a die between specificed limits
        - returns a random number between the lower and upper bounds of the die face values

    Last Modified: 22/11/2020
    Modified by: Rob Lamprell
*/



// Classes written for ie9 compat - "class" keyword not supported
// Game Class - Main driver for the website - contains the setup, play and end stages
//  --- The game class will accept Dice counts other than 3 to 6, however the landing page will not update
//      to reflect this and will continue to state "Pick the number of Dice for the game (between 3 and 6):"
var Game = function () {

    // number of rounds, points and the game"s dice
    var rounds      = 0;
    var totalPoints = 0;
    var gameDice    = []; 

    // die face values - only sequential face values are allowed
    var dieFaceLb  = 1;
    var dieFaceUb  = 6;

    // number of dice 
    var count_lb;
    var count_ub;

    function Game(lb, ub) {
        
        // if lower or upper bound values are not passed then start the game on the default of 3 and 6
        if (lb == null || ub == null)  {
            count_lb = 3;
            count_ub = 6;
        }
        else {
            count_lb = lb;
            count_ub = ub;
        }

        // setup the Game
        setup();
    }

    // Game States //
    // Set the game up - create the dice
    var setup = function() {
        
        // get Dice count and check that it falls within the game parameters
        // -- must be a whole number between 3 & 6 (default)
        var diceCount = document.getElementById("input_DiceCount").value;
        if (diceCount < count_lb || diceCount > count_ub || isNaN(diceCount) || diceCount%1 != 0) {

            // error - outside the game rules
            alert("You must select a natural (whole) number between " + count_lb + " and " + count_ub + "!");
            return;
        }

        // create all the dice - (default) 3-6 dice with faces 1 to 6 - will throw errors if invalid parameters are used
        gameDice = new Dice(diceCount, dieFaceLb, dieFaceUb);

        // HTML edits
        // remove "start game" button & input box
        removeThisElement("setup");
        removeThisElement("input_DiceCount");

        // change the text to be more helpful
        document.getElementById("topText").innerHTML = "Play to roll, End to stop the game."

        // add in "continue game" and "end game"
        createButton("Play",    "Game.prototype.play()",   "buttons");
        createButton("End",     "Game.prototype.end()",    "buttons");

        // title the table
        var newHeader = document.createElement("h2");
        newHeader.innerHTML = "Results So Far";
        newHeader.setAttribute("id", "Results");

        // create results table
        var tableHeaders = ["Rounds Played", "Points Won", "Total Points"];
        var tableRowIds = ["roundsPlayed", "roundPoints", "totalPoints"];

        createTable(tableHeaders, tableRowIds);

        // place here
        placeElementAfterHere(newHeader, document.getElementById("buttons"));
    };

    // Play a round
    Game.prototype.play = function play() {
        // advance the round count
        rounds++;

        // roll all the dice
        gameDice.rollAll();
        var diceRoll    =  gameDice.getLastRoll();
        var diceSum     =  gameDice.getSumValues();

        // apply the game rules to the roll
        var roundPoints =  calcPoints(diceRoll, diceSum);
        totalPoints     += roundPoints;
        
        // display the results
        displayResults(roundPoints);
        displayDiceImages(diceRoll);
    };

    // End the Game
    Game.prototype.end = function end() {
        
        // delete the old table, play/end buttons and the Dice Images
        var elementsToRemove = ["playTable", "Play",       "End",
                                "diceImages", "topText",   "Roll",
                                "Results"];

        removeTheseElements(elementsToRemove);

        // create a new table
        var tableHeaders    = ["Rounds Played", "Total Points", "Points Per Round"];
        var tableRowIds     = ["roundsPlayed", "totalPoints", "averagePoints"];
        createTable(tableHeaders, tableRowIds);

        // update the table
        displayEndResults();

        // title the table
        var newHeader = document.createElement("h2");
        newHeader.innerHTML = "Final Results";
        newHeader.setAttribute("id", "final results");
        
        // place header before the table
        document.getElementById("playTable").parentNode.insertBefore(newHeader, document.getElementById("playTable"));
    };


    // Game Rules //
    // Calculate the points for this round"s dice roll
    var calcPoints = function(diceRoll, diceSum) {

        var roundPoints = 0; 

        // Copy the array then sort - sorting is required by some of the algorithms below
        var myDice = diceRoll.slice();
        myDice.sort();

        // All N dice have the same value
        if (allTheSame(myDice)) {

            roundPoints = 60 + diceSum;
        }

        // N-1 but not N dice have the same value
        else if (nMinusOne(myDice, (dieFaceUb-dieFaceLb)+1)) {

            roundPoints = 40 + diceSum;
        }

        // A run (a sequence K+1 to K+N for some K ≥ 0)
        else if (sequentialDice(myDice)) {

            roundPoints = 20 + diceSum;
        }

        // All dice have different values, but it is not a run
        else if (allDifferent(myDice)) {

            roundPoints = 0 + diceSum;
        }

        // Any other outcome - return 0
        return roundPoints;
    }

    // check if all the values returned are the same
    var allTheSame = function(myDice) {

        for (var i=0; i<myDice.length-1; i++) {
    
            var sameValue = myDice[i] == myDice[i+1];
            if (!(sameValue)) { 
                
                return false;
            }
        }

        return true;
    }

    // 1 and N-1 key pairs - IE compat - Originally utilised Map but, not supported in IE9
    var nMinusOne = function(myDice, dieFaces) {

        var len     = myDice.length;
        var map     = new Array(dieFaces);
        var entries = 0;

        // if arr length is less than 2 it cannot meet the ruleset
        if (len < 2) return false;
        
        // create a unique list of keys and the number of times they appear
        for (var i=0; i<len; i++) {

            var key = myDice[i]-1;
            
            // if the key has no values yet, create the key and give it an initial value
            if (map[key] == undefined) {

                map[key] = 1;

                // more than 2 keys, the rule is broken (impossible to have 1 and n-1 counts)
                entries++;
                if (entries > 2) return false;
            }
            // iterate the count by +1
            else {
                
                var count = map[key]+1;
                map[key] = count;
            }
        }

        // Check the first key value
        var keyCount = map[myDice[0]-1];
        
        // if this is not 1 or n-1 then it breaks the rule
        if ((keyCount!=1 && keyCount!=len-1)) return false;
        return true;
    }

    // check if the values are sequential - only works if pre-sorted
    var sequentialDice = function(myDice) {

        for (var i=0; i<myDice.length-1; i++) {

            var difference = myDice[i+1]-myDice[i];
            if (difference != 1) {

                return false;
            } 
        }

        return true;
    }

    // all the dice have different Values
    var allDifferent = function(myDice) {

        // Sort them
        for (var i=0; i<myDice.length; i++) {

            var sameValue = myDice[i+1] == myDice[i];
            if (sameValue) {

                return false;
            }
        }

        return true;
    }
    
    
    // Utility functions //
    // Remove multiple elements
    var removeTheseElements = function(names) {

        for (var i=0; i<names.length; i++) {
            
            var elm = names[i];
            removeThisElement(elm);
        }
    }

    // Remove an element - IE compat - .remove() not supported
    var removeThisElement = function(name) {

        var devareThis = document.getElementById(name);
        devareThis.parentNode.removeChild(devareThis);
    }

    // Add this element after this element
    var placeElementAfterHere = function(thisElement, afterHere) {

        afterHere.parentNode.insertBefore(thisElement, afterHere.nextElementSibling);
    }

    // create a table
    var createTable = function(headers, rowIds) {

        var newTable = document.createElement("table");
        newTable.setAttribute("id", "playTable")

        for (var i=0; i<headers.length; i++) {

            var rows_ = document.createElement("tr");
            var head_ = document.createElement("th");
            var data_ = document.createElement("td");

            newTable.appendChild(rows_);

            rows_.appendChild(head_);
            head_.innerHTML = headers[i];

            head_.appendChild(data_);
            data_.innerHTML = "-";
            data_.id = rowIds[i];
        }

        // Placement
        placeElementAfterHere(newTable, document.getElementById("buttons"));
    }

    // create a button 
    var createButton = function(name, click, placement) {

        // create button
        var newButton = document.createElement("button");

        // attributes
        newButton.innerHTML = name;
        newButton.setAttribute("id", name);
        newButton.setAttribute("onclick", click);

        // Placement
        document.getElementById(placement).appendChild(newButton);
    }

    // Add images of the dice results to the document
    var displayDiceImages = function(diceRoll) {

        for (var i=0; i<diceRoll.length; i++) {

            var img     = new Image(); 
            var imgPath = "Images_Assignment_2/baseline_looks_" + diceRoll[i] + "_black_48dp.png";

            img.src = imgPath;
            img.id  = "diceImgs"+i;

            // first round - add images
            if (rounds==1) {
                
                // title the dice iamges - once only
                if (i==1) {
                    var newHeader = document.createElement("h2");
                    newHeader.innerHTML = "Last Roll";
                    newHeader.setAttribute("id", "Roll");

                    // ie compat - "title" in place of "alt"
                    newHeader.setAttribute("title", "Numeric image representing the die value " + diceRoll[i] 
                                                  + " Sourced from https://material.io/resources/icons/?style=baseline/")

                    placeElementAfterHere(newHeader, document.getElementById("playTable"));
                }

                document.getElementById("diceImages").appendChild(img);
            }
            // all other rounds - replace images
            else {

                var imgPlacement = "diceImgs"+i;
                document.getElementById(imgPlacement).src = imgPath;
                document.getElementById(imgPlacement).setAttribute("title", "Numeric image representing the die value " + diceRoll[i] 
                                                                          + " Sourced from https://material.io/resources/icons/?style=baseline/");
            }
        }
    }

    /*  Mid Game Results
        rounds played, points from this round and thet total number of points so far. */
    var displayResults = function(roundPoints) {

        document.getElementById("roundsPlayed").innerHTML   = rounds;
        document.getElementById("roundPoints").innerHTML    = roundPoints;
        document.getElementById("totalPoints").innerHTML    = totalPoints;
    }

    /*  End Game Results
        rounds played, points for the entire game and the average points earned per round. */
    var displayEndResults = function() {
        // average points per round, rounded to 1dp
        var averagePoints   = totalPoints / rounds;
        averagePoints       = Math.round(averagePoints * 10) / 10;
        
        document.getElementById("roundsPlayed").innerHTML   = rounds;
        document.getElementById("totalPoints").innerHTML    = totalPoints;
        document.getElementById("averagePoints").innerHTML  = averagePoints;
    }

    return Game;
}();



// Create the game Dice - utilising the Die class
var Dice = function () {

    // A container for the game, the number of dice, 
    // the lower/upper bound of faces and the current roll
    var gameDice = [];
    var dCount;
    var lb;
    var ub;
    var currentRoll;

    // Constructor
    function Dice(diceCount, facesLB, facesUB) {
        
        dCount  = diceCount;
        lb      = facesLB;
        ub      = facesUB;
        
        // use the die class to make our dice
        build();
    }

    // Create the cluster of Dice
    var build = function() {
        
        // check the lb<=ub
        if (!validBounds()) {

            throw "Upper Bound must be greater than or equal to Lower Bound";
        }

        // use the Die class to make the dice
        for (var i=0; i<dCount; i++) {
        
            var die = new Die(lb, ub);
            gameDice.push(die);
        }
    };

    // upper bound must be greater than or equal to lower bound
    var validBounds = function() {

        if (lb > ub) {

            return false;
        }

        return true;
    };

    // Roll all the dice - results stored within the DIce class scope
    Dice.prototype.rollAll = function rollAll() {

        currentRoll = [];
    
        for (var i=0; i<gameDice.length; i++) {
    
            var res = gameDice[i].roll();
            currentRoll.push(res);
        }
    };

    // Return the most recent roll results
    Dice.prototype.getLastRoll = function showLastRoll() {

        return currentRoll;
    };

    // Return the Sum of all the values from the most recent dice roll
    Dice.prototype.getSumValues = function sumValues() {

        var playSum = 0;
        
        for (var i=0; i<currentRoll.length; i++) {
           
            var res = currentRoll[i];
            playSum += res;
        }
    
        return playSum;
    };

    return Dice;
}();



// Can be used to create more than 6 faces dices and ones which do not start at 1
// -- limited to sequential dice face values
var Die = function () {

    // lower and upper bounds for the dice faces
    var lb;
    var ub;

    // constructor to handle creation -- Default values of 1 and 6 present incase no values are passed
    function Die(lowerBound, upperBound) {

        lb = lowerBound;
        ub = upperBound;
                
        if (!areBoundsOK()) {
            throw "Upper Bound must be larger than Lower Bound!";
        }
    } 

    // make sure the inputs are valid
    var areBoundsOK = function() {
        // error if lower bound is not smaller than upper bound
        if (lb >= ub) {

            return false;
        }

        return true;
    };

    // Roll the die, returning a "random" number
    Die.prototype.roll = function roll() {
        // https://www.w3schools.com/js/js_random.asp 
        var randomNumber = (Math.random() * ub) + lb;

        // rounddown https://www.w3schools.com/jsref/jsref_floor.asp
        var roundedNumber = Math.floor(randomNumber);
        return roundedNumber; 
    };

    return Die;
}();