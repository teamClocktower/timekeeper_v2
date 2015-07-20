if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.header.helpers({
    'loggedInStatus' : function () {
        loggedIn = 0;
        if(loggedIn==0){
            return "{{>loginButton}}";
        }
        else{
            return "{{>loggedIn}}";
        }


    }
  });

  //Template.loggedIn.helpers({
  //    return "<h5>Welcome"+loginName+"</h5>"
  //})

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    // code to run on server at startup
  });
}

//database
//membersList = new.Mongo.Collection('members');