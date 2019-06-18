"use strict";

// put your own value below!
const apiKey = "";
const searchURL = "";

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
    for (let i = 0; i < responseJson.data.length; i++) {
        // for each park in the data
        //array, add a list item to the results
        //list with the park name, description,
        //and url
        $("#results-list").append(
            `<li><h3>${responseJson.data[i].fullName}</h3>
      <p>${responseJson.data[i].description}</p>
      <a href='${responseJson.data[i].url}' target="_blank">${responseJson.data[i].url}</a>
      </li>`
        );
    }
    //display the results section
    $("#results").removeClass("hidden");
}

function getNatParks(state, limit = 10) {
    const params = {
        api_key: apiKey,
        stateCode: state,
        limit
    };
    const queryString = formatQueryParams(params);
    const url = searchURL + "?" + queryString;

    console.log(url);

    fetch(url)
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

function parseStateSelection() {
    const stateList = [];
    $("#js-search-state > option:selected").each( function() {
        stateList.push( this.value );
    })
    return stateList.join(",");
    
}

function watchForm() {
    $("form").submit(event => {
        event.preventDefault();
        const searchState = parseStateSelection();
        const maxResults = $("#js-max-results").val();
        getNatParks(searchState, maxResults);
    });
}

$(watchForm);
