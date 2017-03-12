import * as utils from "base/utils";
import Tool from "base/tool";

import SankeyComponent from "tools/sankeydiagram/sankey-component";

import timeslider from "components/timeslider/timeslider";
import dialogs from "components/dialogs/dialogs";
import buttonlist from "components/buttonlist/buttonlist";
import treemenu from "components/treemenu/treemenu";
import datawarning from "components/datawarning/datawarning";
import datanotes from "components/datanotes/datanotes";
import steppedSpeedSlider from "components/steppedspeedslider/steppedspeedslider";

// SANKEY TOOL
const SankeyDiagram = Tool.extend("SankeyDiagram", {

	/**
	 * Initializes the tool (Sankey Tool).
	 * Executed once before any template is rendered.
	 * @param {Object} placeholder Placeholder element for the tool
	 * @param {Object} external_model Model as given by the external page
	 */
  init(placeholder, external_model) {
    this.name = "sankeydiagram";

		//specifying components
    this.components = [{
      component: SankeyComponent,
      placeholder: ".vzb-tool-viz",
      model: ["state.time", "state.entities", "state.marker", "locale", "ui"] //pass models to component
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
      component: datawarning,
      placeholder: ".vzb-tool-datawarning",
      model: ["locale"]
    }, {
      component: datanotes,
      placeholder: ".vzb-tool-datanotes",
      model: ["state.marker", "locale"]
    }];
		//constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  default_model: {
    state: {
      time: {
        "delay": 100,
        "delayThresholdX2": 50,
        "delayThresholdX4": 25
      },
      entities: {
        "opacitySelectDim": 0.3,
        "opacityRegular": 1
      },
      marker: {
        space: ["entities", "time"]
      },
      entities_tags: {},
      marker_tags: {
        space: ["entities_tags"],
        label: {},
        hook_parent: {}
      }
    },
    locale: {},
    ui: {
      chart: {
        labels: {
          dragging: true
        }
      },
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      presentation: false,
      buttons: ["moreoptions", "fullscreen", "presentation"],
      dialogs: {
        popup: ["moreoptions"],
        sidebar: [],
        moreoptions: ["opacity", "speed", "presentation", "about"]
      }
    }
  }
});

export default SankeyDiagram;
