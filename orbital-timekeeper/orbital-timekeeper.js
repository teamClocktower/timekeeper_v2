
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
           // does not insert if too many timetables (color scheme for 7 timetables only)
           if (this.unloggedIds.length > 7){
               Materialize.toast('Too many timetables for this group', 4000);
           } else{
               var validatePassed = true;
               // regex patterns for the various inputs
               var urlLongValidation = /nusmods.com\/timetable/;
               var urlShortValidation = /modsn.us/;
               var emailValidation = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
               var url = $('#input_url').val();
               var email = $('#input_email').val();

               // perform regex checking, does not continue if fails
               if (!urlLongValidation.test(url) && !urlShortValidation.test(url)) {
                   Materialize.toast('URL invalid', 4000);
                   validatePassed = false;
               }

               if (!emailValidation.test(email)){
                   Materialize.toast('Email invalid', 4000);
                   validatePassed = false;
               }

               // if passes regex
               if (validatePassed) {

                   var accId;
                   // instantiate accId
                   // loop checks if user is logged in, and assigns the account ID to accId, otherwise, creates new accounts details
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
                   // older code used user instead of accId, saves time before refactoring
                   var user = accId;


                    // unloggedIds is an array of account IDs that are tagged to this group/instance
                   var unloggedIds = this.unloggedIds;
                   unloggedIds.push(accId);
                   //updates the variable in the db
                   Instance.update(this._id, {$set: {unloggedIds: unloggedIds}});
                   Session.set('InstanceId', this._id);
                   Session.set('UserEmail', email);


                   var path = 'http://api.nusmods.com/';
                   var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                   $.ajaxSetup({
                       async: false
                   });

                    // decode url so it can be split
                   var decoded;

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
                    // instantiate timetable data (nested arrays) here so that it can be accessible outside of updating loop
                   var tdata = Instance.findOne({_id: Session.get('InstanceId')}).tdata;
                   console.log(tdata);

                   // for each class session from the url
                   sessions.forEach(function (session) {
                       var modId = session.split('[')[0];
                       var classType = session.slice(session.indexOf('[') + 1, session.indexOf(']')).toLowerCase();
                       var classSlot = session.split('=').pop();

                       // call relevant api
                       $.getJSON(path + year + '/' + sem + '/modules/' + modId + '/timetable.json', function (json) {
                            // for each json
                           json.forEach(function (lesson) {
                               // check if details of json and class session match
                               if (lesson.ClassNo == classSlot && lesson.LessonType.toLowerCase().slice(0, 3) == classType) {
                                   // update tdata based of start/end time of this particular class/session
                                   var hs = parseInt(lesson.StartTime.slice(0, 2));
                                   var ms = parseInt(lesson.StartTime.slice(2, 4)) == 0 ? 0 : 0.5;
                                   var he = parseInt(lesson.EndTime.slice(0, 2));
                                   var me = parseInt(lesson.EndTime.slice(2, 4) == 0 ? 0 : 0.5);
                                   var day = lesson.DayText;
                                   var dayIdx = dayArr.indexOf(day);

                                   //console.log(classSlot, classType, modId);
                                   for (var i = ((hs + ms) * 2) - 16; i < ((he + me) * 2) - 16; i++) {

                                        // updating timetable data array
                                       tdata[i][dayIdx].push(user);


                                       //console.log(dayIdx, i);

                                   }


                               }
                           }); // end json.forEach


                       }); // end getJSON

                   }); // end sessions.forEach

                   // endless loop update, why?

                   var sessId = Session.get('InstanceId');
                   // set timetable data array in db
                   console.log(tdata);
                   Instance.update(sessId, {$set: {tdata: tdata}});


                   $.ajaxSetup({
                       async: true
                   });



                  Router.go('timetable', {_id: this._id});
           }

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


                var results = Instance.insert({
                    name: 'Un-Named Group',
                    unloggedIds: [accId],
                    //  Half hr block represented[ [],[],[],[],[] ] , each element is a day
                    tdata: [[[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []]]

                });



                    console.log(results);
                    var userInstances = AccountDetails.findOne({_id:accId}).instances;
                    userInstances.push(results);

                    AccountDetails.update(accId, {$set: {instances: userInstances}});


                    Session.set('InstanceId', results);
                    Session.set('UserEmail', email);

                    var path = 'http://api.nusmods.com/';
                    var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                    $.ajaxSetup({
                        async: false
                    });


                    var decoded;
                    var tdata = Instance.findOne({_id: Session.get('InstanceId')}).tdata;
                console.log(tdata);
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

                    console.log('before sessions');
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
                                    var me = parseInt(lesson.EndTime.slice(2, 4))== 0 ? 0 : 0.5;
                                    var day = lesson.DayText;
                                    var dayIdx = dayArr.indexOf(day);

                                    //console.log(classSlot, classType, modId);
                                    for (var i = ((hs + ms) * 2) - 16; i < ((he + me) * 2) - 16; i++) {
                                        console.log(hs, ms, he, me);
                                        console.log(i);
                                        tdata[i][dayIdx].push(accId);
                                        //console.log(dayIdx, i);

                                    }


                                }
                            }); // end json.forEach


                        }); // end getJSON

                    }); // end sessions.forEach
                    console.log('test test');
                    // endless loop update, why?
                    console.log('after sessions');
                    var sessId = Session.get('InstanceId');

                    Instance.update(sessId, {$set: {tdata: tdata}});


                    $.ajaxSetup({
                        async: true
                    });


                    Router.go('timetable', {_id: results});



            }

        }
    });


    Template.classTable.helpers({
        'timetableview' : function(){
            console.log(this);

            var hrArr = ["08", "09", "10", "11","12","13","14","15","16","17","18","19","20","21","22","23"];
            var minArr = ["00","30"];


            var final = '<table id="timetable" class="striped"><thead style="font-size:small;"><tr><th style="width:70px;"></th><th class="cellWidth">Monday</th><th class="cellWidth">Tuesday</th><th class="cellWidth">Wednesday</th><th class="cellWidth">Thursday</th><th class="cellWidth">Friday</th></tr></thead>';
            //console.log(this);
            var tdata = this.tdata;

            for (var h=0; h<hrArr.length; h++){

                for (var m=0;m<2;m++){

                    final += '<tr><th>'+hrArr[h]+minArr[m]+'</th>';

                    for (var d=0; d<5; d++){
                        final += '<td class="h'+hrArr[h]+'m'+minArr[m]+'d'+String(d)+'">';
                        var container = tdata[h*2+m][d];

                        for (var els=0; els<container.length; els++){

                            //final += container[els];
                            if(container[els] != ""){
                                var idx = this.unloggedIds.indexOf(container[els]);

                                final += '<span class="color' ;
                                final += String(idx);
                                final += ' '+ container[els];
                                final+= '">&nbsp;&nbsp;</span><span>&nbsp;</span>';
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
            var final = "<div>";
            for (var idx=0; idx<unloggedIds.length; idx++){
                var user = AccountDetails.findOne({_id:String(unloggedIds[idx])});
                final += '<div style="height:35px;">';
                final += '<div style="width:50px;float:left;">&nbsp;</div>';
                //console.log(user);
                final += '<div style="width:400px;float:left;" class="color'+String(idx)+'">'+user.email+'</div>';
                final += '<div class="switch">';
                final += ' <label>Show<input class="toggle ';
                final += unloggedIds[idx] +'" type="checkbox"><span class="lever"></span>Hide</label></div>';
                final += '</div>';
                //console.log(final);
            }
            final += '</div>';

            return final;


        }
    });

    Template.classTable.events({
        'change .toggle' : function(target){
            var hrArr = ["08", "09", "10", "11","12","13","14","15","16","17","18","19","20","21","22","23"];
            var minArr = ["00","30"];
            var tdata = this.tdata;
            var className = target.currentTarget.className;

            var detailId = className.split(' ')[1];
            var idx = this.unloggedIds.indexOf(detailId);




            if (target.currentTarget.checked){
                //console.log('checked');
                for (var h=0; h<hrArr.length; h++){
                    for (var m=0;m<2;m++){
                        for (var d=0; d<5; d++){
                            var container = tdata[h*2+m][d];
                            for (var els=0; els<container.length; els++){
                                //final += container[els];

                                if(container[els] == detailId){

                                    var spanNum = $('.h'+hrArr[h]+'m'+minArr[m]+'d'+d +' > .'+detailId).index();
                                    //console.log('.h'+hrArr[h]+'m'+minArr[m]+'d'+d +'  span:nth-child('+(spanNum+2)+')');
                                    $('.h'+hrArr[h]+'m'+minArr[m]+'d'+d +'  span:nth-child('+(spanNum+2)+')').remove();
                                    $('.h'+hrArr[h]+'m'+minArr[m]+'d'+d +' > .'+detailId).remove();
                                    //console.log("containerLength", container.length);
                                    //console.log("spanCount", $('.h'+hrArr[h]+'m'+minArr[m]+'d'+d).length); BUG WITH REMOVING SPAN, CANNOT REMOVE FROM CONTAINER EL BECAUSE CONTAINER LEN FIXED


                                    //console.log('.h'+hrArr[h]+'m'+minArr[m]+'d'+d +'  span:nth-child('+(els*2+2)+')');

                                }
                            }
                        }
                    }
                }
            } else {

                for (var h=0; h<hrArr.length; h++){
                    for (var m=0;m<2;m++){
                        for (var d=0; d<5; d++){
                            var container = tdata[h*2+m][d];
                            for (var els=0; els<container.length; els++){
                                //final += container[els];
                                if(container[els] == detailId){

                                    $('.h'+hrArr[h]+'m'+minArr[m]+'d'+d).append('<span class="color'+String(idx)+' '+ container[els]+'">&nbsp;&nbsp;</span><span>&nbsp;</span>');
                                }
                            }
                        }
                    }
                }

            }

        }
    });

    Template.timetable.events({
        'click .options' : function(){
            $('#options_modal').openModal();
        },
        'click .share' : function(){
            var valStatus = true;

            var emailValidation = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;


            var instanceUserName = $('#instance_userName').val();
            var instanceName = $('#instance_name').val();
            var instanceDesc = $('#instance_description').val();
            var instanceEmail = $('#instance_email').val();

            var emailArr = instanceEmail.split(',');

            if (instanceEmail == ''){
                Materialize.toast('Please fill in your recipient\'s emails', 4000);
            } else {
                for (var i=0; i< emailArr.length;i++){
                    if (!emailValidation.test(emailArr[i].trim())){
                        Materialize.toast(emailArr[i].trim()+' is not a valid email', 4000);
                        valStatus = false;
                    }
                }
            }

            if (instanceUserName == ''){
                Materialize.toast('Please fill in your name', 4000);
                valStatus = false;
            }

            if (instanceName == ''){
                Materialize.toast('Please give your group a name', 4000);
                valStatus = false;
            }

            if (instanceDesc == ''){
                Materialize.toast('Please fill in a short description', 4000);
                valStatus = false;
            }




            var emailUserTemplate = 'Hi '+instanceUserName+',\nYou have recently created a new Group at http://orbitaltimekeeper.meteor.com/timetable/' + this._id + ' . Please visit the link to access your Group! \n\nYour friends have been sent their invitations too! You will be able to view their timetables once they have added theirs in.';

            var emailShareTemplate = 'Hi, \nYou have recently been invited to join '+instanceUserName+'\'s Group!\n\nReason:'+instanceName+'\n\nDescription: '+instanceDesc+ ' \n\nJoin us at http://orbitaltimekeeper.meteor.com/timetable/' + this._id +' to view your Group, or visit http://orbitaltimekeeper.meteor.com/startup/'+this._id+' to add your timetable to the Group!';
            if (valStatus){

                Meteor.call('sendEmail',  instanceEmail, 'noreply.timekeeper@gmail.com', instanceName, emailShareTemplate);

                if (Session.get('UserEmail') != ''){
                    Meteor.call('sendEmail', Session.get('UserEmail'), 'noreply.timekeeper@gmail.com', instanceName, emailUserTemplate);
                }

                var instanceId = this._id;
                Instance.update(instanceId, {$set: {name: instanceName}});
                $('#options_modal').closeModal();
                $('#confirmation_modal').openModal();
            }

        }
    });

    Template.dashboard.helpers({
       'collectionRow' : function(){
           var instanceId = String(this);
           var name = Instance.findOne({_id: instanceId}).name;

           return name;
       }
    });

    Template.dashboard.events({
       'click .new' : function(){
           Router.go('/startup');
       }
    });
  //Template.loggedIn.helpers({
  //    return "<h5>Welcome"+loginName+"</h5>"
  //})


}

if (Meteor.isServer) {



  Meteor.startup(function () {
      process.env.MAIL_URL="smtp://noreply.timekeeper@gmail.com:qwezxcqwezxc@smtp.gmail.com:465/";

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

