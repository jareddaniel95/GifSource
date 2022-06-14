var wordsAPIkey = '739c50b3f7mshd67eedcf81ee582p110fb9jsn185672be3425';
var gihpyAPIkey = 'dAe5PgSXuoKvQSNB3cId7sn0DyvMK9VK';

var content = $('#content');
var searchField = $('input[name="input"]');
var buttonSearch = $('#search');

buttonSearch.on('click', async function() {
    var wordsResponse = await getSimilarWords(searchField.val());
    var firstGiphyResponse = await getGifs(searchField.val());
    var giphyResponses = [];
    console.log(firstGiphyResponse);
    if (firstGiphyResponse != null) {
        giphyResponses.push(firstGiphyResponse);
    }
    if (wordsResponse != null) {
        var synonyms = wordsResponse.synonyms;
        for (var i = 0; i < Math.min(synonyms.length, 10); ++i) {
            var giphyResponse = await getGifs(synonyms[i]);
            console.log(giphyResponse);
            if (giphyResponse != null) {
                giphyResponses.push(giphyResponse);
            }
        }
    }

    for (var i = 0; i < giphyResponses.length; ++i) {
        var test = $('<p>');
        test.html(`<a href='${giphyResponses[i].data[0].url}'>${giphyResponses[i].data[0].title.trim() == '' ? 'Untitled' : giphyResponses[i].data[0].title}</a>`);
        content.append(test);
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