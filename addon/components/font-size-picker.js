import Ember from 'ember';
import layout from '../templates/components/font-size-picker';

export default Ember.Component.extend({

  layout,
  
  _value: Ember.computed('value', {
    get() {
      if (this._parent === undefined) {
        Ember.Logger.info('GET: _parent is undefined', this);
        return undefined;
      }
      var key = this.attrs.value.value;
      var val = this._parent.get(key);
      Ember.Logger.info('Fetch '+key, val);
//      this._parent._touchParent(val);
      return val;
    },
    set(key, value) {
      if (this._parent === undefined) {
        Ember.Logger.info('SET: _parent is undefined', this);
        return value;
      }
      var _key = this.attrs.value.value;
      this._parent.set(_key, value);
      Ember.Logger.info('Update '+_key, value);
    }
  }),
  
  init() {
    this._super(...arguments);
    this._parent = this.get('parent');
    Ember.Logger.info('INIT: '+this.elementId, this._parent);
  }  
});
