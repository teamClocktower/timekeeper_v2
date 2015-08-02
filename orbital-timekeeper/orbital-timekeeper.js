
AccountDetails = new Meteor.Collection('accountdetails');
Instance = new Meteor.Collection('instance');
//UserAccounts = new Mongo.Collection('users');




if (Meteor.isClient) {
  // counter starts at 0



  Template.landing.events({
      'click .begin' : function(){
          Router.go('startup_new');
      }
  });

    Template.header.events({
        'click .login' : function(){
            $('#login_modal').openModal();
        },
        'click .logout' : function(){
            Meteor.logout();
        }
    });

    Template.header.helpers({
       'displayUser' : function(){
           var t = Meteor.user().emails;

           return t[0].address;
       },
        'onLogin' : function(){
            Accounts.onLogin(function(){
               console.log("logged in");
            });

        }
    });

    Template.startup_add.onRendered( function(){



        if (Meteor.user()) {
            var userDetails = AccountDetails.findOne({createdBy: Meteor.userId()});
            if (userDetails) {
                accId = userDetails._id;
                $('#input_url').val(userDetails.url);
                $('#input_email').val(userDetails.email);

            }
        }



    });

    Template.startup_add.helpers({
        'populateFields' : function(){
            $(document).ready(function(){

                if (Meteor.user()) {
                    var userDetails = AccountDetails.findOne({createdBy: Meteor.userId()});
                    if (userDetails) {
                        accId = userDetails._id;
                        $('#input_url').val(userDetails.url);
                        $('#input_email').val(userDetails.email);

                    }
                }
            });
        }
    });

    Template.startup_add.events({
       'click .next' : function(){
           var validatePassed = true;
           var urlLongValidation = /nusmods.com\/timetable/;
           var urlShortValidation = /modsn.us/;
           var emailValidation = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
           var url = $('#input_url').val();
           var email = $('#input_email').val();

           if (!urlLongValidation.test(url) && !urlShortValidation.test(url)) {
               Materialize.toast('URL invalid', 4000);
               validatePassed = false;
           }

           if (!emailValidation.test(email)){
               Materialize.toast('Email invalid', 4000);
               validatePassed = false;
           }
           if (validatePassed) {

               var accId;
               if (Meteor.user()){
                   var userDetails = AccountDetails.findOne({createdBy:Meteor.userId()});
                   if (userDetails){
                       accId = userDetails._id;
                   } else{
                       accId = AccountDetails.insert({
                           name: '',
                           url: url,
                           email: email,
                           instances:  [],
                           createdBy: Meteor.userId()
                       });
                   }
               }else{
                   accId = AccountDetails.insert({
                       name: '',
                       url: url,
                       email: email,
                       instances:  []
                   });
               }
               var user = accId;


               var unloggedIds = this.unloggedIds;
               unloggedIds.push(accId);
               Instance.update(this._id, {$set: {unloggedIds: unloggedIds}});
               Session.set('InstanceId', this._id);


               var path = 'http://api.nusmods.com/';
               var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
               $.ajaxSetup({
                   async: false
               });


               var decoded;
               var tdata = Instance.findOne({_id: Session.get('InstanceId')}).tdata;
               if (url.length == 21) {
                   $.getJSON('https://nusmods.com/redirect.php?timetable=' + url, function (json) {
                       decoded = decodeURIComponent(json.redirectedUrl);
                   });
               } else {
                   decoded = decodeURIComponent(url);
               }

               var split = decoded.split('/');
               var year = split[split.length - 2];
               var last = split.pop();
               var sem = last[3];
               var sessions = last.split('?')[1].split('&');


               sessions.forEach(function (session) {
                   var modId = session.split('[')[0];
                   var classType = session.slice(session.indexOf('[') + 1, session.indexOf(']')).toLowerCase();
                   var classSlot = session.split('=').pop();

                   $.getJSON(path + year + '/' + sem + '/modules/' + modId + '/timetable.json', function (json) {

                       json.forEach(function (lesson) {
                           if (lesson.ClassNo == classSlot && lesson.LessonType.toLowerCase().slice(0, 3) == classType) {

                               var hs = parseInt(lesson.StartTime.slice(0, 2));
                               var ms = parseInt(lesson.StartTime.slice(2, 4)) == 0 ? 0 : 0.5;
                               var he = parseInt(lesson.EndTime.slice(0, 2));
                               var me = parseInt(lesson.EndTime.slice(2, 4));
                               var day = lesson.DayText;
                               var dayIdx = dayArr.indexOf(day);

                               //console.log(classSlot, classType, modId);
                               for (var i = ((hs + ms) * 2) - 16; i < ((he + me) * 2) - 16; i++) {
                                   tdata[i][dayIdx].push(user);
                                   //console.log(dayIdx, i);

                               }


                           }
                       }); // end json.forEach


                   }); // end getJSON

               }); // end sessions.forEach

               // endless loop update, why?

               var sessId = Session.get('InstanceId');
               Instance.update(sessId, {$set: {tdata: tdata}});


               $.ajaxSetup({
                   async: true
               });


               Router.go('timetable', {_id: this._id});
           }
       }
    });

    Template.startup_new.onRendered( function(){


        console.log(Meteor.user());
        if (Meteor.user()) {
            var userDetails = AccountDetails.findOne({createdBy: Meteor.userId()});
            if (userDetails) {
                accId = userDetails._id;
                $('#input_url').val(userDetails.url);
                $('#input_email').val(userDetails.email);

            }
        }



    });

    Template.startup_new.helpers({
        'populateFields' : function(){
            $(document).ready(function(){

                if (Meteor.user()) {
                    var userDetails = AccountDetails.findOne({createdBy: Meteor.userId()});
                    if (userDetails) {
                        accId = userDetails._id;
                        $('#input_url').val(userDetails.url);
                        $('#input_email').val(userDetails.email);

                    }
                }
            });

        }
    });

    Template.startup_new.events({
        'click .next' : function(){
            var validatePassed = true;
            var urlLongValidation = /nusmods.com\/timetable/;
            var urlShortValidation = /modsn.us/;
            var emailValidation = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            var url = $('#input_url').val();
            var email = $('#input_email').val();


            if (!urlLongValidation.test(url) && !urlShortValidation.test(url)) {
                Materialize.toast('URL invalid', 4000);
                validatePassed = false;
            }

            if (!emailValidation.test(email)){
                Materialize.toast('Email invalid', 4000);
                validatePassed = false;
            }

            if (validatePassed) {

                var accId;
                if (Meteor.user()){
                    var userDetails = AccountDetails.findOne({createdBy:Meteor.userId()});
                    if (userDetails){
                        accId = userDetails._id;
                    } else{
                        accId = AccountDetails.insert({
                            name: '',
                            url: url,
                            email: email,
                            instances:  [],
                            createdBy: Meteor.userId()
                        });
                    }
                }else{
                    accId = AccountDetails.insert({
                        name: '',
                        url: url,
                        email: email,
                        instances:  []
                    });
                }


                Instance.insert({
                    name: 'Un-Named Instance',
                    unloggedIds: [accId],
                    //  Half hr block represented[ [],[],[],[],[] ] , each element is a day
                    tdata: [[[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []]]

                }, function (error, results) {

                    var userInstances = AccountDetails.findOne({_id:accId}).instances;
                    userInstances.push(results);

                    AccountDetails.update(accId, {$set: {instances: userInstances}});
                    var url = $('#input_url').val();

                    Session.set('InstanceId', results);

                    var path = 'http://api.nusmods.com/';
                    var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                    $.ajaxSetup({
                        async: false
                    });


                    var decoded;
                    var tdata = Instance.findOne({_id: Session.get('InstanceId')}).tdata;
                    if (url.length == 21) {
                        $.getJSON('https://nusmods.com/redirect.php?timetable=' + url, function (json) {
                            decoded = decodeURIComponent(json.redirectedUrl);
                        });
                    } else {
                        decoded = decodeURIComponent(url);
                    }

                    var split = decoded.split('/');
                    var year = split[split.length - 2];
                    var last = split.pop();
                    var sem = last[3];
                    var sessions = last.split('?')[1].split('&');


                    sessions.forEach(function (session) {
                        var modId = session.split('[')[0];
                        var classType = session.slice(session.indexOf('[') + 1, session.indexOf(']')).toLowerCase();
                        var classSlot = session.split('=').pop();

                        $.getJSON(path + year + '/' + sem + '/modules/' + modId + '/timetable.json', function (json) {

                            json.forEach(function (lesson) {
                                if (lesson.ClassNo == classSlot && lesson.LessonType.toLowerCase().slice(0, 3) == classType) {

                                    var hs = parseInt(lesson.StartTime.slice(0, 2));
                                    var ms = parseInt(lesson.StartTime.slice(2, 4)) == 0 ? 0 : 0.5;
                                    var he = parseInt(lesson.EndTime.slice(0, 2));
                                    var me = parseInt(lesson.EndTime.slice(2, 4));
                                    var day = lesson.DayText;
                                    var dayIdx = dayArr.indexOf(day);

                                    //console.log(classSlot, classType, modId);
                                    for (var i = ((hs + ms) * 2) - 16; i < ((he + me) * 2) - 16; i++) {
                                        tdata[i][dayIdx].push(accId);
                                        //console.log(dayIdx, i);

                                    }


                                }
                            }); // end json.forEach


                        }); // end getJSON

                    }); // end sessions.forEach

                    // endless loop update, why?

                    var sessId = Session.get('InstanceId');

                    Instance.update(sessId, {$set: {tdata: tdata}});


                    $.ajaxSetup({
                        async: true
                    });


                    Router.go('timetable', {_id: results});


                });
            }

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

                                final += '<span class="color';
                                final += String(els);
                                final += '">&nbsp;</span><span>&nbsp;</span>';
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
            //console.log(final);
            return final;
        },
        'legend' : function(unloggedIds){
            var final = "";
            for (var idx=0; idx<unloggedIds.length; idx++){
                var user = AccountDetails.findOne({_id:String(unloggedIds[idx])});
                final += '<div>';
                //console.log(user);
                final += '<div style="width:500px;" class="color'+String(idx)+'">'+user.email+'</div>';
                //console.log(final);
            }
            final += '</div>';

            return final;


        }
    });

    Template.timetable.events({
        'click .options' : function(){
            $('#options_modal').openModal();
        },
        'click .share' : function(){
            var emailValidation = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;



            var instanceName = $('#instance_name').val();
            var instanceDesc = $('#instance_description').val();
            var instanceEmail = $('#instance_email').val();


            var emailUserTemplate = 'Hi,\n You have recently created a new *INSERTNAME* at http://orbitaltimekeeper.meteor.com/timetable/' + this._id + ' . Please visit the link to access your *INSERTNAME*. \n\n Your friends have been sent their invitations too! You will be able to view their timetables once they have added theirs in.';

            var emailShareTemplate = 'Hi, \n You have recently been invited to join *INSERTUSEREMAIL*\'s *INSERTNAME*.\n\n Reason:'+instanceName+'\n\nDescription: '+instanceDesc+ ' \n\n Join us at http://orbitaltimekeeper.meteor.com/timetable/' + this._id +' !';

           // FOR SHARER Meteor.call('sendEmail', )
            Meteor.call('sendEmail',  instanceEmail, 'noreply.timekeeper@gmail.com', instanceName, emailShareTemplate);

            var instanceId = this._id;
            Instance.update(instanceId, {$set: {name: instanceName}});
            $('#options_modal').closeModal();
            $('#confirmation_modal').openModal();
        }
    });

    Template.dashboard.helpers({
       'collectionRow' : function(){
           var instanceId = String(this);
           var name = Instance.findOne({_id: instanceId}).name;

           return name;
       }
    });
  //Template.loggedIn.helpers({
  //    return "<h5>Welcome"+loginName+"</h5>"
  //})


}

if (Meteor.isServer) {



  Meteor.startup(function () {
      process.env.MAIL_URL="smtp://noreply.timekeeper@gmail.com:PASSWORD@smtp.gmail.com:465/";

    // code to run on server at startup

    });

    Meteor.methods({
       sendEmail: function(to, from, subject, text){
           check([to, from, subject, text], [String]);
           this.unblock();
           Email.send({
              to: to,
               from: from,
               subject: subject,
               text: text
           });
       }
    });



}

//database
//membersList = new.Mongo.Collection('members');

