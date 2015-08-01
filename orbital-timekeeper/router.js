Router.route('/', {
    name: 'landing',
    template: 'landing'
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

Router.configure({
    layoutTemplate: 'header'
});

