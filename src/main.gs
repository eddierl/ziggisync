/*
This script syncs the data from Ziggi to Google Calendar

Author :  Eddie Erlich

 TODO LIST
 DONE - ziggi returns dup event, need to filter it by the uid
 DONE save in the SCRIPTDB/properties the managed events
 DONE singletone with getcal
 better compare - update the event instead of recrating
 DONE (field that are not in use - RRULE:FREQ,DTSTAMP) get more data from zigii - (for ex. the reccurence value)
 email on changes
 DONE refactor the main function
 DONE install function(to install timed trigger
 DONE set calendar color color - it's now a dafault calendar, orange(like bgu)
 DONE delete all events button
 add creation/update time to each event(maybe as tag?)
 DONE - THERE IS A POSSIBILTY FOR DIFFRERENT EVENTS WITH SAME UID, need to handle it!!!
 also handle empty fields
 log
 

*/
var active_cal;

function getcal(calname) {
  if (active_cal == null){
    cobj = CalendarApp.getCalendarsByName(calname);
    Logger.log(cobj);
    if (cobj.length == 0) {
      var optAdvancedArgs = {timeZone : "Asia/Jerusalem", color : CALENDAR_COLOR};
      // can't change the country by the api, waiting for google to enable it
      active_cal = CalendarApp.createCalendar(calname, optAdvancedArgs);    
    }
    active_cal = cobj[0];
  }
   return active_cal;
}



function getZiggiParsed(email,pass) {
  // send http request to ziggi, and parse the output
  const re = /((.+):(.+))+/g;
  var response = UrlFetchApp.fetch("http://ziggi.bgu.co.il/outlook.php?user=" + email);
  var response = UrlFetchApp.fetch("http://test-ziggisync.rhcloud.com/sched?user=" + email +"&pass=" + pass);
  var t =response.getContentText();
  var m  = t.match(re);
  Logger.log(m);
  if (m == null) {
    return []
  }
  else {
    return m;
  }
  //var t = "BEGIN:VEVENT\nSUMMARY:F\nLocation:גוטמן [32]  חדר 208\nEND:VEVENT\nBEGIN:VEVENT\nBEGIN:VEVENT\nSUMMARY:F\nLocation:גוטמן [32]  חדר 208\nEND:VEVENT\nBEGIN:VEVENT";
  
}



function proccesEvents(m) {
  // bound the event
  // add new events, recreate modified events
  // delete irelevabt events
  var is_event = false;
  var js = {};
  var uids=[];
  for(i = 0; i < m.length; i++){
    if (is_event) {
      if(m[i] == "END:VEVENT") {
        is_event = false;
        //Logger.log(js);
        
        var zsu = zsuid(js);
        if (uids.indexOf(zsu) == -1) {
          
          var event_id = findeventbyuid(zsu);
          if (event_id) {
          Logger.log(js["UID"] + "," + js["SUMMARY"] + " is already in");
            event_diff_result = (event_diff(event_id,js));
            if ((event_diff_result) || (verifyexistsance(event_id) == false)) {
              Logger.log("recreating " + js["UID"]);
              delEvent(event_id);
              addEvent(js);
            }
          } 
          else 
          {
            Logger.log("Adding " + js["UID"]); 
            addEvent(js);
          }
          uids.push(zsu);
        }
        js = {};
        continue;
      }
      js[m[i].split(":")[0]] = m[i].split(":")[1];
    }
    if(m[i] == "BEGIN:VEVENT"){
      js = {};
      is_event = true; 
    }  
  }
  deleteirelevantevents(uids);
  deleteundoneevents(true);
  UserProperties.setProperty("version", ScriptProperties.getProperty("version"));
}

function updateGoogleEvent(property,json_event) {
  switch (property) {
      
    case   1:
      Logger.log("D");
      break;
    default :
      return false;
  }
}
function sendEmailWhenDiff(diff_properties) {
  
}




function addProp(eventid,json_event)
{
  UserProperties.setProperty("zs:" + eventid, json_event);
}

function addPropnew(type,eventid,value)
{
  UserProperties.setProperty("zs:" + type + ":" + eventid, value);
}

function delProp(eventid)
{
  UserProperties.deleteProperty("zs:" + eventid);
}


function addEvent(json_event){
  Logger.log("Attempt to create event" + json_event);
  var cal = getcal(CALENDAR_NAME);
  //Logger.log(json_event);
  var title = json_event["SUMMARY"];
  if (title !=null) { title = title.replace(/&quot;/g, '\"')} else {title = ""};
  var start_date = icaldate(json_event["DTSTART"]);
  var end_date = icaldate(json_event["DTEND"]);
  //RRULE:FREQ=WEEKLY;COUNT=13;
  var recur_count = json_event["RRULE"].split(";")[1].split("=")[1];
  recur_count=parseInt(recur_count) + WEEKS_END_SHIFT; //ziggi returns 13, but this doesn't match the calendar
  
  var recurrence = CalendarApp.newRecurrence().addWeeklyRule().times(parseInt(recur_count));
  var desc = json_event["DESCRIPTION;ENCODING=QUOTED-PRINTABLE"]
  if (desc != null) { desc = desc.replace(/&quot;/g, '\"')} else {desc = ""};
  var email_tmp = UserProperties.getProperty("email");
  desc = desc + "\n" + "http://ziggi.co.il/index.php?login_mail=" + email_tmp;
  
  desc = desc + "\n" + "http://bit.ly/W42fCU";
  var loc = json_event["Location"];
  var optAdvancedArgs = {description : desc, location : loc};
 
  // there is a problem when creating an event and there is an error on the server...
  // need a garbage collector using the setTag
  var eventSeries = cal.createEventSeries(title, start_date, end_date, recurrence, optAdvancedArgs).setTag("ziggiEvent","created");
  
  
  addProp(eventSeries.getId(), Utilities.jsonStringify(json_event));
  eventSeries.setTag("ziggiEvent","done");
  //colorevent(es.getId,start_date,end_date);
  Utilities.sleep(TIME_BETWEEN_CREATE);
  
}

function delEvent(eventid)
{
  // this deletes the events, but it still have a resource in googles servers, hope tey will accually delete the resource after some time
  Logger.log("Attempt to delete eventid:" + eventid);
  var cal = getcal(CALENDAR_NAME);
  
  // If it failed to delete the event, i guess it doesn't existts, so just delete the property record
  try {
    var eventSeries = cal.getEventSeriesById(eventid); 
    eventSeries.deleteEventSeries();
  }
  catch(err) {
    Logger.log(err);
  }
  delProp(eventid);
  Utilities.sleep(TIME_BETWEEN_DELETE);
  
}


function event_diff(eventid,ziggi_event){
  // compare events between ziggi and proporties(not accual events)
  // return fields that need to senc
  var cal = getcal(CALENDAR_NAME);
  //var eventSeries = cal[0].getEventSeriesById(eventid);
  var json_property = Utilities.jsonParse(UserProperties.getProperty("zs:" + eventid));
  var check_properties = ["SUMMARY", "DTSTART", "DTEND", "Location", "DESCRIPTION;ENCODING=QUOTED-PRINTABLE"];
  var need_update = [];
  for (prop_i in check_properties) {
    if (ziggi_event[check_properties[prop_i]] != json_property[check_properties[prop_i]]) {
     need_update.push([check_properties[prop_i]]) ;
    }
  }
  if (need_update.length > 0) {
   return need_update; 
  }
  else{return false;}
}
        
function deleteirelevantevents(lst_uids) {
 //lst_uid are all the active uids
  lst_found_uid =[];
  for (property in UserProperties.getProperties())
  {
    if (property.split(":")[0] == "zs") {
      json_property = Utilities.jsonParse(UserProperties.getProperty(property));
      if ((lst_uids.indexOf(zsuid(json_property)) == -1) || (lst_found_uid.indexOf(zsuid(json_property)) !=-1)) {
        delEvent(findeventbyuid(zsuid(json_property)));
      }
      else {
      lst_found_uid.push(zsuid(json_property));
      }
    } 
  }
}

function deleteundoneevents(doit) {
  if (doit == true) {
    lst_deleted_events =[];
    var cal = getcal(CALENDAR_NAME);
    var now_date = new Date();
    now_date = now_date.getTime();
    var ziggi_events = cal.getEvents(new Date(now_date - (86400000 * 365)), new Date(now_date + (86400000 * 365)));
    
    for (event in ziggi_events) {
      if (ziggi_events[event].getTag("ziggiEvent") == "created") {
      if (lst_deleted_events.indexOf(ziggi_events[event].getEventSeries().getId()) == -1)   {
            lst_deleted_events.push(ziggi_events[event].getEventSeries().getId());
            delEvent(ziggi_events[event].getEventSeries().getId());  
          
        }
      
      }
    }
  }
}

function checkTrigger(create) {
  // chech if main is set, the flag is to create it if not set
  var main_func = "main";
  var st = ScriptApp.getScriptTriggers();
  for (stid = 0; stid < st.length; stid++) {
    if (st[stid].getHandlerFunction() == main_func) { return true };
  }
  if (create) {
    ScriptApp.newTrigger(main_func).timeBased().everyHours(1).create();
    
  }
  return false;
}

function get_ziggi_email() {
  return UserProperties.getProperty("email");
}

function get_ziggi_pass() {
  return UserProperties.getProperty("pass");
}

function main() {
  ziggi_output = getZiggiParsed(get_ziggi_email(),get_ziggi_pass());
  
  if (UserProperties.getProperty("version") != ScriptProperties.getProperty("version")){
    Logger.log("del events");
    delEvents();
  }
  Logger.log("start upgrade");
  upgrade(true);
  Logger.log("start process");
  proccesEvents(ziggi_output);
  if (UserProperties.getProperty("email2") != ""){
    //z_second_email = getZiggiParsed(UserProperties.getProperty("email2"));
    //CALENDAR_NAME = "2מערכת שעות";
    //proccesEvents(z_second_email);
  }
  
}