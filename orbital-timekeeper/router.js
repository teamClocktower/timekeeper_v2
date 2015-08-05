Router.route('/', {
    name: 'landing',
    template: 'landing',
    onBeforeAction : function(){
        if (Meteor.user()){

            Router.go('/dashboard/'+Meteor.userId());

        } else {
            this.next();
        }
    }


});

Router.route('/startup', {
    name: 'startup_new',
    template: 'startup_new'
});


Router.route('/startup/:_id', {
    name: 'startup_add',
    template: 'startup_add',
    data:function(){
        var instanceId = this.params._id;
        return Instance.findOne({_id:instanceId});
    }
});

Router.route('/timetable/:_id', {

    template: 'timetable',
    data: function(){
        var instanceId = this.params._id;
        return Instance.findOne({_id:instanceId});
    },

    name: 'timetable'
});

Router.route('/dashboard/:_id', {
   name: 'dashboard',
    template: 'dashboard',
    data: function(){
        var userId = this.params._id;

        return AccountDetails.findOne({createdBy:userId});
    },
    onBeforeAction : function() {
        if (!Meteor.user()) {

            Router.go('/');

        } else {
            this.next();
        }
    }
});

Router.configure({
    layoutTemplate: 'header'
});

