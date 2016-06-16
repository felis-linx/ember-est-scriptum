import Ember from 'ember';
import layout from '../templates/components/est-scriptum';

/** Et verbum erat scripta
 *
 *
 */

const ELEMENT_NODE = 1;
const TEXT_NODE	= 3;

function nodeIndex(parent, node) {
	return Array.prototype.indexOf.call(parent.childNodes, node);
}

const defaultInstrumenta = [
  [
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'subscript',
    'superscript',
    { eraser: 'removeFormat' }
  ],
  [
    {'align-left': 'justifyLeft'},
    {'align-center': 'justifyCenter'},
    {'align-right': 'justifyRight'},
    {'align-justify': 'justifyFull'},
  ],
  [
    {
      dropdown: 'font',
      content: [
        { fontFamily: 'serif' },
        { fontFamily: 'sans-serif' },
        { fontFamily: 'monospace' },
        { fontFamily: 'inherit' }
      ]
    },
    {
      dropdown: 'paragraph',
      content: [
        { formatBlock: { p : 'paragraph' }},
        { formatBlock: { h1 : '<h1>Header 1</h1>' }},
        { formatBlock: { h2 : '<h2>Header 2</h2>' }},
        { formatBlock: { h3 : '<h3>Header 3</h3>' }}
      ]
    },
    {
      dropdown: true,
      component: {
        name: 'font-size-picker',
        value: 'currentFontSize',
        icon: 'text-height'
      }
    }
  ]/*,
  [
    {
      component: {
        name: 'colorPicker',
        value: 'color',
        icon: 'font'
      }
    },
    {
      component: {
        name: 'colorPicker',
        value: 'bgColor',
        icon: 'file-text',
        yield: ''
      }
    }
  ]*/
];

export default Ember.Component.extend({

  layout,

  classNames: ['est-scriptum'],
  classNameBindings: ['scriptumClass', 'focused:focused'],

  scriptumClass: '',

  focused: false,
  mouseIsOver: false,

  selectionRange: null,
  defaultPS: false, // can use P as default paragraph separator on exec 'insertParagraph'

  _instrumenta: null,
  colorPicker: false,

  safeContent: Ember.computed('content', function() {
    var text = this.get('content');
    if (text === undefined) {
      return '';
    }
//    Ember.Logger.info('safeString --- clear up content', text);
    return Ember.String.htmlSafe(text.replace(/\n|\r\n|\r/g, '<br>'));
  }),
	
  init() {
    this._super(...arguments);
		
    if (document.queryCommandSupported('defaultParagraphSeparator') === true) {      
      if (document.execCommand('defaultParagraphSeparator', false, 'p') === true) {
        this.set('defaultPS', true);
      }
    }		
  },

  _initEstScriptum: function(){
    var self = this,
        _instrumenta = [],
        t0 = performance.now();

    defaultInstrumenta.forEach(function(section) {
      var _section = [];

      section.forEach(function(item) {
        if (typeof item === 'object') {
          if (item.hasOwnProperty('dropdown') || item.hasOwnProperty('component')) {                       
            if (item.hasOwnProperty('content') && Array.isArray(item.content)) {
              var _content = [];
              
              item.content.forEach(function(option) {
                for (var first in option) { break; }
                var _option = {'action': first};
                if (typeof option[first] === 'string') {
                  _option.option = _option.description = option[first];
                } else {
                  for (var _first in option[first]) { break; }
                  _option.option = _first;
                  _option.description = Ember.String.htmlSafe(option[first][_first]);
                }
                _content.push(_option);
              });
              
              _section.push({
                dropdown: true,
                icon: item.dropdown,
                content: _content
              });
              
            } else {
              var name = self.get(item.component.name);
//              for (var component in item.content) { break; }
//              _content = {component: component, value: item.content[component]};
              if (name !== false) {
                _section.push({
                  dropdown: item.dropdown,
                  component: name || item.component.name,
                  value: item.component.value,
                  action: item.component.action,
                  icon:item.component.icon
                });
              }
              
            }            
          } else {
            for (var first in item) { break; }
            _section.push({icon: first, action: item[first]});
          }
        } else {
          _section.push({icon: item, action: item});
        }
      });
      
      if (_section.length > 0) {
        _instrumenta.push(_section);
      }
    });
    
    this.set('_instrumenta', _instrumenta);
    var t1 = performance.now();
    Ember.Logger.log('[Est Scriptum] initialization took ' + (t1-t0) + ' milliseconds.');

		if (!document.execCommand('styleWithCSS', false, true)) {
			Ember.Logger.error('[Est Scriptum] styleWithCSS false :(');
		}
  }.on('didInsertElement'),

  focusIn: function() {
    this.set('focused', true);
    if (this.get('onfocus')) {
      this.sendAction('onfocus');
    }
		return true;
  },

  focusOut: function() {
    if (!this.get('mouseIsOver')) {
      this.set('focused', false);
      var text = this.$('.editable-content').html().replace(/\n|\r\n|\r/g, '');
      this.set('content', text); //clear text from new line symbols
      if (this.get('onfocus')) {
        this.sendAction('onblur');
      }
    } else {
      this.saveSelection();
//      this.restoreSelection();
    }
    return true;
  },

  mouseEnter: function() {
    this.set('mouseIsOver', true);
  },

  mouseLeave: function() {
    this.set('mouseIsOver', false);
  },

//  mouseOut: function(event) {
//    Ember.Logger.info('mouse out -->');
//    this.saveSelection();
//  },

//	mouseUp: function(event) {
//    Ember.Logger.info('^ mouse up', event);
//    this.saveSelection();
//  },

  keyPress: function(event) {
    this.saveSelection();
    if (event.keyCode === 13) { // catch <enter> and insert new line
      this.execute('insertParagraph');
      if (this.get('defaultPS') !== true) {
        let text = this.$('.editable-content').html();
        text = text.replace(/<div>/g, '<p>');
        text = text.replace(/<\/div>/g, '</p>');
        this.$('.editable-content').html(text);
        console.log('replace div with p...');
      }
      return false;
    }
  },

  paste: function(event) {
    this.saveSelection();
    event.preventDefault();

    // get plain text without formatting
    var plainText = event.originalEvent.clipboardData.getData('text/plain');
    if (plainText.length === 0) {
      return false;
    }

//    var temp = document.createElement("div");
//    temp.innerHTML = plainText;
    this.execute('insertText', plainText); //temp.textContent //.replace(/\n|\r\n|\r/g, '<br>')
//    this.execute('insertHTML', plainText);
  },

  getCommonAncestor: function(range) {
    if (typeof range !== 'undefined') {
      range = this.get('selectionRange');
    }
    return range.commonAncestorContainer.parentNode;
  },

  getCommonAncestorStyled: function(cssProperty, range) {
    var node;

    if (typeof range === 'undefined') { // TODO: fix — search range
      return false;
    }
//		console.log(undefined === typeof range.collapsed);
    if (typeof range.collapsed === 'undefined') {
      node = range;
    } else {
      node = this.getCommonAncestor(range);
    }

    while (node.parentNode.id !== 'editor-wrapper' && node.style[cssProperty] === '' && node.parentNode !== null) {
        node = node.parentNode;
    }
    if (node.style[cssProperty] !== '') {
      return node;
    } else {
      return false;
    }
  },

  getCurrentSelectionRange: function() {
    var selection = window.getSelection();
    if (selection.getRangeAt && selection.rangeCount) { return selection.getRangeAt(0); }
  },

  saveSelection: function() {
    return this.set('selectionRange', this.getCurrentSelectionRange());
  },

  restoreSelection: function() {
    var selection = window.getSelection();
    if (this.get('selectionRange')) {
      try {
        selection.removeAllRanges();
      } catch (_error) {
        console.error(_error);
        document.body.createTextRange().select();
        document.selection.empty();
      }
      return selection.addRange(this.get('selectionRange'));
    }
  },

  markSelection: function(input, color) {
    this.restoreSelection();
    if (document.queryCommandSupported('hiliteColor')) {
      this.execute('hiliteColor', color || 'transparent');
    }
//    return this.saveSelection();
  },

  _touchParent: function(val) {
    Ember.Logger.info('Touch parent with',val);
  },

  currentFontSize: Ember.computed(/*'content',*/ {
    get(key) {
      console.log('fontSize get '+key);
      debugger;
      var range = this.get('selectionRange'),
          size = this.getCommonAncestorStyled('fontSize', range);
      if (size !== false) { size = size.style['fontSize'].replace(/[a-zA-Z]/gi ,''); }
       else { size = 12; }
      return size;
    },
    set(key, value) {
//			console.log('set '+key+' = '+value);
      this.send('apply', 'fontSize', value+'pt');
      return value;
    }
  }).volatile(),

  execute: function(actionName, args) {

    this.restoreSelection();    
    var elem = this.$();
    elem.focus();

    if (typeof args === 'undefined') {
      args = false;
    }

    switch (actionName) {

      case 'fontFamily':
      case 'fontSize':
//				var rangeAncestorCSS = this.get('selectionRange').commonAncestorContainer.parentNode.style; //selectionRange
        var range = this.get('selectionRange'),
						element,
						wholeNode = false,
            parentAcestor;
				
				if (range.endOffset === 0 && range.endContainer.nodeType === ELEMENT_NODE) {
					var i = nodeIndex(range.commonAncestorContainer, range.endContainer),
							prevNode = range.commonAncestorContainer.childNodes[i-1];
					range.setEnd(prevNode, prevNode.childNodes.length);
//					range.setEndBefore(range.endContainer);
					if (range.startOffset === 0 && range.startContainer.nodeType !== ELEMENT_NODE) {
						range.setStart(range.startContainer.parentNode, 0);
					}
				}

        if (range.startContainer.nodeType === range.endContainer.nodeType === ELEMENT_NODE && 
						nodeIndex(range.commonAncestorContainer, range.startContainer) === nodeIndex(range.commonAncestorContainer, range.endContainer)) {
//        if (range.startOffset === 0 && range.startContainer.length === range.endOffset) {
					wholeNode = true;
				}

				debugger;

        if (wholeNode === true ) {
          parentAcestor = this.getCommonAncestorStyled(actionName, range.commonAncestorContainer.parentNode/*.parentNode)*/);
        } else {
					parentAcestor = this.getCommonAncestorStyled(actionName, range);
				}

        if (wholeNode === false) {
					if (range.collapsed === false) {
						element = document.createElement('span');
						try {
							range.surroundContents(element);
						} catch (error) {
							Ember.Logger.error(error);
							element.appendChild(range.extractContents());
							range.insertNode(element);
						}
					} else {
						element = this.getCommonAncestor(range);
					}
				} else {
					element = range.commonAncestorContainer;
				}

        // clear style if math with parent
        if (parentAcestor !== false && parentAcestor.style[actionName] === args) {
          args = '';
        }

        element.style[actionName] = args;
        if (element.style[0] === '' && element.nodeName === 'SPAN') {
          var node = range.extractContents(),
              parentNode = element.parentNode/*,
              selection = window.getSelection()*/;
          parentNode.removeChild(element);
          this.restoreSelection();
          parentNode.pasteHTML(node.textContent);
        }
        break;

      default:
        if (actionName && !document.execCommand(actionName, false, args)) {
          Ember.Logger.error('[Est Scriptum] error when execute command', actionName, 'with args', args);
        }
        break;
    }
    this.saveSelection();
  },

  actions: {

    apply(command, args) {
      this.execute(command, args);
    }
  }
});
