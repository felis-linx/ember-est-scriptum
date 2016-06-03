import Ember from 'ember';

/** Et verbum erat scripta
 *
 *
 */

export default Ember.Component.extend({

  classNames: ['est-scriptum'],
  classNameBindings: ['scriptumClass', 'focused:focused'],

  scriptumClass: '',

  focused: false,
  mouseIsOver: false,
  
  selectionRange: null,
  defaultPS: false, // can use P as default paragraph separator on exec 'insertParagraph'
  
  safeContent: Ember.computed('content', function() {
    var text = this.get('content');
    if (text === undefined) {
      return '';
    }
    Ember.Logger.info('safeString --- clear up content', text);
    return Ember.String.htmlSafe(text.replace(/\n|\r\n|\r/g, '<br>'));
  }),

	focusIn: function() {
		this.set('focused', true);
	},
	
	focusOut: function() {
		if (!this.get('mouseIsOver')) {
			this.set('focused', false);
      var text = this.$('.editable-content').html().replace(/\n|\r\n|\r/g, '');
      this.set('content', text); //clear text from new line symbols
		} else {
      console.log('editor focus PREVENT out');
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
  
	currentFontSize: Ember.computed(/*'content',*/ {
		get(key) {
			console.log('fontSize get '+key);
			var size = this.getCommonAncestorStyled('fontSize');
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
				var range = this.get('selectionRange'), element, wholeNode = false,
						parentAcestor;
				
				if (range.startOffset === 0 && range.startContainer.length === range.endOffset) { wholeNode = true; }
				
				if (wholeNode === true ) {
					parentAcestor = this.getCommonAncestorStyled(actionName, range.commonAncestorContainer.parentNode.parentNode);
				}
				 else  { parentAcestor = this.getCommonAncestorStyled(actionName, range); }

				if (range.collapsed !== true && wholeNode === false) {
					element = document.createElement('span');
					range.surroundContents(element);
				}
				 else {
					 element = this.getCommonAncestor(range);
				 }
				
				// clear style if math with parent
				if (parentAcestor !== false && parentAcestor.style[actionName] === args) {
					args = '';
				}

				element.style[actionName] = args;
				if (element.style[0] === '' && element.nodeName === 'SPAN') {
					let node = range.extractContents(), parentNode = element.parentNode,
							selection = window.getSelection();
					parentNode.removeChild(element);
					this.restoreSelection();
					parentNode.pasteHTML(node.textContent);
				}
				break;
				
			default:
				if (!document.execCommand('styleWithCSS', false, true)) { 
					console.error('styleWithCSS false!');
				}
				if (!document.execCommand(actionName, false, args)) {
					console.error('Error in executed command '+actionName+' with args '+args);
				}
				break;
		}
		this.saveSelection();
	},
  
  init() { //TODO: check functionality without ...args
    this._super(...arguments);
    if (document.queryCommandSupported('defaultParagraphSeparator') === true) {      
      if (document.execCommand('defaultParagraphSeparator', false, 'p') === true) {
        this.set('defaultPS', true);
      }
    }
  },
	
	actions: {
    
		apply(command, args) {
      this.execute(command, args);
    }
  }
});
