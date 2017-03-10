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
				if(!_this._readyOnce) return;
				_this.model.marker.getFrame(_this.model.time.value, (frame, time) => {
					if(!_this._frameIsValid(frame)) return utils.warn(
						"change:time.value: empty data received from marker.getFrame(). doing nothing");
					_this.frameChanged(frame, time);
				});
			},
			// If you decide to do time series, make changes here
			"change:marker": function(evt, path) {
				if(!_this._readyOnce) return;
				if(path.indexOf("domainMin") > -1 || path.indexOf("domainMax") > -1 ||
					path.indexOf("zoomedMin") > -1 || path.indexOf("zoomedMax") > -1) {
					if(!_this.yScale || !_this.xScale) return; //abort if building of the scale is in progress
					_this.updateShow();
					_this.zoomToMaxMin();
					_this.updateSize();
					_this.updateTime();
					_this.redrawDataPoints();
					return;
				}
				if(path.indexOf("scaleType") > -1) {
					_this.updateShow();
					_this.zoomToMaxMin();
					_this.updateSize();
					_this.redrawDataPoints();
				}
			},
			"change:marker.highlight": function() {
				if(!_this._readyOnce) return;
				_this.highlightLines();
			},
			"change:marker.select": function() {
				if(!_this._readyOnce) return;
				_this.updateDoubtOpacity();
				_this.highlightLines();
			},
			"change:marker.opacitySelectDim": function() {
				if(!_this._readyOnce) return;
				_this.highlightLines();
			},
			"change:marker.opacityRegular": function() {
				if(!_this._readyOnce) return;
				_this.highlightLines();
			}
		};

		this._super(config, context);

		this.isDataPreprocessed = false;


	}
});
