import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import simpleslider from 'components/simpleslider/simpleslider';
/*
 * Size dialog
 */

var Speed = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'speed';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [
  {
    component: simpleslider,
    placeholder: '.vzb-dialog-placeholder',
    model: ["state.time"],
    arg: "delay",
    properties: {min:1, max:6, step:0.1, scale: d3.scale.linear()
      .domain([1,2,3,4,5,6])
      .range([1200,900,450,200,75,50])
    }
  }
  ];

  this._super(config, parent);
}
});

export default Speed;
