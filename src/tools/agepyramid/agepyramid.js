/*!
 * VIZABI AGEPYRAMID
 */

import * as utils from "base/utils";
import Tool from "base/tool";

import AgePyramidComponent from "tools/agepyramid/agepyramid-component";

import timeslider from "components/timeslider/timeslider";
import dialogs from "components/dialogs/dialogs";
import buttonlist from "components/buttonlist/buttonlist";
import treemenu from "components/treemenu/treemenu";
import datanotes from "components/datanotes/datanotes";
import steppedSpeedSlider from "components/steppedspeedslider/steppedspeedslider";

//BAR CHART TOOL
const AgePyramid = Tool.extend("AgePyramid", {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init(placeholder, external_model) {

    this.name = "agepyramid";

    //specifying components
    this.components = [{
      component: AgePyramidComponent,
      placeholder: ".vzb-tool-viz",
      model: ["state.time", "state.marker", "state.entities", "state.entities_side", "state.entities_allpossible", "state.entities_geodomain", "locale", "ui"] //pass models to component
    }, {
      component: timeslider,
      placeholder: ".vzb-tool-timeslider",
      model: ["state.time", "state.entities", "state.marker", "ui"]
    }, {
      component: dialogs,
      placeholder: ".vzb-tool-dialogs",
      model: ["state", "ui", "locale"]
    }, {
      component: buttonlist,
      placeholder: ".vzb-tool-buttonlist",
      model: ["state", "ui", "locale"]
    }, {
      component: treemenu,
      placeholder: ".vzb-tool-treemenu",
      model: ["state.marker", "state.marker_tags", "state.time", "locale"]
    }, {
      component: datanotes,
      placeholder: ".vzb-tool-datanotes",
      model: ["state.marker", "locale"]
    }, {
      component: steppedSpeedSlider,
      placeholder: ".vzb-tool-stepped-speed-slider",
      model: ["state.time", "locale"]
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  validate(model) {
    model = this.model || model;

    this._super(model);

    //validate on first model set only
    if (!this.model) {
      const entities = model.state.entities;
      if (Object.keys(entities.show).length > 0) {
        const show = {};
        if (entities.show[entities.dim] && Object.keys(entities.show).length !== 1) {
          show[entities.dim] = entities.show[entities.dim];
        }
        if (!entities.show[entities.dim] || !(Object.keys(entities.show).length == 1)) {
          entities.show = show;
        }
      }

      const entities_geodomain = model.state.entities_geodomain;
      entities_geodomain.skipFilter = model.state.entities.dim === entities_geodomain.dim ||
        model.state.entities_side.dim === entities_geodomain.dim;
    }
  },

  default_model: {
    state: {
      marker_tags: {}
    },
    ui: {
      chart: {
        stacked: true,
        inpercent: false,
        flipSides: true
      },
      "buttons": ["colors", "inpercent", "side", "moreoptions", "fullscreen"],
      "dialogs": {
        "popup": ["timedisplay", "colors", "side", "moreoptions"],
        "sidebar": ["timedisplay", "colors", "show"],
        "moreoptions": ["opacity", "speed", "colors", "side", "presentation", "about"]
      },
      presentation: false
    },
    locale: { }
  }


});

export default AgePyramid;
