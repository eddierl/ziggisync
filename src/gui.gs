/*
* * * * * * * * * * * * *
* GUI STARTS FROM HERE  *
* * * * * * * * * * * * *
*/

function doGet(e){
  return HtmlService.createHtmlOutputFromFile('index');
}

function setAuth(pass) {
UserProperties.setProperty("passs", pass);
}

function processForm(formObject) {
  UserProperties.setProperty("user", formObject.user);
  UserProperties.setProperty("pass", formObject.pass);
}

function doGetOld(e){
  
  
  if (UserProperties.getProperty("email") == null) {
    UserProperties.setProperty("email",Session.getEffectiveUser().getEmail());
  }
  
  var count = 0;
  for (p in UserProperties.getProperties() )
  {
    if (p.split(":")[0] == "zs"){    
      count++;         
    } 
  }
 
  var app = UiApp.createApplication();
  
  app.add(app.loadComponent("ZiggiGui"));
  
  app.getElementById("Label1").setText("Managed Evened:" + count);
  
  app.getElementById("TextArea1").setText(" \
* * GETTING STARTED * *\n \
1) Change the ziggi email if needed and click the Save button\n \
That's all! :)\n \
From now on, your Google calendar will be sync once in a hour.\n \
Want to sync it now? just press the Sync button\n \
\n \
-------------------------- \n \
And Hey! \n \
\n \
I've wrote this app to get a copy of Ziggi's sched in my Goggle calender.\n \
This app will sync your Ziggi sched too!\n \
Every change you do will eventually get to your Google calendar.\n \
Also if someone at BGU will change the hours/place of your class, you'll get this update within an hour(depends on when Ziggi gets it).\n \
Actually, this is the plan, hopefully everything will run in order.\n \
\n  \
This app is kind of a prototype, so things might not work as well as expected.\n \
If you have any comments, ideas or might even complaints, i'll be happy to hear about it :)\n \
\n \
");
  app.getElementById("currentEmail").setText("Current email is :" + UserProperties.getProperty("email"));
  app.getElementById("lblTrigger").setText("Is trigger enabled :" + checkTrigger(true));
  app.getElementById("txtZiggiEmail").setText(UserProperties.getProperty("email"));
  var handle_update_email = app.createServerHandler("updateEmail").addCallbackElement(app.getElementById("txtZiggiEmail")).validateEmail(app.getElementById("txtZiggiEmail"));
  //var handle_sync = app.createServerHandler("main").setCallbackFunction("disable");
  var handle_sync = app.createServerHandler("handle_main");
  var handle_delete_all_event = app.createServerHandler("delEvents");
  
  var handle_disable = app.createClientHandler();
  handle_disable.forTargets(app.getElementById("btnSave")).setEnabled(false);
  handle_disable.forTargets(app.getElementById("btnSync")).setEnabled(false);
  handle_disable.forTargets(app.getElementById("btnDelEvents")).setEnabled(false);
  
  app.getElementById("btnSave").addClickHandler(handle_update_email);
  //app.getElementById("btnSaveSync").addClickHandler(handle_update_email);
  app.getElementById("btnSync").addClickHandler(handle_sync).addClickHandler(handle_disable);
  app.getElementById("btnDelEvents").addClickHandler(handle_delete_all_event).addClickHandler(handle_disable);
  
  
  return app;
}

function updateEmail(e) {
  UserProperties.setProperty("email",e.parameter.email);
  var app = UiApp.getActiveApplication();
  app.getElementById("currentEmail").setText("Current email is :" + UserProperties.getProperty("email"));
  return app;
}
function disable(e) {
 var app = UiApp.getActiveApplication();
 app.getElementById("btnSync").setEnabled(false);
 app.getElementById("btnSave").setEnabled(false);
 app.getElementById("btnDelEvents").setEnabled(false);
 return app;
}
function enable(e) {
 var app = UiApp.getActiveApplication();
 app.getElementById("btnSync").setEnabled(true);
 app.getElementById("btnSave").setEnabled(true);
 app.getElementById("btnDelEvents").setEnabled(true);
 return app;
}

function handle_main(e) {
  main();
}
