'use strict';

const POWERBALL_URL = 'https://data.ny.gov/api/views/d6yy-54nr/rows.json';
const MEGAMILLIONS_URL = 'https://data.ny.gov/api/views/5xaw-6ayf/rows.json';
const POWERBALL = "Powerball";
const MEGAMILLIONS = "MegaMillions";

// this becomes an array of objects with all of the stuff the adpater returns.
const STORE = {
    drawings: [],

}

///// Filters //////////////////////////////////////////////////////////////////////////////////////////////////////

function findMostCommonNumber(drawings) {
    let mostCommonNumber = null;
    const numbers = drawings.map((drawing) => {
        const numbersNoMulti = drawing.numbers.slice(drawing.numbers.length - 1)
        return {
            specialNumber: numbersNoMulti.pop(),
            regularNumbers: numbersNoMulti
        }
    });
    return mostCommonNumber;
}

//// API functions //////////////////////////////////////////////////////////////////////////////////////////////////
// adapter means taker this and make something else.

// this function collects the data from each API 
function getLotteryDataFromApi(entireHistory) {
        // the function in the call signature is an anonymous function, the response is the datat that would come from the api
        // we need one set of data before the other, so powerball comes megamillions
    getPowerballDataFromApi(function (response) {
        // go to powerball adapater (response.data is the raw json data)
        const powerBallDrawings = powerBallAdapter(response.data);
        // our drawing are equal to entire history, if entire history is true then drawing eqauls all the powerball drawings. else, it equals the last 8.
        const drawings = entireHistory ? powerBallDrawings : powerBallDrawings.slice(powerBallDrawings.length - 8);
        // then store the data.
        STORE.drawings.push(...drawings);

        getMegaMillionsDataFromApi(function (response) {
            const megaMillionsDrawings = megaMillionsAdapter(response.data);
            const drawings = entireHistory ? megaMillionsDrawings : megaMillionsDrawings.slice(megaMillionsDrawings.length - 8);
            STORE.drawings.push(...drawings);

            // this passes all the data that we have gone through this point to the main page.  this time we are passing STORE.drawings to the main page
            displayMainPage(STORE.drawings);
        });
    });
}

// gets powerball data (i.e. POWERBALL_URL), as well as success and error.
function getPowerballDataFromApi(success, error) {
    getDataFromApi(POWERBALL_URL, success, error);
}

// gets megamillions data (i.e. MEGAMILLIONS_URL), as well as success and error.
function getMegaMillionsDataFromApi(success, error) {
    getDataFromApi(MEGAMILLIONS_URL, success, error);
}

// retrieve data from API's (applies to both megamillions and powerball)
function getDataFromApi(url, success, error) {
    const settings = {
        url,
        type: 'GET',
        dataType: 'json',
        success,
        error,
    }
    $.ajax(settings);
}

// the adapter formalizes and standadizes the data.  the datat comes in different, but you need to make it into something the app can use.
// adpater will have a map in it if you have a list and need to turn it into another list things.
// more than one api, you dont need an adapter.
// if there apis are differnt, traffic and map, you dont need an adapter.
// an adapter is a mashup
function megaMillionsAdapter(drawings) {
    // these wont change inside the loop, this is configuration.  this is the blueprint.  i adapted it into something i can translate.
    const dateIndex = 8;
    const numbersIndex = 9;
    const megaBallIndex = 10;
    const multiplierIndex = 11;
    // this map is a for loop.  map is taking a for loop, and then pushing result of each loop result iteration into the array and then return the array at the end.
    // everything int he curly brace is what happens in the for loop, the contents of the loop.
    return drawings.map((drawing) => {
        // these variables would be inside the loop because otherwsie they would.
        // the variables above could be inside the loop, but it would be bulky. 
        
        // here we make new arrays for special balls in the drawing.
        const megaBallMultiplier = [drawing[megaBallIndex], drawing[multiplierIndex]];
        // in the json raw data, this is a string of numbers speerated by spaces.  here we split them into an array of actual numbers
        const numbers = drawing[numbersIndex].split(" ")
        // you push megaballmultiplier, the ... (i.e.array spread operator) pushes the multiplier to the end of the array.  megaballmultiplier is an array of two numbers.
        numbers.push(...megaBallMultiplier)
        // taking all the data, creating a new object with megamillions data and the date.
        return {
            name: MEGAMILLIONS,
            date: new Date(drawing[dateIndex]),
            numbers
        }
    });
}

function powerBallAdapter(drawings) {
    const dateIndex = 8;
    const numbersIndex = 9;
    const multiplierIndex = 10;
    return drawings.map((drawing) => {
        const numbers = drawing[numbersIndex].split(" ")
        numbers.push(drawing[multiplierIndex])
        return {
            name: POWERBALL,
            date: new Date(drawing[dateIndex]),   // makes a new date out of the date string format
            numbers
        }
    });
}



////////////// countdown ///////////////////////////////////////////////////////////////////////////////////////////

function findNextDrawing(drawingName, date) {
    const today = new Date();
    if (date.getDay() === today.getDay()) {
        return today;
    }
    let nextDay = 0;
    const lastDay = date.getDay();
    switch (drawingName) {
        case POWERBALL:
            if (lastDay === 6) {
                nextDay = 3;
            }
            else if (lastDay === 3) {
                nextDay = 6;
            }
            break;
        case MEGAMILLIONS:
            if (lastDay === 5) {
                nextDay = 2;
            }
            else if (lastDay === 2) {
                nextDay = 5;
            }
            break;
        default:
            return today;
    }
    while (date.getDay() !== nextDay) {
        console.log(new Date(date.setDate(date.getDate() + 1)));
    }
    return date;
}

/////// HISTORY //////////////////////////////////////////////////////////////////////////////////////////////////////

function generateHistorySection(drawingName, drawings) {
    return `
        <section role="region" class="${drawingName.toLowerCase()}historysection hidden">    
          <h3>${drawingName} History</h3>
          <br>
            <ul class="historystyle">
                ${drawings.map(generateHistoryItem).join("\n")}
            </ul>
          <br>
            <a id="historyexit" class="historyexitstyle"><h3>Exit</h3></a>
         <section>
    `
}

function generateHistoryItem(drawing) {
    const region = "en-US";
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }
    return `
    <li class="historyitemstyle">
        <h3>${drawing.date.toLocaleDateString(region, options)}</h3>
             ${generateNumbersList(drawing.numbers, drawing.name)}
    </li>
    `
}

////// GENERATE  //////////////////////////////////////////////////////////////////////////////////////////////////////

function generateNumbersList(numbers, drawingName) {
    // need to use double quotes.  single quotes dont interpret so it would be a backslash and n, not a new line.
    const numberList = numbers.map(number => { return `<li class="numberitem">${number}</li>` }).join("\n");
    return `
    <ul class="numberslist ${drawingName.toLowerCase()}numbers">
        ${numberList}
    </ul>
    `
}

function generateLogoSection() {
    return `
    <header role="banner" class="logocontainer">
        <div class="logo"></div>
    </header>
    `
}

function generateDrawingItem(drawing) {
    const numberList = generateNumbersList(drawing.numbers, drawing.name);
    const countDown = generateCountDown(drawing.name, drawing.date);
    return `
        <h2 class="${drawing.name.toLowerCase()}name">${drawing.name}</h2>
            ${numberList}
            ${countDown}
        <div class="${drawing.name.toLowerCase()}history historyhover">
            <a id="${drawing.name.toLowerCase()}historylink" class="historystyle">History</a>
        </div>
    `
}

function generateNumberSection(drawings) {
    return `
    <section role="region" class="numbersection ${drawings[0].name.toLowerCase()}container">          
            ${generateDrawingItem(drawings[0])}     
    </section>
    ${generateHistorySection(drawings[0].name, drawings)}
    `
}

function generateCountDown(drawingName, drawingDate) {
    const today = new Date();
    const nextDrawing = findNextDrawing(drawingName, drawingDate);
    const difference = nextDrawing - today;
    console.log(today);
    console.log(nextDrawing);
    console.log(difference);
    const daysLeft = Math.ceil(difference / (1000 * 60 * 60 * 24));
    const message = daysLeft > 0 ? `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "today";
    return `
    <div class="countdown ${drawingName.toLowerCase()}nextdrawing">
        <span class="days">Next draw is ${message}</span>
    </div>
    `
}

///// Intro page ///////////////////////////////////////////////////////////////////////////////////

function generateFooterSection() {
    return `
    <footer role="contentinfo" class="footercontainer">
        <div class="landingwindow">    
            <h1>Lotto Brainy</h1>
            <section role="region" class="landinginfo">
            <p>Welcome to Lotto Brainy, an app that brings together handy information about two popular lotteries, Powerball and MegaMillions. But what can Lotto Brainy do for you?</p>      
            <p>Lotto Brainy shows the most current drawing!</p>
            <p>Within each lottery section, you'll find the most current lottery drawing, including the winning numbers, powerball or megaball, and the respective multiplers.</p>
            <p>Lotto Brainy tells when the next drawing is!</p>
            <p>Since both lotteries draw twice a week on different days, this app has conveniently provides a daily countdown.</p>
            <p>Lotto Brainy shows a list of previous draws!</p>
            <p>If you need to find out the previous drawing numbers, Lotto Brainy provides all information from the last 8 drawings. Just click the "History" link to get the details!</p>
            <a id="landingexit" class="landingexitstyle">Start the App!</a>
            </section>
        </div>
        <a id="landingenter" class="footerstyle footerstyleenter">Learn more about this app</a>
    </footer>
    `
}



///// DISPLAY FUNCTIONS /////////////////////////////////////////////////////////////////////////////////////////////

// Takes the data (from getLotteryDataFromApi), we display the data on the page.
// The current layout has three sections, a logo section, a numbers section, and the footer.
// note: the "main" slot is basically to display the information
function displayMainPage(drawings) {
    const main = $('main')
    // this empties it out so that we can do a bunch of appends
    main.empty();                                        
    displayLogo(main);
    displayNumberSection(drawings, main);                 
    displayFooter(main);
}


// appends the logo section
function displayLogo(container) {
    $(container).append(generateLogoSection());
}

// splits the drawings into two different containers?
function displayNumberSection(drawings, container, append = true) {
    const splitDrawings = splitDrawingsByName(drawings);
    Object.keys(splitDrawings).forEach(splitDrawing => {
        appendOrReplace(splitDrawings[splitDrawing].reverse(), container, generateNumberSection, append);
    });
}

// append the display section
function displayFooter(container) {
    $(container).append(generateFooterSection());
}


// splits drawings
function splitDrawingsByName(drawings) {
    let splitDrawings = {};
    for (let i = 0; i < drawings.length; i++) {
        if (drawings[i].name in splitDrawings) {
            splitDrawings[drawings[i].name].push(drawings[i]);
        } else {
            splitDrawings[drawings[i].name] = [drawings[i]];
        }
    }
    return splitDrawings;
}

// reuseable - takes a buch of items, runs the generator on the item, and if true adds to the container, if false replaces the contents of container.
function appendOrReplace(items, container, generator, append = true) {
    const html = generator(items);
    if (append) {
        container.append(html);
    } else {
        container.html(html);
    }
}







////////////////
// Obsolete? ///
////////////////
// function displayNumbersList(numbers, container) {
//     container.html(generateNumbersList(numbers));
// }

/////// EVENT HANDLERS ///////////////////////////////////////////////////////////////////////////////////

function handleEnterLandingPage() {
    $('main').on('click', '#landingenter', function (event) {
        $('.landingwindow').removeClass('hidden');
    });
}

function handleExitLandingPage() {
    $('main').on('click', '#landingexit', function (event) {
        $('.landingwindow').addClass('hidden');
    });
}

function handleReturnFromPowerballHistory() {
    $('main').on('click', '#historyexit', function (event) {
        $('.powerballhistorysection').addClass('hidden');
    });
}

function handleReturnFromMegaMillionsHistory() {
    $('main').on('click', '#historyexit', function (event) {
        $('.megamillionshistorysection').addClass('hidden');
    });
}

function handleMegaMillionsHistory() {
    $('main').on('click', '#megamillionshistorylink', function (event) {
        $('.megamillionshistorysection').removeClass('hidden');
    });
}

function handlePowerBallHistory() {
    $('main').on('click', '#powerballhistorylink', function (event) {
        $('.powerballhistorysection').removeClass('hidden');
    });
}

///// INITIALIZATION //////////////////////////////////////////////////////////////////////////////////////////

function setUpEventHandlers() {
    handleEnterLandingPage();
    handleExitLandingPage();
    handleReturnFromPowerballHistory();
    handleReturnFromMegaMillionsHistory();
    handleMegaMillionsHistory();
    handlePowerBallHistory();
}

// the function that starts the app
function initalize() {
    setUpEventHandlers();
    getLotteryDataFromApi();
}

// initial callback to start the app (entry point -- because it starts everything)
$(initalize);