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
                unloggedIds: [accId, '123', '456'],
                //  Half hr block represented[ [],[],[],[],[] ] , each element is a day
                tdata : [[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]],[[],[],[],[],[]]]

            }, function(error, results){
                Router.go('timetable', {_id: results});
            });

        }
    });


    Template.classTable.helpers({
        'testhelper' : function(){
            Session.set('InstanceId', this._id);
            return AccountUnlogged.find({_id: {$in: this.unloggedIds}});
        },
        'parseUrl' : function(){

            var path = 'http://api.nusmods.com/';
            var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            $.ajaxSetup({
                async: false
            });
            var url = this.url;
            var user = this;
            var userId = this._id;
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


            var tdata;
            sessions.forEach(function(session){
                var modId = session.split('[')[0];
                var classType = session.slice(session.indexOf('[') + 1, session.indexOf(']')).toLowerCase();
                var classSlot = session.split('=').pop();

                $.getJSON(path + year + '/' + sem + '/modules/' + modId + '/timetable.json', function(json){

                    json.forEach(function(lesson){
                        if(lesson.ClassNo == classSlot && lesson.LessonType.toLowerCase().slice(0,3) == classType ){

                            var hs = parseInt(lesson.StartTime.slice(0,2));
                            var ms = parseInt(lesson.StartTime.slice(2,4))==0?0:0.5;
                            var he = parseInt(lesson.EndTime.slice(0,2));
                            var me = parseInt(lesson.EndTime.slice(2,4));
                            var day = lesson.DayText;
                            var dayIdx = dayArr.indexOf(day);
                            var tdata = Instance.findOne({_id : Session.get('InstanceId')}).tdata;

                            for (var i =((hs+ms)*2)-16; i<((he+me)*2)-15; i++){
                                tdata[i][dayIdx].push(user);
                            }


                        }
                    }); // end json.forEach

                    // UPDATE FAILED CHECK WHY
                    Instance.update(Session.get('InstanceId'), {$set : {tdata: tdata}});

                }); // end getJSON

            }); // end sessions.forEach




            $.ajaxSetup({
                async: true
            });





            return Instance.findOne({_id: Session.get('InstanceId')});
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

