var fetcher = require('./lib/fetcher')({
    "dataDir" : __dirname + '/data/',
    "meetupKey" : 'YOUR_MEETUP_API_KEY',
    "apiTimeRate" : 10000
});


var communities = ['YOUR_MEETUP_URLNAME_COMMUNITY'];

fetcher.get(communities,function(err,result){
    if(err) {
        console.log(err);
    } else {
        console.log("%j" , result);
    }
});






