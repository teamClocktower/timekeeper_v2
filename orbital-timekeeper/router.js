Router.route('/', {
    name: 'landing',
    template: 'landing'
});

Router.route('/startup', {
    name: 'startup',
    template: 'startup'
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

