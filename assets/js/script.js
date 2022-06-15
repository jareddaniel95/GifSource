var wordsAPIkey = '739c50b3f7mshd67eedcf81ee582p110fb9jsn185672be3425';
var gihpyAPIkey = 'dAe5PgSXuoKvQSNB3cId7sn0DyvMK9VK';

var synonymBlacklist = ['a', 'an', 'the', 'is', 'to', 'on', 'or', 'as', 'at', 'in', 'for', 'by', 'with'];

var content = $('#content');
var searchField = $('input[name="input"]');
var buttonSearch = $('#search');

buttonSearch.on('click', async function() {
    // var wordsResponse = await getSimilarWords(searchField.val());
    var firstGiphyResponse = await getGifs(searchField.val());
    var giphyResponses = [];
    console.log(firstGiphyResponse);
    if (firstGiphyResponse != null) {
        giphyResponses.push(firstGiphyResponse.data);
    }
    console.log("data length: " + firstGiphyResponse.data.length);
    console.log("input length: " + searchField.val().split(' ').length);
    if (firstGiphyResponse.data.length <= 10 || searchField.val().split(' ').length == 1) {
        var wordsResponse = await getSimilarWords(searchField.val());
        if (wordsResponse != null) {
            var synonyms = wordsResponse.synonyms;
            for (var i = 0; i < Math.min(synonyms.length, 10); ++i) {
                var giphyResponse = await getGifs(synonyms[i]);
                console.log(giphyResponse);
                if (giphyResponse != null && giphyResponse.data != null && giphyResponse.data.length > 0) {
                    giphyResponses.push(giphyResponse.data);
                }
            }
        }
    }

    for (var i = 0; i < giphyResponses.length; ++i) {
        var gif = $('<img>');
        gif.attr('src', giphyResponses[i][0].images.fixed_height.url);
        gif.attr('alt', `Result ${i}`);
        content.append(gif);
    }
    
});

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

async function getGifs(input) {
    var gihpyQuery = `https://api.giphy.com/v1/gifs/search?api_key=${gihpyAPIkey}&q=${input}`;
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