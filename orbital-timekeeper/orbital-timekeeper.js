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
                unloggedIds: [accId],
                //  An hour represented[ [],[] ] hr[0] and hr[1] are 30min blocks
                tdata : [[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]]]

            }, function(error, results){
                Router.go('timetable', {_id: results});
            });

        }
    });


    Template.classTable.helpers({
        'testhelper' : function(){

            return AccountUnlogged.find({_id: {$in: this.unloggedIds}});
        },
        'parseUrl' : function(){
            $.ajaxSetup({
                async: false
            });
            var url = this.url;
            var decoded;
            if(url.length == 21){
                $.getJSON('https://nusmods.com/redirect.php?timetable=' + url , function(json){
                    decoded = decodeURIComponent(json.redirectedUrl);
                });
            } else{
                decoded = decodeURIComponent(url);
            }
            var split = decoded.split('/');
            var year = split[split.length-2];
            var last = split.pop();
            var sem = last[3];
            var sessions = last.split('?')[1].split('&');



            sessions.forEach(function(session){
                var modId = session.split('[')[0];
                var classType = session.slice(session.indexOf('[') + 1, session.indexOf(']')).toLowerCase();
                var classSlot = session.split('=').pop();

            });


            $.ajaxSetup({
                async: true
            });
            return url + 'testthis';
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

