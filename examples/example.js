var fetcher = require('../lib/fetcher')({
    "dataDir" : __dirname + '/data/', // It will create a folder if it doesn't exists
    "meetupKey" : process.env['MEETUP_KEY'] || 'YOUR_MEETUP_API_KEY', // go to https://secure.meetup.com/meetup_api/key/ and grab yours
    "apiTimeRate" : 15000 // Meetup API will accept around 200 requests/hour
});

// Add urlname communities you want to fetch
// Ex : http://meetup.com/<urlname_of_your_community>/
var communities = ['<urlname_of_your_community>']; // add urlnames without <> (Case Sensitive)

fetcher.get(communities,function(err,result){
    if(err) {
        console.log(err);
    } else {
        console.log("%j" , result);
    }
});






