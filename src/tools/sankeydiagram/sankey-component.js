import * as utils from "base/utils";
import Component from "base/component";


// Sankey Component
const SankeyComponent = Component.extend({

	/**
	 * Initializes the component (Sankey Chart).
	 * Executed once before any template is rendered.
	 * @param {Object} config The options passed to the component
	 * @param {Object} context The component's parent
	 */
  init(config, context) {
    const _this = this;
    this.name = "sankey-component";
    this.template = require("./sankeydiagram.html");

		// expectectations for model
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }, {
      nam: "ui",
      type: "ui"
    }];

    this.model_binds = {
      "change:time.value": function() {
        if (!_this._readyOnce) return;
      },
      "change:marker": function(evt, path) {
        if (!_this._readyOnce) return;
      },
      "change:marker.highlight": function() {
        if (!_this._readyOnce) return;
      },
      "change:marker.select": function() {
        if (!_this._readyOnce) return;
      },
      "change:marker.opacitySelectDim": function() {
        if (!_this._readyOnce) return;
      },
      "change:marker.opacityRegular": function() {
        if (!_this._readyOnce) return;
      }
    };

    this._super(config, context);

    this.isDataPreprocessed = false;


  }
});

export default SankeyComponent;
