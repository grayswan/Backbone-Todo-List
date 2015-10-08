_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var app = {};

app.Todo = Backbone.Model.extend({
  defaults: {
    title: '',
    // isDone: false,
    // isUrgent: false,
    // dueDate: Date,
    completed: false
  },

  toggle: function(){
    this.save({completed: !this.get('completed')});
  }
});

app.TodoList = Backbone.Collection.extend({
  model: app.Todo,
  localStorage: new Store("backbone-todo"),
  completed: function() {
    return this.filter(function( todo ) {
      return todo.get('completed');
    });
  },
  remaining: function() {
    return this.without.apply( this, this.completed() );
  }
});

app.todoList = new app.TodoList();

app.TodoView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#item-template').html()),
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.input = this.$('.edit');
    return this;
  },

  initialize: function(){
    this.model.on('change', this.render, this);
    this.model.on('destroy', this.remove, this);
  },

  events: {
    'dblclick label' : 'edit',
    'keypress .edit' : 'updateOnEnter',
    'blur .edit' : 'close',
    'click .toggle': 'toggleCompleted',
    'click .destroy': 'destroy'
  },

  edit: function(){
    this.$el.addClass('editing');
    this.input.focus();
  },

  close: function(){
    var value = this.input.val().trim();
    if(value) {
      this.model.save({title: value});
    }
    this.$el.removeClass('editing');
  },
  updateOnEnter: function(e){
    if(e.which === 13){
      this.close();
    }
  },

  toggleCompleted: function(){
    this.model.toggle();
  },

  destroy: function(){
    this.model.destroy();
  }
});

app.AppView = Backbone.View.extend({
  el: '#todoapp',
  initialize: function () {
    this.input = this.$('#new-todo');
    app.todoList.on('add', this.addOne, this);
    app.todoList.on('reset', this.addAll, this);
    app.todoList.fetch(); // Loads list from local storage
  },

  events: {
    'keypress #new-todo': 'createTodoOnEnter'
  },

  createTodoOnEnter: function(event){
    if ( event.which !== 13 || !this.input.val().trim() ){
        return;
    }
    app.todoList.create(this.newAttributes());
    this.input.val(''); // clean input box
  },

  addOne: function(todo){
    var view = new app.TodoView({model: todo});
    $('#todo-list').append(view.render().el);
  },

  addAll: function(){
    this.$('#todo-list').html('');
    switch(window.filter){
      case 'pending':
        _.each(app.todoList.remaining(), this.addOne);
        break;
      case 'completed':
        _.each(app.todoList.completed(), this.addOne);
        break;
      default:
        app.todoList.each(this.addOne, this);
        break;
    }
  },

  newAttributes: function() {
    return {
      title: this.input.val().trim(),
      // isDone: false,
      // isUrgent: false,
      // dueDate: Date,
      completed: false
    }
  }
});

app.Router = Backbone.Router.extend({
  routes: {
    '*filter' : 'setFilter'
  },

  setFilter: function(params) {
    console.log('app.router.params = ' + params);
    window.filter = params.trim() || '';
    app.todoList.trigger('reset');
  }
});


app.router = new app.Router();
Backbone.history.start();
app.appView = new app.AppView();
