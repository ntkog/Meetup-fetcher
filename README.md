# Meetup Fetcher

This is a little project that aims to help Meetup organizers know better their communities through data exploration.


### Get Started

First of all, we create a new folder and install the module inside of it:

```bash
$ mkdir meetupFetcher ; cd meetupFetcher
$ npm install meetup-fetcher
```

We have to set our meetup API key . If you don't have one, go to:

[Request your Meetup Api Key]

and grab yours.

Once you have it , you can set an environment variable with your key:

```bash
$ export MEETUP_KEY=yourMeetupKey
```

or substitute 'YOUR_MEETUP_API_KEY' with your key (between quotes) in the following code:

Then create a file (Ex. index.js) that contains the following ( Make proper substitutions as explained by comments) :


```js
var fetcher = require('meetup-fetcher')({
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
```

Save it , and from the folder you saved your file , run:

```bash
$ node index.js
```

If everything is OK, you will see something like this :

```bash
[YOUR_COMMUNITY - members] Processing 200 items
[YOUR_COMMUNITY - members] Processing 136 items
[YOUR_COMMUNITY - groups] Processing 1 items
[YOUR_COMMUNITY - organizers] Processing 2 items
[YOUR_COMMUNITY - events] Processing 25 items
[YOUR_COMMUNITY - rsvps] Processing 200 items
[YOUR_COMMUNITY - rsvps] Processing 200 items
[YOUR_COMMUNITY - rsvps] Processing 200 items
[YOUR_COMMUNITY - rsvps] Processing 21 items
--- JSON Output ----
```

If it runs without any error, you will have a new folder called 'data' , and inside of it , some json files (depends how many urlnames you put in communities array, in the example code above).

Each json file stored will have the following skeleton:

```js
{
    "YOUR_COMMUNITY" : {
        "info" : {
            "id" : 124 // your community id
            "topics" : [
                {
                    "Web Design": 659
                },
            ],
            "group_photo" : {} //omitted
            "created" : "date"
            "team" : [
                {
                    "name" : 'yours',
                    "role" : 'Organizer',
                    "member_id" : 424
                }
            ]
        },
        "events" : {
            "count" : 23,
            "list : {} //omitted
        },
        "members" : {
            "count" : 139,
            "list" : {} //omitted
        }
    }
}

```


[Request your Meetup Api Key]:https://secure.meetup.com/meetup_api/key/
