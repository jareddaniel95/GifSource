var wordsAPIkey = '739c50b3f7mshd67eedcf81ee582p110fb9jsn185672be3425';
var gihpyAPIkey = 'dAe5PgSXuoKvQSNB3cId7sn0DyvMK9VK';

var synonymBlacklist = ['a', 'an', 'the', 'is', 'to', 'on', 'or', 'as', 'at', 'in', 'for', 'by', 'with'];

var content = $('#content');
var searchField = $('input[name="input"]');
var buttonSearch = $('#search');
var searchBox = $('#searchbox');
var historyItems = $('#historyItems');

var pastGiphyResponses = JSON.parse(localStorage.getItem("PastGiphyResponses"));
    if (pastGiphyResponses) {
        pastGiphyResponses.forEach(pastResponse => {
            addHistoryItem(pastResponse);
        })
    }

buttonSearch.on('click', async function() {
    
    // Get GIFs
    var inputWords = searchField.val().split(' ');
    var firstGiphyResponse = await getGifsFromWord(searchField.val());
    var standardGiphyResponse = null;
    var altGiphyResponses = [];
    console.log(searchField.val());
    console.log(firstGiphyResponse);
    if (firstGiphyResponse != null && firstGiphyResponse.data != null && firstGiphyResponse.data.length > 0) {
        standardGiphyResponse = firstGiphyResponse.data;
    }
    console.log("data length: " + firstGiphyResponse.data.length);
    console.log("input length: " + searchField.val().split(' ').length);
    // CASE 1 - one word search
    if (inputWords.length == 1) {
        var wordsResponse = await getSimilarWords(searchField.val());
        if (wordsResponse != null) {
            var synonyms = wordsResponse.synonyms;
            for (var i = 0; i < Math.min(synonyms.length, 10); ++i) {
                var giphyResponse = await translateWordToGif(synonyms[i]);
                console.log(giphyResponse);
                if (giphyResponse != null && giphyResponse.data != null) {
                    altGiphyResponses.push(giphyResponse.data.images);
                }
            }
        }
    }
    // CASE 2 - multi-word search
    else if(inputWords.length > 1) {
        for (var k = 0; k < Math.min(inputWords.length, 4); ++k) {
            if (!synonymBlacklist.includes(inputWords[k])) {
                // Search synonyms
                var wordsResponse = await getSimilarWords(inputWords[k]);
                if (wordsResponse != null) {
                    var synonyms = wordsResponse.synonyms;
                    for (var i = 0; i < Math.min(synonyms.length, Math.max(6 - inputWords.length, 2)); ++i) {
                        var query = '';
                        for (var j = 0; j < inputWords.length; ++j) {
                            if (j == k) {
                                query += synonyms[i] + ' ';
                            } else {
                                query += inputWords[j] + ' ';
                            }
                        }
                        var giphyResponse = await translateWordToGif(query.trim());
                        console.log(query);
                        console.log(giphyResponse);
                        if (giphyResponse != null && giphyResponse.data != null) {
                            altGiphyResponses.push(giphyResponse.data.images);
                        }
                    }
                }
            }
        }
    }
    // CASE 3 - empty search
    else {
        console.log("Nothing here");
    }
    console.log(altGiphyResponses);
    content.empty();

    // Render Gifs
    for (var i = 0; i < standardGiphyResponse.length; ++i) {
        var gif = $('<img>');
        gif.addClass('result-gif');
        gif.attr('src', standardGiphyResponse[i].images.fixed_height.url);
        gif.attr('alt', `Result ${i}`);
        content.append(gif);
    }

    for (var i = 0; i < altGiphyResponses.length; ++i) {
        var gif = $('<img>');
        gif.addClass('result-gif');
        gif.attr('src', altGiphyResponses[i].fixed_height.url);
        gif.attr('alt', `Result ${i}`);
        content.append(gif);
    }

    // Save to local storage
    var searchObj = {
        'searchValue': searchField.val(),
        'response': standardGiphyResponse[0].images.fixed_height_small_still.url
    }
    var list = JSON.parse(localStorage.getItem("PastGiphyResponses"));
    console.log(list);
    if (!list) {
        list = [];
    } else {
        if (list.length >= 8) {
            var removedItem = list.shift();
            var prevSearch = $(`#historyItems div:contains(${removedItem.searchValue})`);
            //historyItems.remove(prevSearch); // Not working?
            prevSearch.attr('style', 'display: none;');
        }
    }
    list.push(searchObj);
    localStorage.setItem("PastGiphyResponses", JSON.stringify(list));

    addHistoryItem(searchObj);
    
});

function addHistoryItem(pastResponse) {
    var newCol = $('<div>');
    newCol.addClass("col");
    newCol.attr("class", "border custom-border m-2");
    newCol.attr("style", `width: 200px; height: 200px; display: flex; background-image: url(${pastResponse.response}); background-repeat: no-repeat; background-size: 100% 100%;`);
    var historyName = $('<h2>');
    historyName.attr("class", "text-center mb-0 historyHeader");
    historyName.attr("style", "align-self: flex-end; width: 100%;");
    historyName.text(pastResponse.searchValue);
    newCol.append(historyName);
    historyItems.append(newCol);
}

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
            console.log(data);
            return data;
        });
    return result;
}

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