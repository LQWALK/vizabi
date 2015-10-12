import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';
import globals from 'base/globals';

import { bubbleopacity } from 'components/_index'

/*!
 * VIZABI SHOW CONTROL
 * Reusable show dialog
 */

var Show = Dialog.extend({

  init: function(config, parent) {
    this.name = 'show';
    var _this = this;

    this.components = [{
      component: bubbleopacity,
      placeholder: '.vzb-dialog-bubbleopacity',
      model: ["state.entities"],
      arg: "opacitySelectDim"
    }];

    this.model_binds = {
      "change:state:entities:show": function(evt) {
        _this.ready();
      },
      "change:state:time:value": function(evt) {
        if(!_this.model.state.time.playing && !_this.model.state.time.dragging) {
          _this.ready();
        }
      }
    }

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce: function() {
    this.element = d3.select(this.element);
    this.list = this.element.select(".vzb-show-list");
    this.input_search = this.element.select("#vzb-show-search");
    this.deselect_all = this.element.select("#vzb-show-deselect");
    this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

    this.KEY = this.model.state.entities.getDimension();

    var _this = this;
    this.input_search.on("input", function() {
      _this.showHideSearch();
    });

    this.deselect_all.on("click", function() {
      _this.deselectEntities();
    });

    this._super();
  },

  open: function() {
    this._super();

    this.input_search.node().value = "";
    this.showHideSearch();
  },

  /**
   * Build the list everytime it updates
   */
  //TODO: split update in render and update methods
  ready: function() {
    this._super();

    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.model.state.time.getDimension();
    var selected = this.model.state.entities.getSelected();
    var entitiesModel = this.model.state.entities;
    var marker = this.model.state.marker;
    var show = this.model.state.entities.show.getObject();
    var filter = {};
    filter[TIMEDIM] = this.model.state.time.value;

    var values = marker.getValues(filter, [KEY])

    var data = globals.metadata.entities;
      
    //sort data alphabetically
    data.sort(function(a, b) {
      return(a.name < b.name) ? -1 : 1;
    });

    this.list.html("");

    var items = this.list.selectAll(".vzb-show-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-show-item vzb-dialog-checkbox")

    items.append("input")
      .attr("type", "checkbox")
      .attr("class", "vzb-show-item")
      .attr("id", function(d) {
        return "-show-" + d[KEY];
      })
      .property("checked", function(d) {
        return entitiesModel.isShown(d);
      })
      .on("change", function(d) {
        _this.model.state.entities.showEntity(d);
      });

    items.append("label")
      .attr("for", function(d) {
        return "-show-" + d[KEY];
      })
      .text(function(d) {
        return d.name;
      })
      .on("mouseover", function(d) {
        _this.model.state.entities.highlightEntity(d);
      })
      .on("mouseout", function(d) {
        _this.model.state.entities.clearHighlighted();
      });

    this.showHideSearch();
    this.showHideDeselect();
  },

  showHideSearch: function() {

    var search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-show-item")
      .classed("vzb-hidden", function(d) {
        var lower = d.name.toLowerCase();
        return(lower.indexOf(search) === -1);
      });
  },

  showHideDeselect: function() {
    this.deselect_all.classed('vzb-hidden', false);
    this.opacity_nonselected.classed('vzb-hidden', false);
  },

  deselectEntities: function() {
    this.model.state.entities.clearShow();
  },

  transitionEnd: function(event) {
    this._super(event);

    if(!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Show;