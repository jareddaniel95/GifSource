var wordsAPIkey = '739c50b3f7mshd67eedcf81ee582p110fb9jsn185672be3425';
var gihpyAPIkey = 'dAe5PgSXuoKvQSNB3cId7sn0DyvMK9VK';

var synonymBlacklist = ['a', 'an', 'the', 'is', 'to', 'on', 'or', 'as', 'at', 'in', 'for', 'by', 'with'];

var content = $('#content');
var searchField = $('input[name="input"]');
var buttonSearch = $('#search');

buttonSearch.on('click', async function() {
    var inputWords = searchField.val().split(' ');
    var firstGiphyResponse = await getGifsFromWord(searchField.val());
    var giphyResponses = [];
    console.log(firstGiphyResponse);
    if (firstGiphyResponse != null && firstGiphyResponse.data != null && firstGiphyResponse.data.length > 0) {
        giphyResponses.push(firstGiphyResponse.data);
    }
    console.log("data length: " + firstGiphyResponse.data.length);
    console.log("input length: " + searchField.val().split(' ').length);
    // CASE 1 - one word search
    if (inputWords.length == 1) { //firstGiphyResponse.data.length <= 10 || 
        var wordsResponse = await getSimilarWords(searchField.val());
        if (wordsResponse != null) {
            var synonyms = wordsResponse.synonyms;
            for (var i = 0; i < Math.min(synonyms.length, 10); ++i) {
                var giphyResponse = await getGifsFromWord(synonyms[i]);
                console.log(giphyResponse);
                if (giphyResponse != null && giphyResponse.data != null && giphyResponse.data.length > 0) {
                    giphyResponses.push(giphyResponse.data);
                }
            }
        }
    }
    // CASE 2 - multi-word search
    else if(inputWords.length > 1) {
        for (var k = 0; k < inputWords.length; ++k) {
            // Search original word
            var firstGiphyResponse = await getGifsFromWord(inputWords[k]);
            if (firstGiphyResponse != null && firstGiphyResponse.data != null && firstGiphyResponse.data.length > 0) {
                giphyResponses.push(firstGiphyResponse.data);
            }
            
            // Search synonyms
            if (!synonymBlacklist.includes(inputWords[k])) {
                var wordsResponse = await getSimilarWords(inputWords[k]);
                if (wordsResponse != null) {
                    var synonyms = wordsResponse.synonyms;
                    for (var i = 0; i < Math.min(synonyms.length, 4); ++i) {
                        var giphyResponse = await getGifsFromWord(synonyms[i]);
                        console.log(synonyms[i]);
                        console.log(giphyResponse);
                        if (giphyResponse != null && giphyResponse.data != null && giphyResponse.data.length > 0) {
                            giphyResponses.push(giphyResponse.data);
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

async function getGifsFromWord(input) {
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

async function getGifsFromArray(input) {
    input.forEach(word => {

    })
}