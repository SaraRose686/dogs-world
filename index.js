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
        xLarge: "X-Large"
    },
    filter: {
        petfinder: {
            size: ["small", "medium", "large", "xlarge"]
        },
        getYourPet : {
            size: {
                values: [ "extrasmall", "small", "medium", "large", "extralarge"],
                params: [ "SizeMin", "SizeMax"]
            }
        }
    }
};

const api = {
    results: [],
    petfinder: {
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
            </li>`
        );
    }

    //display the results section
    $("#results").removeClass("hidden");
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
            ( pet.size === "Large" ? dogOptions.size.large : dogOptions.size.xLarge ) ),
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
            ( pet.Size === "xl (over 75lbs.)" ? dogOptions.size.xLarge : dogOptions.size.large ) ),
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
            processGetYourPetResults(responses[0]);
            processPetFinderResults(responses[1]);
        })
        .then( () => displayResults())
        .catch(err => {
            $("#js-error-message").text(`Something went wrong: ${err.message}`);
        });
}

function updateZipCode() {
    const zipInput = $("#js-zip-code").val();
    api.getYourPet.search.params.ZipCode = zipInput;
    api.petfinder.searchParams.location = zipInput;
}


function watchForm() {
    $("form").submit(event => {
        event.preventDefault();
        updateZipCode();
        getPetList();
    });
}

function startDogsWorld() {
   
    watchForm();

}

$(startDogsWorld);
