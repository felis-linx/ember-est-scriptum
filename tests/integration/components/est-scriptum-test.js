import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('est-scriptum', 'Integration | Component | est scriptum', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{est-scriptum}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#est-scriptum}}
      template block text
    {{/est-scriptum}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
