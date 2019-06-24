"use strict";

const api = {
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
            url: "https://getyourpet.com/api/partnerpetsearch",
            data: {
                method: "POST",
                body: null,
                headers: { 
                    "Content-Type": "application/json",
                    //"Access-Control-Allow-Origin:": "http://localhost:5500/"
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

function displayResults(responseJson) {
    // if there are previous results, remove them
    console.log(responseJson);
    $("#results-list").empty();

    // iterate through the items array
    // for (let i = 0; i < responseJson.data.length; i++) {
    //     // for each park in the data
    //     //array, add a list item to the results
    //     //list with the park name, description,
    //     //and url
    //     $("#results-list").append(
    //         `<li><h3>${responseJson.data[i].fullName}</h3>
    //   <p>${responseJson.data[i].description}</p>
    //   <a href='${responseJson.data[i].url}' target="_blank">${responseJson.data[i].url}</a>
    //   </li>`
    //     );
    // }

    //display the results section
    $("#results").removeClass("hidden");
}

function getPetList() {
    
    // Search Petfinder
    api.petfinder.client.animal.search(api.petfinder.searchParams)
        .then( response => displayResults(response))
        .catch( error => {
            // Handle the error
            $("#js-error-message").text(`Something went wrong: ${error.message}`);
        });

    // Search Get Your Pet
    api.getYourPet.search.data.body = JSON.stringify(api.getYourPet.search.params);
    fetch(api.getYourPet.search.url, api.getYourPet.search.data)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayResults(responseJson))
        .catch(err => {
            $("#js-error-message").text(`Something went wrong: ${err.message}`);
        });
}

function watchForm() {
    $("form").submit(event => {
        event.preventDefault();
        getPetList();
    });
}

$(watchForm);
