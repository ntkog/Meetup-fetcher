var fs = require('fs');
var _ = require('lodash');
var moment = require("moment");

var PAGE = 200;

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

var filters = {
    "groups" : [
        "id",
        "topics",
        "group_photo",
        "created"
    ],
    "organizers" : [
        "role",
        "name",
        "member_id"
    ],
	"members" : [
		"id",
		"name",
		"joined",
		"visited",
		"photo.photo_link"
	],
	"events" : [
			"id",
			"name",
			"time",
			"event_url",
			"rsvp_limit",
			"yes_rsvp_count",
			"maybe_rsvp_count",
			"waitlist_count",
			"comment_count",
			"rating",
            "venue"
	],
	"rsvps" : [
		"rsvp_id",
		"event.id",
		"group.urlname",
		"tallies",
		"member.member_id",
		"response"
	]
};

var timeFields = [
    "created",
	"visited",
	"joined",
	"time",
];

function fixApiName(category) {
	switch(category) {
		case 'rsvps': 
			return 'getRSVPs';
        case 'organizers':
            return 'getProfiles';
		default:
			return  'get' + capitalize(category);
	}
}

function fixedToISODate (obj) {
    return _.mapValues(obj, function(v,k,el) {
        if ( _.contains(timeFields,k)) {
            return moment(v).toISOString();
        } else {
            return v;                           
        };
    });
}

function taskGroup (com) {
    return {
        "group_urlname" : com,
        "offset" : 0,
        "only" : filters.groups.join(","),
        "page" : PAGE,
    };
}

function taskMember (com) {
    return {
        "group_urlname" : com,
        "offset" : 0,
        "only" : filters.members.join(","),
        "page" : PAGE,
    };
}

function taskOrganizer (com) {
    return {
        "group_urlname" : com,
        "offset" : 0,
        "role" : 'leads',
        "only" : filters.organizers.join(","),
        "page" : PAGE,
    };
}


function taskEvent (com) {
    return {
        "group_urlname" : com,
        "fields" : 'comment_count',
        "offset" : 0,
        "only" : filters.events.join(","),
        "category" : "events",
        "status": "past,upcoming",
        "page" : PAGE
    };
}

function taskRsvp (list) {
    return {
        "event_id" : list,
        "only" : filters.rsvps.join(","),
        "offset" : 0,
        "page" : PAGE
    }
}

var tasks = {
    "members" : taskMember,
    "events" : taskEvent,
    "rsvps" : taskRsvp,
    "groups" : taskGroup,
    "organizers" : taskOrganizer
};

function toJSON (filename , obj) {
	var options = { encoding: 'utf8' };
	fs.writeFileSync(filename, JSON.stringify(obj), options);
    console.log("%s has been written", filename);
}



module.exports = {
    "fixApiName" : fixApiName,
    "tasks" : tasks,
    "fixedToISODate" : fixedToISODate,
    "toJSON" : toJSON
};

