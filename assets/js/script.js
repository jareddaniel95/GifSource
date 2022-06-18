// API keys
var wordsAPIkey = '739c50b3f7mshd67eedcf81ee582p110fb9jsn185672be3425';
var gihpyAPIkey = 'dAe5PgSXuoKvQSNB3cId7sn0DyvMK9VK';

// Words to avoid with Words API
var synonymBlacklist = ['a', 'an', 'the', 'is', 'to', 'on', 'or', 'as', 'at', 'in', 'for', 'by', 'with'];

// Get DOM elements
var content = $('#content');
var searchField = $('input[name="input"]');
var buttonSearch = $('#search');
var searchBox = $('#searchbox');
var historyItems = $('#historyItems');
var loadingIcon = $('#loading-icon');
var recentSearchesHeader = $('#recent-searches-h');
var searchResultsHeader = $('#search-results-h');

// Get recent searches from local storage on page load if they exist
var pastGiphyResponses = JSON.parse(localStorage.getItem("PastGiphyResponses"));
if (pastGiphyResponses) {
    recentSearchesHeader.removeClass('hide');
    pastGiphyResponses.forEach(pastResponse => {
        addHistoryItem(pastResponse);
    })
}

// Listen for search button click
buttonSearch.on('click', searchGifs);

// Listen for press enter
searchField.keypress(async function(e) {
    // KeyCode 13 -> ENTER
    if (e.keyCode == 13) {
        searchGifs();
    }
});

// Listen for click on history item
historyItems.on('click', function(event) {
    var itemClicked = $(event.target);
    if (itemClicked.hasClass('custom-border')) {
        searchField.val(itemClicked.text());
        searchGifs();
    }
});

async function searchGifs() {
    // Ignore when text field empty
    if (searchField.val().trim() === '') {
        return false;
    }

    // Remove old search results
    content.empty();
    // Hid search results header
    searchResultsHeader.addClass('hide');
    // Show loading icon
    loadingIcon.removeClass('hide');

    // Convert user input to array of words
    var inputWords = searchField.val().split(' ');
    // Query giphy API on user input
    var firstGiphyResponse = await getGifsFromWord(searchField.val());
    // Giphy response from user input
    var standardGiphyResponse = null;
    // Giphy responses from fuzzy algorithm
    var altGiphyResponses = [];
    if (firstGiphyResponse != null && firstGiphyResponse.data != null && firstGiphyResponse.data.length > 0) {
        standardGiphyResponse = firstGiphyResponse.data;
    }
    // CASE 1 - one word search
    if (inputWords.length == 1) {
        // Get synonyms of word
        var wordsResponse = await getSimilarWords(searchField.val());
        if (wordsResponse != null) {
            var synonyms = wordsResponse.synonyms;
            // For each synonym in response, call giphy API on that synonym
            for (var i = 0; i < Math.min(synonyms.length, 10); ++i) {
                var giphyResponse = await translateWordToGif(synonyms[i]);
                if (giphyResponse != null && giphyResponse.data != null) {
                    altGiphyResponses.push(giphyResponse.data);
                }
            }
        }
    }
    // CASE 2 - multi-word search
    else if(inputWords.length > 1) {
        // For each word in user input
        for (var k = 0; k < Math.min(inputWords.length, 4); ++k) {
            // Ignore word if it is in blacklist
            if (!synonymBlacklist.includes(inputWords[k])) {
                // Get synonyms of word
                var wordsResponse = await getSimilarWords(inputWords[k]);
                if (wordsResponse != null) {
                    var synonyms = wordsResponse.synonyms;
                    // For each synonym (given a max based on input word count)
                    for (var i = 0; i < Math.min(synonyms.length, Math.max(6 - inputWords.length, 2)); ++i) {
                        // Build query string, replacing words with synonyms
                        var query = '';
                        for (var j = 0; j < inputWords.length; ++j) {
                            if (j == k) {
                                query += synonyms[i] + ' ';
                            } else {
                                query += inputWords[j] + ' ';
                            }
                        }
                        var giphyResponse = await translateWordToGif(query.trim());
                        if (giphyResponse != null && giphyResponse.data != null) {
                            altGiphyResponses.push(giphyResponse.data);
                        }
                    }
                }
            }
        }
    }
    // CASE 3 - empty search
    else {

    }

    // Hide loading icon
    loadingIcon.addClass('hide');
    // Show results header
    searchResultsHeader.removeClass('hide');

    // Render Gifs
    for (var i = 0; i < standardGiphyResponse.length; ++i) {
        var link = $('<a>');
        link.attr('href', standardGiphyResponse[i].url);
        var gif = $('<img>');
        gif.addClass('result-gif');
        gif.addClass('hoverable');
        gif.attr('src', standardGiphyResponse[i].images.fixed_height.url);
        gif.attr('alt', standardGiphyResponse[i].title);
        link.append(gif);
        content.append(link);
    }

    for (var i = 0; i < altGiphyResponses.length; ++i) {
        if (altGiphyResponses[i]) {
            var link = $('<a>');
            link.attr('href', altGiphyResponses[i].url);
            var gif = $('<img>');
            gif.addClass('result-gif');
            gif.attr('src', altGiphyResponses[i].images.fixed_height.url);
            gif.attr('alt', altGiphyResponses[i].title);
            gif.addClass('hoverable');
            link.append(gif);
            content.append(link);
        }
    }

    // Create object to save to local storage
    var searchObj = {
        'searchValue': searchField.val().trim(),
        'response': standardGiphyResponse[0].images.fixed_height_small_still.url
    }
    // Load list from local storage
    var list = JSON.parse(localStorage.getItem("PastGiphyResponses"));
    // If nothing in local storage, initialize new array
    if (!list) {
        list = [];
    } else {
        // For each object in list
        for (var i = 0; i < list.length; ++i) {
            // If previous search term from list matches current search term
            if (convertToIdName(list[i].searchValue) == convertToIdName(searchObj.searchValue)) {
                // Remove item at i from list
                list.splice(i, 1);
                // Remove element from history
                historyItems.find(`#${convertToIdName(searchObj.searchValue)}`).remove();
            }
        }

        // If there are at least 8 history boxes
        if (list.length >= 8) {
            // Remove first (oldest) item from list
            var removedItem = list.shift();
            // Remove element from history
            historyItems.find(`#${convertToIdName(removedItem.searchValue)}`).remove();
        }
    }
    // Add new serach object to list
    list.push(searchObj);
    // Save list to local storage
    localStorage.setItem("PastGiphyResponses", JSON.stringify(list));
    // Show recent searches header if it's hidden
    recentSearchesHeader.removeClass('hide');
    // Add item to history section
    addHistoryItem(searchObj);
}

// Add a block to historyItems section
function addHistoryItem(pastResponse) {
    var newItem = $('<div>');
    newItem.attr("id", convertToIdName(pastResponse.searchValue));
    newItem.attr("class", "custom-border m-2 hoverable");
    newItem.attr("style", `width: 200px; height: 175px; display: flex; background-image: url(${pastResponse.response}); background-repeat: no-repeat; background-size: 100% 100%;`);
    var historyName = $('<h3>');
    historyName.attr("class", "text-center mb-0 historyHeader");
    historyName.attr("style", "align-self: flex-end; width: 100%;");
    historyName.text(pastResponse.searchValue);
    newItem.append(historyName);
    historyItems.append(newItem);
}

// Query Words API
async function getSimilarWords(input) {
    var wordsQuery = `https://wordsapiv1.p.rapidapi.com/words/${input}/synonyms?rapidapi-key=${wordsAPIkey}`;
    let result = fetch(wordsQuery)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            return null;
        })
        .then(function (data) {
            return data;
        });
    return result;
}

// Query Giphy API (Search)
async function getGifsFromWord(input) {
    var gihpyQuery = `https://api.giphy.com/v1/gifs/search?api_key=${gihpyAPIkey}&q=${input}&limit=10`;
    let result = fetch(gihpyQuery)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            return null;
        })
        .then(function (data) {
            return data;
        });
    return result;
}

// Query Giphy API (Translate)
async function translateWordToGif(input) {
    var gihpyQuery = `https://api.giphy.com/v1/gifs/translate?api_key=${gihpyAPIkey}&s=${input}`;
    let result = fetch(gihpyQuery)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            return null;
        })
        .then(function (data) {
            return data;
        });
    return result;
}

// Remove whitespace, replace spaces with dashes, convert to lowercase
function convertToIdName(input) {
    return input.trim().split(" ").join("-").toLowerCase();
}