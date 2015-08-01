AccountLogged = new Meteor.Collection('accountlogged');
AccountUnlogged = new Meteor.Collection('accountunlogged');
Instance = new Meteor.Collection('instance');

if (Meteor.isClient) {
  // counter starts at 0



  Template.landing.events({
      'click .begin' : function(){
          Router.go('startup_new');
      }
  });

    Template.startup_add.events({
       'click .next' : function(){
           var url = $('#input_url').val();
           var email = $('#input_email').val();
           var user;

           var accId = AccountUnlogged.insert({
               name: '',
               url: url,
               email: email
           }, function(error, results){
               user = results;
           });
           var unloggedIds = this.unloggedIds;
           unloggedIds.push(accId);
           Instance.update(this._id, {$set : {unloggedIds: unloggedIds}});
           Session.set('InstanceId', this._id);


           var path = 'http://api.nusmods.com/';
           var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
           $.ajaxSetup({
               async: false
           });


           var decoded;
           var tdata = Instance.findOne({_id : Session.get('InstanceId')}).tdata;
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

               $.getJSON(path + year + '/' + sem + '/modules/' + modId + '/timetable.json', function(json){

                   json.forEach(function(lesson){
                       if(lesson.ClassNo == classSlot && lesson.LessonType.toLowerCase().slice(0,3) == classType ){

                           var hs = parseInt(lesson.StartTime.slice(0,2));
                           var ms = parseInt(lesson.StartTime.slice(2,4))==0?0:0.5;
                           var he = parseInt(lesson.EndTime.slice(0,2));
                           var me = parseInt(lesson.EndTime.slice(2,4));
                           var day = lesson.DayText;
                           var dayIdx = dayArr.indexOf(day);

                           //console.log(classSlot, classType, modId);
                           for (var i =((hs+ms)*2)-16; i<((he+me)*2)-16; i++){
                               tdata[i][dayIdx].push(user);
                               //console.log(dayIdx, i);

                           }


                       }
                   }); // end json.forEach



               }); // end getJSON

           }); // end sessions.forEach

           // endless loop update, why?

           var sessId = Session.get('InstanceId');
           Instance.update(sessId, {$set : {tdata: tdata}});




           $.ajaxSetup({
               async: true
           });


           Router.go('timetable', {_id: this._id});

       }
    });


    Template.startup_new.events({
        'click .next' : function(){
            var url = $('#input_url').val();
            var email = $('#input_email').val();
            var user;
            var accId = AccountUnlogged.insert({
               name: '',
                url: url,
                email: email
            }, function(error, results){
                user = results;
            });

            Instance.insert({
                name: '',
                unloggedIds: [accId],
                //  Half hr block represented[ [],[],[],[],[] ] , each element is a day
                tdata : [[[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]], [[],[],[],[],[]]]

            }, function(error, results){

                var url = $('#input_url').val();

                Session.set('InstanceId', results);

                var path = 'http://api.nusmods.com/';
                var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                $.ajaxSetup({
                    async: false
                });


                var decoded;
                var tdata = Instance.findOne({_id : Session.get('InstanceId')}).tdata;
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

                    $.getJSON(path + year + '/' + sem + '/modules/' + modId + '/timetable.json', function(json){

                        json.forEach(function(lesson){
                            if(lesson.ClassNo == classSlot && lesson.LessonType.toLowerCase().slice(0,3) == classType ){

                                var hs = parseInt(lesson.StartTime.slice(0,2));
                                var ms = parseInt(lesson.StartTime.slice(2,4))==0?0:0.5;
                                var he = parseInt(lesson.EndTime.slice(0,2));
                                var me = parseInt(lesson.EndTime.slice(2,4));
                                var day = lesson.DayText;
                                var dayIdx = dayArr.indexOf(day);

                                //console.log(classSlot, classType, modId);
                                for (var i =((hs+ms)*2)-16; i<((he+me)*2)-16; i++){
                                    tdata[i][dayIdx].push(user);
                                    //console.log(dayIdx, i);

                                }


                            }
                        }); // end json.forEach



                    }); // end getJSON

                }); // end sessions.forEach

                // endless loop update, why?

                var sessId = Session.get('InstanceId');
                Instance.update(sessId, {$set : {tdata: tdata}});




                $.ajaxSetup({
                    async: true
                });





                Router.go('timetable', {_id: results});


            });

        }
    });


    Template.classTable.helpers({
        'timetableview' : function(){
            //console.log(this);
            var hrArr = ["08", "09", "10", "11","12","13","14","15","16","17","18","19","20","21","22","23"];
            var minArr = ["00","30"];

            var final = '<table id="timetable" class="striped"><thead style="font-size:small;"><tr><th></th><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th></tr></thead>';
            //console.log(this);
            var tdata = this.tdata;

            for (var h=0; h<hrArr.length; h++){

                for (var m=0;m<2;m++){

                    final += '<tr><th>'+hrArr[h]+minArr[m]+'</th>';

                    for (var d=0; d<5; d++){
                        final += '<td>';
                        var container = tdata[h*2+m][d];

                        for (var els=0; els<container.length; els++){

                            //final += container[els];
                            if(container[els] != ""){
                                final += '<span class="testdiv">&nbsp;</span><span>&nbsp;</span>';
                            } else {
                                final += '<span>&nbsp;</span>';
                            }


                        }
                        final += '</td>';
                        //console.log(final);

                    }
                    final += '</tr>';
                }
            }
            final += '</table>';

            return final;
        },
        'test' : function(){
            //console.log(String(this));
            var user = AccountUnlogged.findOne({_id:String(this)});
            var final = "";
            //console.log(user);
            final+= user.email;
            final += '                             ';
            final += "PLACEHOLDER COLOR";
            //console.log(final);
            return final;


        }
    });

    Template.timetable.events({
        'click .options' : function(){
            $('#options_modal').openModal();
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

