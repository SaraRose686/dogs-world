"use strict";

/* Filter options used to display and map to API */
const dogOptions = {
    age: {
        puppy: "Puppy (under 1 year old)",
        young: "Young (1 year old)",
        adult: "Adult (2-6 years old)",
        senior: "Senior (over 7 years old)"
    },
    caretaker: {
        petfinder: ["Shelter/Rescue", "petfinder"],
        getYourPet: ["Owner", "getYourPet"]
    },
    size: {
        small: "Small",
        medium: "Medium",
        large: "Large",
        xlarge: "X-Large"
    },
    filter: {
        getYourPet : {
            age: {
                baby: [0, 1],
                young: [1, 2],
                adult: [2, 7],
                senior: [7, 20]
            },
            size: [ "extrasmall", "small", "medium", "large", "extralarge"],
        }
    }
};

/* API details */
const api = {
    results: [],
    pagination: {
        totalPages: 1,
        currentPage: 1
    },
    petfinder: {
        displaySearch: true,
        client: new petfinder.Client( { // Petfinder JS SDK client to perform API calls
                apiKey: "JI9fv1y8atpa4x8Rw3MsC1oOXADcFk13dptH2digjtnRbTgWp2", 
                secret: "N9mNCi9sVSp6EOKfvygtvWdTdYjaEv62TUm8Jbyn"}),
        searchParams: {
            type: "Dog",
            status: "adoptable",
            location: "95814",
            distance: 10,
            sort: "distance",
            page: 1,
            limit: 26,
        }
    },
    getYourPet: {
        displaySearch: true,
        search: {
            url: "https://cors-anywhere.herokuapp.com/https://getyourpet.com/api/partnerpetsearch",
            data: {
                method: "POST",
                body: null,
                headers: { 
                    "Content-Type": "application/json",
                },
            },
            params: {
                PetType: "dog",
                ZipCode: "95814",
                SearchRadiusInMiles: 10,
                PageNumber: 1,
                OrderBy: "distance",
            }
        }
    }
};

function displayDetails( petId, petIndex ) {
    let dog = api.results[petIndex];
    $(`#${petId} .dogInfo`).html(`
        <h3 class="dogName">${dog.name}</h3>
        <p>
        <strong>${dog.breed} | ${dog.gender} <br> ${dog.size} | ${dog.age}</strong><br>
        ${dog.goodWith ? "<strong>Good With: </strong>" + dog.goodWith + "<br>" : "" }
        ${dog.story ? "<strong>Story: </strong>" + dog.story + "<br>" : "" }
        <strong>Caretaker: </strong>${dog.caretaker[0]}<br>
        <strong>City, State: </strong>${dog.cityState}<br>
        <a><a href="${dog.url}" target="_blank">More about ${dog.name}</a></a></p>`
    );
    $(`#${petId} .dogCard`).addClass('flipped');
}

function processPetFinderDetails( responseJson ) {
    const pet = responseJson.data.animal;
    const petIndex = api.results.findIndex( dog => dog.id === pet.id );
    let dog = api.results[petIndex];
    dog.breed = pet.breeds.primary;
    dog.gender = pet.gender;
    dog.age = pet.age === "Baby" ? dogOptions.age.puppy : 
            ( pet.age === "Young" ? dogOptions.age.young : 
            ( pet.age === "Senior" ? dogOptions.age.senior : dogOptions.age.adult ) );
    dog.size = pet.size === "Small" ? dogOptions.size.small : 
            ( pet.size === "Medium" ? dogOptions.size.medium : 
            ( pet.size === "Large" ? dogOptions.size.large : dogOptions.size.xlarge ) );
    dog.cityState = pet.contact.address.city + ", " + pet.contact.address.state;
    let goodWithList = [];
    Object.entries(pet.environment).forEach(([key, value]) => {
        if(value) {
            goodWithList.push(key);
        }
    });
    dog.goodWith = goodWithList.join(", ");
    dog.story = pet.description; 
    dog.url = pet.url;
    dog.htmlId = dog.id + '_' + dog.caretaker[1];
    dog.displayDetails = true;
    
    displayDetails( dog.htmlId, petIndex );
}

function processGetYourPetDetails( pet ) {
    const petIndex = api.results.findIndex( dog => dog.id === pet.PetId );
    let dog = api.results[petIndex];
    dog.breed = pet.BreedsForDisplay;
    dog.gender = pet.Gender === "male" ? "Male" : "Female";
    dog.age = pet.AgeYears === 0 ? dogOptions.age.puppy : 
            ( pet.AgeYears === 1 ? dogOptions.age.young : 
            ( pet.AgeYears > 6 ? dogOptions.age.senior : dogOptions.age.adult ) );
    dog.size = pet.Size === "s (11lbs. to 20lbs.)" || pet.Size === "xs (10lbs. or less)" ? dogOptions.size.small :
            ( pet.Size === "m (21lbs. to 40lbs.)" ? dogOptions.size.medium : 
            ( pet.Size === "xl (over 75lbs.)" ? dogOptions.size.xlarge : dogOptions.size.large ) );
    dog.cityState = pet.City + ", " + pet.State;
    dog.goodWith = pet.GoodWith.join(", ");
    dog.story = pet.Story.length > 150 ? pet.Story.slice(0, 149).padEnd(152,".") : pet.Story;
    dog.url = pet.ProfileUrl;
    dog.htmlId = dog.id + '_' + dog.caretaker[1];
    dog.displayDetails = true;
    
    displayDetails( dog.htmlId, petIndex );
}

function getPetDetails( id, source ){
    const petIndex = api.results.findIndex( dog => dog.id === id );
    let dogResult = api.results[petIndex];
    
    // Check whether results are already stored
    if( dogResult.displayDetails === undefined ) {
        if( source === dogOptions.caretaker.getYourPet[1] ) {
            const url = api.getYourPet.search.url + "/" + id + "?" + 
                "zipCode=" + api.getYourPet.search.params.ZipCode;
            fetch(url)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error(response.statusText);
                })
                .then(responseJson => processGetYourPetDetails(responseJson))
                .catch(err => {
                    $("#js-error-message").text(`Something went wrong: ${err.message}`);
                    $("#js-error-message").removeClass("hidden");
            });
        }
        else if( source === dogOptions.caretaker.petfinder[1] ) {
            api.petfinder.client.animal.show(id)
                .then(responseJson => processPetFinderDetails(responseJson))
                .catch(err => {
                    $("#js-error-message").text(`Something went wrong: ${err.message}`);
                    $("#js-error-message").removeClass("hidden");
            });
        }
    }
    if( dogResult.displayDetails ) {
        dogResult.displayDetails = false;
        $(`#${dogResult.htmlId} > .dogCard`).removeClass('flipped');

    }
    else {
        dogResult.displayDetails = true;
        $(`#${dogResult.htmlId} > .dogCard`).addClass('flipped');
    }
}

function displayResults() {
    // if there are previous results, remove them
    $(".js-results-pagination").empty();
    $("#js-results-list").empty();

    if(api.results.length > 0) {
        // Update pagination
        $(".js-results-pagination").html(`
            <button class="prevSubmit" aria-label="Previous" onclick="handlePrevSearch()" ${api.pagination.currentPage > 1 ? "" : "disabled"}>< Previous</button>
            <span class="pages">Page ${api.pagination.currentPage} of ${api.pagination.totalPages} </span>
            <button class="nextSubmit" aria-label="Next" onclick="handleNextSearch()" ${api.pagination.currentPage < api.pagination.totalPages ? "" : "disabled"}>Next ></button>
        `);

        //iterate through the items array
        for (let i = 0; i < api.results.length; i++) {
            $("#js-results-list").append(`
                <li class="dogItem" aria-labelledby="${api.results[i].id}Name" aria-live="polite" id='${api.results[i].id}_${api.results[i].caretaker[1]}'>
                    <div role="none" class="dogCard">
                        <div role="none" class="dogLink" onclick="getPetDetails(${api.results[i].id}, '${api.results[i].caretaker[1]}');" >
                            <h3 tabindex="0" id="${api.results[i].id}Name" class="dogName">${api.results[i].name}</h3>
                            <img class="dogImage" src="${api.results[i].photoURL}" alt="Picture of ${api.results[i].name}">
                        </div>
                        <div role="none" class="dogInfo" onclick="getPetDetails(${api.results[i].id}, '${api.results[i].caretaker[1]}');"></div>
                    </div>
                </li>`
            );
        }
    }
    else {
        $("#js-results-list").append(`
            <h3>No results found. Please adjust your search.</h3>`
        );
    }
    
    //display the results section
    $("#js-results").removeClass("hidden");
    $(".additionalSearch").removeClass("hidden");
    $(".searchSubmit").val("Search");
    $(".searchSubmit").prop("disabled", false);
}

function processPetFinderResults( responseJson ) {
    responseJson.data.animals.forEach( pet => api.results.push( {
        caretaker: dogOptions.caretaker.petfinder,
        id: pet.id,
        name: pet.name,
        photoURL: pet.photos.length > 0 ? pet.photos[0].large : "https://www.rspcansw.org.au/wp-content/themes/noPhotoFound.png"
    }));

    // Allow pagination for Petfinder results
    api.pagination.currentPage = responseJson.data.pagination.current_page;
    api.pagination.totalPages = responseJson.data.pagination.total_pages;
}

function processGetYourPetResults( responseJson ) {
    responseJson.forEach( pet => api.results.push( {
        caretaker: dogOptions.caretaker.getYourPet,
        id: pet.PetId,
        name: pet.Name,
        photoURL: pet.PrimaryPhotoUrl
    }));

    // Only allow 1 page if only displaying GetYourPet results
    if(! api.petfinder.displaySearch ) {
        api.pagination.currentPage = 1;
        api.pagination.totalPages = 1;
    }
}

function getPetList() {
    // clear all current results
    api.results.length = 0;

    // Search Petfinder
    const petfinderRequest = api.petfinder.client.animal.search(api.petfinder.searchParams);

    // Search Get Your Pet
    api.getYourPet.search.data.body = JSON.stringify(api.getYourPet.search.params);
    const getYourPetRequest = fetch(api.getYourPet.search.url, api.getYourPet.search.data)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        });

    // Don't display results until both APIs have returned
    Promise.all([ getYourPetRequest, petfinderRequest ])
        .then( responses => {
            if( api.getYourPet.displaySearch ) {
                processGetYourPetResults(responses[0]);
            }
            if( api.petfinder.displaySearch ) {
                processPetFinderResults(responses[1]);
            }
        })
        .then( () => displayResults())
        .catch(err => {
            $("#js-error-message").text(`Something went wrong: ${err.message}`);
            $("#js-error-message").removeClass("hidden");
        });
}

function cleanFilters() {
    api.getYourPet.displaySearch = true;
    api.petfinder.displaySearch = true;
    delete api.petfinder.searchParams.age;
    delete api.getYourPet.search.params.AgeYearsMin;
    delete api.getYourPet.search.params.AgeYearsMax;
    delete api.petfinder.searchParams.gender;
    delete api.getYourPet.search.params.Gender;
    delete api.petfinder.searchParams.size;
    delete api.getYourPet.search.params.SizeMin;
    delete api.getYourPet.search.params.SizeMax;
    api.getYourPet.search.params.PageNumber = 1;
    api.petfinder.searchParams.page = 1;
}

// Read user input on Age filter
function readAge() {
    const ageInput = [];
    $(".js-age:checked").each( function() {
        ageInput.push($(this).val());
    } );

    if( ageInput.length > 0 ) {
        api.petfinder.searchParams.age = ageInput.join();
        
        // create age search parameter for GetYourPet API
        for( let [ageKey, ageValue] of Object.entries(dogOptions.filter.getYourPet.age) ) {
            if( ageInput.includes(ageKey) ) {
                api.getYourPet.search.params.AgeYearsMin = 
                    api.getYourPet.search.params.AgeYearsMin < ageValue[0] ?
                    api.getYourPet.search.params.AgeYearsMin : ageValue[0];
                api.getYourPet.search.params.AgeYearsMax = 
                    api.getYourPet.search.params.AgeYearsMax > ageValue[1] ?
                    api.getYourPet.search.params.AgeYearsMax : ageValue[1];
            }
        }
    }
}

// Read user input on Caretaker filter
function readCaretaker() {
    const caretakerInput = [];
    $(".js-caretaker:checked").each( function() {
        caretakerInput.push($(this).val());
    } );
    
    if( caretakerInput.length === 1 ) {
        if(caretakerInput[0] === "getYourPet") {
            api.petfinder.displaySearch = false;
        }
        else {
            api.getYourPet.displaySearch = false;
        }
    }
}

// Read user input on Distance filter
function readDistance() {
    const distanceInput = $(".js-distance").val();
    if( distanceInput ) {
        api.getYourPet.search.params.SearchRadiusInMiles = distanceInput;
        api.petfinder.searchParams.distance = distanceInput;
    }
}

// Read user input on Gender filter
function readGender() {
    const genderInput = [];
    $(".js-gender:checked").each( function() {
        genderInput.push($(this).val());
    } );
    if( genderInput.length > 0 ) {
        api.petfinder.searchParams.gender = genderInput.join();
        api.getYourPet.search.params.Gender = genderInput.join();
    }
    
}

// Read user input on Size filter
function readSize() {
    const sizeInput = [];
    $(".js-size:checked").each( function() {
        sizeInput.push($(this).val());
    } );
    if( sizeInput.length > 0 ) {
        api.petfinder.searchParams.size = sizeInput.join();
        
        if( sizeInput.includes("small") ) {
            api.getYourPet.search.params.SizeMin = 
                dogOptions.filter.getYourPet.size[0];

            api.getYourPet.search.params.SizeMax = 
                dogOptions.filter.getYourPet.size[1];
        }
        if( sizeInput.includes("medium") ) {
            api.getYourPet.search.params.SizeMin = 
                api.getYourPet.search.params.SizeMin ?
                api.getYourPet.search.params.SizeMin : 
                dogOptions.filter.getYourPet.size[2];

            api.getYourPet.search.params.SizeMax =  
                dogOptions.filter.getYourPet.size[2];
        }
        if( sizeInput.includes("large") ) {
            api.getYourPet.search.params.SizeMin = 
                api.getYourPet.search.params.SizeMin ?
                api.getYourPet.search.params.SizeMin : 
                dogOptions.filter.getYourPet.size[3];

            api.getYourPet.search.params.SizeMax =  
                dogOptions.filter.getYourPet.size[3];
        }
        if( sizeInput.includes("xlarge") ) {
            api.getYourPet.search.params.SizeMin = 
                api.getYourPet.search.params.SizeMin ?
                api.getYourPet.search.params.SizeMin : 
                dogOptions.filter.getYourPet.size[4];

            api.getYourPet.search.params.SizeMax =  
                dogOptions.filter.getYourPet.size[4];
        }
    }
}

// Read user input on Zip-code filter
function readZipCode() {
    const zipInput = $(".js-zip-code").val();
    api.getYourPet.search.params.ZipCode = zipInput;
    api.petfinder.searchParams.location = zipInput;
}

function readFilters() {
    cleanFilters();
    readAge();
    readCaretaker();
    readDistance();
    readGender();
    readSize();
    readZipCode();
}

function handleSearchForm() {
    $(".searchForm").submit(event => {
        event.preventDefault();
        $("#js-error-message").addClass("hidden");
        $(".searchSubmit").val("Searching...");
        $(".searchSubmit").prop("disabled", true);
        readFilters();
        getPetList();
    });
}

function handleNextSearch() {
    $("#js-error-message").addClass("hidden");
    api.getYourPet.search.params.PageNumber++;
    api.petfinder.searchParams.page++;
    getPetList();
}

function handlePrevSearch() {
    $("#js-error-message").addClass("hidden");
    api.getYourPet.search.params.PageNumber--;
    api.petfinder.searchParams.page--;
    getPetList();
}

// Customization is necessary since checkboxes are not navigable.
// Also handles flipping card for accessibility
function handleKeyCommands() {
    $(document).keydown( event => {
        const keycode = (event.key ? event.key : event.which);
        // Selecting options in search form
        let focusedLabel = $(".js-option:focus");
        const prevInput = focusedLabel.prev("input[type='checkbox']");
        if( prevInput.val() != null ) {
            switch(keycode) {
                case "Enter":
                case " ":
                    // Select the current answer
                    prevInput.prop( "checked", ( i, val ) => !val );
                    break;
                default:
            }
        }
        else {
            focusedLabel = $(".dogName:focus");
            if(focusedLabel) {
                switch(keycode) {
                    case "Enter":
                    case " ":
                        focusedLabel.parent().trigger("click");
                        break;
                    default:
                }
            }
        }
    }); 
}

function runDogsWorld() {
    handleSearchForm();
    handleKeyCommands()
}

$(runDogsWorld);


