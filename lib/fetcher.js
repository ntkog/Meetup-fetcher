require('es6-module-loader');
var _ = require('lodash');
var utils = require('./utils');
var Rx = require('rx');
var requireDir = require('require-dir');
var config = {};
var results = {};
var defaults = {
    "dataDir" : __dirname + '/data/',
    "apiTimeRate" : 15000,
    "limit" : 80
};

// It will be set when Fetcher is required
var meetup;

/**
 * It will fetch all data from a category
 * @param   {String} community      urlname of the meeetup community
 * @param   {String} category       can be 'members' / 'events' / 'rsvps'
 * @param   {Object} firstIteration params for meetup-api exposed method (fixApiName translates that)
 * @returns {Observable} Rx.Observable.generateWithRelativeTime for API restrictions
 */
function getData(community, category,firstIteration) {
  
    var hit = Rx.Observable.fromCallback(meetup[utils.fixApiName(category)]);
    
    var initObj = {};
    initObj[category] = {
        "count" : 0,
        "list" : {}
    };
    return Rx.Observable.generateWithRelativeTime(
            firstIteration,
            function checkLimit (task) { 
                return task.offset < config.limit; 
            },
            function increment (task) { 
                task.offset++; 
                return task; 
            },
            function(task) {
                return task;
            },
            // Interleave time between each task produced
            function(x) { return config.apiTimeRate; }
        ).flatMap( function (t) { 
            return hit(t); 
     }).takeWhile( function (r) {
         // When meta.count = 0 , we scrapped all data
         return r[1].meta.count !== 0;
     })
     .reduce(function(acc,item) {
            
           // TODO : Investigate why item has 0,1 keys
           console.log("[%s - %s] Processing %d items", community, category,item[1].meta.count);
           if (_.contains(['members','events'], category)) {
            _.map(item[1].results, function(elem) { 
               acc[category].list[elem.id + ""] = utils.fixedToISODate(elem);                
            });      
            acc[category].count += item[1].meta.count;
           } else {
             // Mapping results to proper events & users
             if (_.contains(['groups','organizers'],category)) {
                // Community Mapping
                var data;
                data = category === 'groups' 
                   ? _.map(item[1].results, function(v,k){ 
                        var fixed = utils.fixedToISODate(v);
                        fixed.topics = _.map(fixed.topics, function(it) {
                            var o = {};
                            o[it.name] = it.id;
                            return o;
                        });
                        return fixed;
                    })[0]
                    : { "team" : item[1].results };
                
                 if( !_.has(results[community],"info")) {
                    _.extend(results[community], { "info" : data });
                 } else {
                    _.extend(results[community].info, data );
                 }
                
             } else {
             
                 _.map(item[1].results, function(rsvp) {
                     // Members mapping
                     if (_.has(results[community].members.list[rsvp.member.member_id],"rsvps")) {
                        results[community].members.list[rsvp.member.member_id].rsvps.list.push(rsvp.event.id);
                        rsvp.response === "yes" && results[community].members.list[rsvp.member.member_id].rsvps.yes++;
                        rsvp.response === "no" && results[community].members.list[rsvp.member.member_id].rsvps.no++;
                        results[community].members.list[rsvp.member.member_id].rsvps.count++;
                    } else {
                        //Initialise rsvps for current member
                        if(results[community].members.list[rsvp.member.member_id]) {
                            results[community].members.list[rsvp.member.member_id].rsvps = {
                                "count" : 1,
                                "yes" : rsvp.response === "yes" ? 1 : 0,
                                "no" :  rsvp.response === "no" ? 1 : 0,
                                "list" : rsvp.response === "yes" ? [rsvp.event.id] : []                 
                            };
                        } else {
                            console.log( "member %s not found" ,rsvp.member.member_id);
                        }
                    };

                    // Events mapping
                    if (_.has(results[community].events.list["" + rsvp.event.id],"rsvps")) { 
                        results[community].events.list["" + rsvp.event.id].rsvps.list.push(rsvp.member.member_id);
                    } else {
                        // Initialise rsvps for current event
                        if(results[community].events.list["" + rsvp.event.id]) {
                            results[community].events.list["" + rsvp.event.id].rsvps = {
                                "tallies" : rsvp.tallies,
                                "list"  : [rsvp.member.member_id]
                            };
                        } else {
                            console.log( "Event %s not found" ,rsvp.event.id);
                        }
                    };                
                 });
             }
        
           }
           return acc;
        
     },initObj);

}




/**
 * Wrapper for getting all info about a Meetup Community
 * @param   {String} com Meetup Community you wanna fetch info from
 * @returns {Observable} Rx.Observable
 */
function getSource(com) {
   
    return Rx.Observable.concat(
        getData(com,'members',utils.tasks.members(com)),
        getData(com,'groups',utils.tasks.groups(com)),
        getData(com,'organizers',utils.tasks.organizers(com)),
        getData(com,'events',utils.tasks.events(com)))
        .do(function(r) {
            // Store intermediate results
            if (!_.has(results,com)){
                results[com] = r;
            } else {
                if(!_.contains(['groups','organizers'], _.keys(r)[0])){
                    _.assign(results[com],r);
                }
            }
        })
        .takeLast(1).flatMap(function (item) {
            return getData(com,"rsvps",utils.tasks.rsvps(_.keys(item.events.list).join(",")))
                .map( function (rsvp) {
                    return results;
                });
        });
    
}


/**
 * Iterates thru all communities passed by list argument
 * @param   {Array} list Communities you want to explore
 * @returns {Observable} Rx.Observable
 */
function process(list) {
    return Rx.Observable.concat(_.map(list,function (c) { return getSource(c); }));    
}

/**
 * Exposed method for fetchin' all communities passed by argument(Array)
 * @param {Array} communitiesList List of all communities you want to explore
 * @param {Function} cb  Callback that is call whenever all work was done or there was an error
 */
function get( communitiesList , cb ) {
    process(communitiesList).subscribe(
        function(r) {
            utils.toJSON(config.dataDir + _.keys(r)[0] + '.json', r);
            results = {};
        },
        function(e) {
            cb(e,null);
        },
        function() {
            var all = requireDir(config.dataDir);
            cb(null,all);
        }
    );
}

/**
 * Extend default configuration
 * @param   {Object} options can be meetupKey,dataDir,apiTimeRate,limit
 * @returns {Object} Config object that will be used by fetcher
 */
function setup (options) {
    return _.extend(defaults,options);
}

/**
 * Constructor
 * @param   {Object} options  Will be passed to configure Fetcher
 * @returns {Object}   Exposed API for Fetcher Module
 */
function Fetcher(options) {
    config = setup(options);
    meetup = require('meetup-api')({ key : config.meetupKey });
    return {
        "get" : get
    };
}


module.exports = Fetcher;