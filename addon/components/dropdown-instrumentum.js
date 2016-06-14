import Ember from 'ember';
import layout from '../templates/components/dropdown-instrumentum';

export default Ember.Component.extend({

  layout,
  
	tagName: 'i',
	classNames: ['fa dropdown-toggle'],
	classNameBindings: ['iconName', 'expanded'],
	expanded: false,
  
  apply: 'apply',
    
	iconName: function() {
		return 'fa-'+this.get('content.icon');
	}.property('icon'),
	
	init: function() {
		//this._super.apply(this, args);
    this._super(...arguments);
		this.set('boundClickoutHandler', Ember.run.bind(this, this.clickoutHandler));
	},
	
	clickoutHandler: function() {
    this.set('expanded', false);
    return true;
  },
	
	unbindClosingEvents: function () {
		Ember.$(document).unbind('click', this.boundClickoutHandler);
	}.on('willDestroyElement'),
	
	manageClosingEvents: function() {
		if (this.get('expanded')) {
			Ember.run.later(() => {
				Ember.$(document).bind('click', {component: this}, this.boundClickoutHandler);
			}, 1);
		}
		 else {
			 Ember.$(document).unbind('click', this.boundClickoutHandler);
			 this.get('parentView').$().blur();
		 }
	}.observes('expanded'),
	
	click: function() {
		this.toggleProperty('expanded');
		this.get('parentView').$().focus();
		this.get('parentView').restoreSelection();
		return true;
	},
  
  actions: {
    apply(command, args) {
      this.sendAction('apply', command, args);
    }
  }
});
