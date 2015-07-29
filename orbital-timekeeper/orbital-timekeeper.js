AccountLogged = new Meteor.Collection('accountlogged');
AccountUnlogged = new Meteor.Collection('accountunlogged');
Instance = new Meteor.Collection('instance');

if (Meteor.isClient) {
  // counter starts at 0



  Template.landing.events({
      'click .begin' : function(){
          Router.go('startup');
      }
  });


    Template.startup.events({
        'click .next' : function(){
            var url = $('#input_url').val();
            var email = $('#input_email').val();

            var accId = AccountUnlogged.insert({
               name: '',
                url: url,
                email: email
            });

            Instance.insert({
                name: '',
                unloggedIds: [accId]
            }, function(error, results){
                Router.go('timetable', {_id: results});
            });


        }
    });

    // STUCK HERE
    Template.timetable.helpers({
        'testhelper' : function(){
            var testlst = this;
            console.log(this);
            return this;
        }
    });
  //Template.loggedIn.helpers({
  //    return "<h5>Welcome"+loginName+"</h5>"
  //})


}

if (Meteor.isServer) {
  Meteor.startup(function () {

    // code to run on server at startup
  });




}

//database
//membersList = new.Mongo.Collection('members');

