"use strict";

const dogOptions = {
    age: {
        puppy: "Puppy (under 1 year old)",
        young: "Young (1 year old)",
        adult: "Adult (2-6 years old)",
        senior: "Senior (over 7 years old)"
    },
    caretaker: {
        petfinder: "Shelter/Rescue",
        getYourPet: "Owner"
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

const api = {
    results: [],
    petfinder: {
        displaySearch: true,
        client: new petfinder.Client( { // Petfinder JS SDK client to perform API calls
                apiKey: "JI9fv1y8atpa4x8Rw3MsC1oOXADcFk13dptH2digjtnRbTgWp2", 
                secret: "N9mNCi9sVSp6EOKfvygtvWdTdYjaEv62TUm8Jbyn"}),
        searchParams: {
            type: "Dog",
            status: "adoptable",
            location: "95814",
            distance: 25,
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
                SearchRadiusInMiles: 25,
                PageNumber: 1,
                OrderBy: "distance",
            }
        }
    }
};

function formatQueryParams(params) {
    const queryItems = Object.keys(params).map(
        key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    );
    return queryItems.join("&");
}

function displayResults() {
    // if there are previous results, remove them
    console.log(api.results);
    $("#results-list").empty();

    //iterate through the items array
    for (let i = 0; i < api.results.length; i++) {
        // for each park in the data
        //array, add a list item to the results
        //list with the park name, description,
        //and url
        $("#results-list").append(
            `<li>
                <h3>${api.results[i].name}</h3>
                <img src='${api.results[i].photoURL}' alt='Picture of ${api.results[i].name}'>
                <button>View Details</button>
            </li>`
        );
    }

    //display the results section
    $("#results").removeClass("hidden");
    $(".additionalSearch").removeClass("hidden");
}

function processPetFinderResults( responseJson ) {
    responseJson.data.animals.forEach( pet => api.results.push({
        caretaker: dogOptions.caretaker.petfinder,
        id: pet.id,
        name: pet.name,
        breed: pet.breeds.primary,
        gender: pet.gender,
        age:  pet.age === "Baby" ? dogOptions.age.puppy : 
            ( pet.age === "Young" ? dogOptions.age.young : 
            ( pet.age === "Senior" ? dogOptions.age.senior : dogOptions.age.adult ) ),
        size: pet.size === "Small" ? dogOptions.size.small : 
            ( pet.size === "Medium" ? dogOptions.size.medium : 
            ( pet.size === "Large" ? dogOptions.size.large : dogOptions.size.xlarge ) ),
        photoURL: pet.photos[0].medium
    }));
        
    console.log(responseJson.data.animals);
}

function processGetYourPetResults( responseJson ) {
    responseJson.forEach( pet => api.results.push( {
        caretaker: dogOptions.caretaker.getYourPet,
        id: pet.PetId,
        name: pet.Name,
        breed: pet.BreedsForDisplay,
        gender: pet.Gender,
        age:  pet.AgeYears === 0 ? dogOptions.age.puppy : 
            ( pet.AgeYears === 1 ? dogOptions.age.young : 
            ( pet.AgeYears > 6 ? dogOptions.age.senior : dogOptions.age.adult ) ),
        size: pet.Size === "s (11lbs. to 20lbs.)" || pet.Size === "xs (10lbs. or less)" ? dogOptions.size.small :
            ( pet.Size === "m (21lbs. to 40lbs.)" ? dogOptions.size.medium : 
            ( pet.Size === "xl (over 75lbs.)" ? dogOptions.size.xlarge : dogOptions.size.large ) ),
        photoURL: pet.PrimaryPhotoUrl
    }));
        
    console.log(responseJson);
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
    readGender();
    readSize();
    readZipCode();
}

function watchForm() {
    $(".searchForm").submit(event => {
        event.preventDefault();
        readFilters();
        getPetList();
    });
}

function startDogsWorld() {
   
    watchForm();

}

$(startDogsWorld);
