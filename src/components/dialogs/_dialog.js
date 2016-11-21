import * as utils from 'base/utils';
import Component from 'base/component';
import { drag as iconDrag, pin as iconPin } from 'base/iconset'

/*!
 * VIZABI DIALOG
 * Reusable Dialog component
 */

var Dialog = Component.extend({
  /**
   * Initializes the dialog
   * @param {Object} config Initial config, with name and placeholder
   * @param {Object} parent Reference to tool
   */
  init: function(config, parent) {
    this.name = this.name || '';

    this.model_expects = this.model_expects || [{
      name: "state",
      type: "model"
    }, {
      name: "ui",
      type: "ui"
    }, {
      name: "language",
      type: "language"
    }];

    this.template = require(`./${this.name}/${this.name}.html`);

    this._super(config, parent);
  },

  /**
   * Executed when the dialog has been rendered
   */
  readyOnce: function() {
    this.element = d3.select(this.element);
    this.titleEl = this.element.selectAll('.vzb-top-dialog > .vzb-dialog-modal > .vzb-dialog-title');
    this.buttonsEl = this.element.selectAll('.vzb-top-dialog > .vzb-dialog-modal > .vzb-dialog-buttons');
    this.contentEl = this.element.selectAll('.vzb-top-dialog > .vzb-dialog-modal > .vzb-dialog-content');
  },

  ready: function() {
    var _this = this;
    this.placeholderEl = d3.select(this.placeholder);
    this.rootEl = this.root.element instanceof Array? this.root.element : d3.select(this.root.element)
    this.dragHandler = this.placeholderEl.select("[data-click='dragDialog']");
    this.dragHandler.html(iconDrag);
    this.pinIcon = this.placeholderEl.select("[data-click='pinDialog']");
    this.pinIcon.html(iconPin);
    this.dragContainerEl = d3.select('.vzb-tool');
    this.topPos = '';
    var profile = this.getLayoutProfile();

    var dg = dialogDrag(this.placeholderEl, this.dragContainerEl, 10);
    var dragBehavior = d3.behavior.drag()
      .on('dragstart', function D3dialogDragStart() {
        var topPos = _this.placeholderEl.node().offsetTop;
        _this.placeholderEl.style({'top': topPos + 'px', 'bottom': 'auto'});
        _this.trigger('dragstart');
        dg.dragStart(d3.event);
      })
      .on('drag', function D3dialogDrag() {
        _this.trigger('drag');
        dg.drag(d3.event);
      })
      .on('dragend', function D3dialogDrag() {
        _this.rightPos = _this.placeholderEl.style('right');
        _this.topPos = _this.placeholderEl.style('top');
        _this.trigger('dragend');
      });
    this.dragHandler.call(dragBehavior);

    this.dragHandler.classed("vzb-hidden", profile === 'small');
    this.pinIcon.classed("vzb-hidden", profile === 'small');
    this.resize();
  },

  resize: function() {
    if(this.placeholderEl && this.dragContainerEl && this.placeholderEl.classed('vzb-top-dialog')) {
      this.placeholderEl.classed('notransition', true);

      var profile = this.getLayoutProfile();

      if(profile !== 'small') {
        var chartWidth = parseInt(this.dragContainerEl.style('width'), 10);
        var dialogRight = parseInt(this.rightPos, 10);
        var chartHeight = parseInt(this.rootEl.style('height'), 10);
        var dialogTop = parseInt(this.topPos, 10);
        var dialogWidth = parseInt(this.placeholderEl.style('width'), 10);
        var dialogHeight = parseInt(this.placeholderEl.style('height'), 10);
        var dialogRightMargin = parseInt(this.placeholderEl.style('margin-right'), 10) || 0;
        if(utils.isNumber(dialogRight) && dialogRight > chartWidth - dialogWidth - dialogRightMargin) {
          if(this.rightPos) {
            this.rightPos = (chartWidth - dialogWidth - dialogRightMargin) + 'px';
            if(this.isOpen) this.placeholderEl.style('right', this.rightPos);
          }
        }
        if(utils.isNumber(dialogTop) && utils.isNumber(dialogHeight) && dialogTop >= 0 && dialogTop > chartHeight - dialogHeight) {
          if(this.topPos) {
            this.topPos = ((chartHeight - dialogHeight) > 0 ? (chartHeight - dialogHeight) : 0)  + 'px';
            if(this.isOpen) this.placeholderEl.style('top', this.topPos);
          }
        }

        if(this.topPos && (this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true"))) {
            this.placeholderEl.style('bottom', 'auto');
        }

        if(this.rootEl.classed('vzb-landscape')) {
          // var contentHeight = parseInt(this.rootEl.style('height'));
          // var placeholderHeight = parseInt(this.placeholderEl.style('height'));
          // if (contentHeight < placeholderHeight) {
          //   this.topPos = (-contentHeight + 50) + 'px';
          //   this.rightPos = '';
          //   this.placeholderEl.style('right', this.rightPos);
          //   this.placeholderEl.style('bottom', 'auto');
          // } else {
          //   //this.topPos = '';
          //   this.placeholderEl.style('bottom', '');
          // }
        }
        //this.placeholderEl.style('top', this.topPos);
        this.element.style('max-height', '');
      } else {
        this.rightPos = '';
        this.topPos = '';
        this.placeholderEl.attr('style', '');
        // var totalHeight = this.root.element.offsetHeight;
        // if(this.rootEl.classed('vzb-portrait')) totalHeight = totalHeight - 50;
        // this.element.style('max-height', (totalHeight - 10) + 'px');
      }

      this.dragHandler.classed("vzb-hidden", profile === 'small');
      this.pinIcon.classed("vzb-hidden", profile === 'small');

      this._setMaxHeight();
    }
  },

  _setMaxHeight: function() {
    var totalHeight = this.root.element.offsetHeight;
    if(this.getLayoutProfile() !== 'small') {
      if(!this.topPos && (this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true"))) {
        var dialogBottom = parseInt(this.placeholderEl.style('bottom'), 10);
        totalHeight = totalHeight - dialogBottom;
      } else {
        var topPos = this.topPos ? parseInt(this.topPos, 10) : this.placeholderEl[0][0].offsetTop;
        totalHeight = totalHeight - topPos;
      }
    } else {
        totalHeight = this.rootEl.classed('vzb-portrait') ? totalHeight - 50 : totalHeight - 10;
    }

    this.element.style('max-height', totalHeight + 'px');

    //set 'max-height' to content for IE11
    var contentHeight = totalHeight - this.titleEl.node().offsetHeight - this.buttonsEl.node().offsetHeight;
    this.contentEl.style('max-height', contentHeight + 'px');
  },

  beforeOpen: function() {
    var _this = this;

    this.transitionEvents = ['webkitTransitionEnd', 'transitionend', 'msTransitionEnd', 'oTransitionEnd'];
    this.transitionEvents.forEach(function(event) {
      _this.placeholderEl.on(event, _this.transitionEnd.bind(_this, event));
    });

    this.placeholderEl.classed('notransition', true);

    this.placeholderEl.style({'top': '', 'bottom': ''}); // issues: 369 & 442

    if(this.topPos && this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true")) {
      var topPos = this.placeholderEl.node().offsetTop;
      this.placeholderEl.style({'top': topPos + 'px', 'bottom': 'auto'}); // issues: 369 & 442
    } else if(this.getLayoutProfile() !== 'small') {
      //if(this.rightPos) this.placeholderEl.style('right', this.rightPos);
    }

    this.placeholderEl.node().offsetTop;
    this.placeholderEl.classed('notransition', false);

    if(this.getLayoutProfile() === 'small') {
      this.placeholderEl.style('top', ''); // issues: 369 & 442
    } else if(this.rootEl.classed('vzb-landscape')) { // need to recalculate popup position (Safari 8 bug)
      // var contentHeight = parseInt(this.rootEl.style('height'));
      // var placeholderHeight = parseInt(this.placeholderEl.style('height'));
      // if (contentHeight < placeholderHeight) {
      //   this.topPos = (-contentHeight + 50) + 'px';
      //   this.rightPos = '';
      //   this.placeholderEl.style('right', this.rightPos);
      //   this.placeholderEl.style('bottom', 'auto');
      // } else {
      //   this.topPos = '';
      //   this.placeholderEl.style('bottom', '');
      // }
      //this.placeholderEl.style('top', this.topPos);
    }

  },

  /**
   * User has clicked to open this dialog
   */
  open: function() {
    this.isOpen = true;
    if(this.getLayoutProfile() !== 'small') {
      if(this.topPos) {
        this.placeholderEl.style('top', this.topPos);
        this.placeholderEl.style('right', this.rightPos);
      }
    }
  },

  beforeClose: function() {
//issues: 369 & 442
    if(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small') {
      this.placeholderEl.style('top', 'auto'); // issues: 369 & 442
    }
    if(this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true")) {
      this.topPos0 = this.topPos ? (this.placeholderEl.node().parentNode.offsetHeight - this.placeholderEl.node().offsetHeight) + 'px' : '';
    }
    this.placeholderEl.classed('notransition', false);
    this.placeholderEl.node().offsetHeight; // trigger a reflow (flushing the css changes)
  },

  /**
   * User has closed this dialog
   */
  close: function() {
//issues: 369 & 442
    if(!(this.rootEl.classed('vzb-portrait') && this.getLayoutProfile() === 'small')) {
      this.placeholderEl.style('top', ''); // issues: 369 & 442
      this.placeholderEl.style('right', ''); // issues: 369 & 442
    }

    if(this.getLayoutProfile() === 'large' && this.rootEl.classed("vzb-dialog-expand-true")) {
      this.placeholderEl.style({'top' : this.topPos0, 'right' : ''});
    }
    this.isOpen = false;
    this.trigger('close');
  },


  transitionEnd: function(eventName) {
    var _this = this;

    this.transitionEvents.forEach(function(event) {
      _this.placeholderEl.on(event, null);
    });
    if(this.isOpen) {
      this.placeholderEl.classed('notransition', true);
    }
  }

});

function dialogDrag(element, container, xOffset) {
  var posX, posY, divTop, divRight, marginRight, eWi, eHe, cWi, cHe, diffX, diffY;

  return {
    move: function(x, y) {
      element.style('right', x + 'px');
      element.style('top', y + 'px');
    },

    dragStart: function(evt) {
      if(!utils.isTouchDevice()) {
        posX = evt.sourceEvent.clientX;
        posY = evt.sourceEvent.clientY;
      } else {
        var touchCoord = d3.touches(container.node());
        posX = touchCoord[0][0];
        posY = touchCoord[0][1];
      }
      divTop = parseInt(element.style('top')) || 0;
      divRight = parseInt(element.style('right')) || 0;
      marginRight = parseInt(element.style('margin-right')) || 0;
      eWi = parseInt(element.style('width'));
      eHe = parseInt(element.style('height'));
      cWi = parseInt(container.style('width')) - marginRight;
      cHe = parseInt(container.style('height'));
      diffX = posX + divRight;
      diffY = posY - divTop;
    },

    drag: function(evt) {
      if(!utils.isTouchDevice()) {
        posX = evt.sourceEvent.clientX;
        posY = evt.sourceEvent.clientY;
      } else {
        var touchCoord = d3.touches(container.node());
        posX = touchCoord[0][0];
        posY = touchCoord[0][1];
      }
      var aX = -posX + diffX,
        aY = posY - diffY;
      if(aX < -xOffset) aX = -xOffset;
      if(aY < 0) aY = 0;
      if(aX + eWi > cWi) aX = cWi - eWi;
      if(aY + eHe > cHe) aY = cHe - eHe;

      this.move(aX, aY);
    }
  }
}

export default Dialog;
