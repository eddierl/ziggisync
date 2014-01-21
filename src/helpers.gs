// Helpers

function icaldate(date){
  // Convert "20121009T200000" to javscript date
  const date_rex = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/;
  var match_date = date.match(date_rex);
  var format_date = new Date(match_date[1], match_date[2]-1, match_date[3], match_date[4], match_date[5], 0, 0);
  var finall_data = new Date(format_date.getTime() + (WEEKS_START_SHIFT * (86400000 * 7))); // ziggi returns a shifted data, might be because the war
  return finall_data;
}

function zsuid(jso) {
  zsuid_formated = (jso["UID"] + jso["SUMMARY"].substr(-15));
  return zsuid_formated;
}

function findeventbyuid(uid) {
  for (property in UserProperties.getProperties() )
  {
    if (property.split(":")[0] == "zs"){
      var json_property = Utilities.jsonParse(UserProperties.getProperty(property));
      if (zsuid(json_property) == uid) {
        return property.split(":")[1];
      }     
    } 
  }
  return false;
}

function verifyexistsance(eventid) {
  // this doesn't work immidiatly since google keep the record of the deleted event, need to open a issue for them.
  var cal = getcal(CALENDAR_NAME);
  
  try {
    var eventSeries = cal.getEventSeriesById(eventid);
    
    //Logger.log(eventSeries.getTitle());
   
    return true;
  }
  catch(e)
  {
    Logger.log(eventid);
    Logger.log(e);
    return false;
  }
}



function delEvents() {
  // delete all managed events
  for (property in UserProperties.getProperties() )
  {
    var val = property.split(":");
    if (val[0]=="zs") {
      delEvent(val[1]);
    }
  }
}


function upgrade(doit) {
  
  if(doit){
  var cal = getcal(CALENDAR_NAME);
   for (property in UserProperties.getProperties())
  {
    var val = property.split(":");
    if (val[0]=="zs") {
      var es =  cal.getEventSeriesById(val[1]);
      if (es.getTag("ziggiEvent") == null) {
        es.setTag("ziggiEvent","done");
      }
    }
  }
  }
}

function debuginfo(){
   var cal = getcal(CALENDAR_NAME);
    var now_date = new Date();
    now_date = now_date.getTime();
    var ziggi_events = cal.getEvents(new Date(now_date - (86400000 * 365)), new Date(now_date + (86400000 * 365)));
    
    for (event in ziggi_events) {
      Logger.log(event + " " + ziggi_events[event].getTag("ziggiEvent"))
      
    }
}