import * as utils from 'base/utils';
import DataConnected from 'models/dataconnected';

/*!
 * VIZABI Entities Model
 */

var EntitiesModel = DataConnected.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    show: {},
    select: [],
    highlight: [],
    opacityHighlightDim: 0.1,
    opacitySelectDim: 0.3,
    opacityRegular: 1
  },

  objectLeafs: ['show'],
  dataConnectedChildren: ['show'],

  /**
   * Initializes the entities model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "entities";

    this._visible = [];
    this._multiple = true;

    this._super(name, values, parent, bind);
  },

  /**
   * Validates the model
   * @param {boolean} silent Block triggering of events
   */
  validate: function(silent) {
    var _this = this;
    var dimension = this.getDimension();
    var visible_array = this._visible.map(function(d) {
      return d[dimension]
    });

    if(visible_array.length) {
      this.select = this.select.filter(function(f) {
        return visible_array.indexOf(f[dimension]) !== -1;
      });
      this.setHighlight(this.highlight.filter(function(f) {
        return visible_array.indexOf(f[dimension]) !== -1;
      }));
    }
  },

  /**
   * Sets the visible entities
   * @param {Array} arr
   */
  setVisible: function(arr) {
    this._visible = arr;
  },

  /**
   * Gets the visible entities
   * @returns {Array} visible
   */
  getVisible: function(arr) {
    return this._visible;
  },

  /**
   * Determines whether multiple entities can be selected
   * @param {Boolean} bool
   */
  selectMultiple: function(bool) {
    this._multiple = bool;
  },

  /**
   * Gets the dimensions in this entities
   * @returns {String} String with dimension
   */
  getDimension: function() {
    return this.dim;
  },

  /**
   * Gets the filter in this entities
   * @returns {Array} Array of unique values
   */
  getFilter: function() {
    return this.show;
  },

  /**
   * Gets the selected items
   * @returns {Array} Array of unique selected values
   */
  getSelected: function() {
    var dim = this.getDimension();
    return this.select.map(function(d) {
      return d[dim];
    });
  },

  /**
   * Selects or unselects an entity from the set
   */
  selectEntity: function(d, timeDim, timeFormatter) {
    var dimension = this.getDimension();
    var value = d[dimension];
    if(this.isSelected(d)) {
      this.select = this.select.filter(function(d) {
        return d[dimension] !== value;
      });
    } else {
      var added = {};
      added[dimension] = value;
      if(timeDim && timeFormatter) {
        added["trailStartTime"] = timeFormatter(d[timeDim]);
      }
      this.select = (this._multiple) ? this.select.concat(added) : [added];
    }
  },

  selectEntityMD: function(d, timeDim, timeFormatter) {
    var _this = this;
    var value = this._createValue(d);
    if(this.isSelectedMD(d)) {
      this.select = this.select.filter(function(d) {
        return JSON.stringify(_this._createValue(d)) !== JSON.stringify(value);
      });
    } else {
      if(timeDim && timeFormatter) {
        value["trailStartTime"] = timeFormatter(d[timeDim]);
      }
      this.select = (this._multiple) ? this.select.concat(value) : [value];
    }
  },

  /**
   * Select all entities
   */
  selectAll: function(timeDim, timeFormatter) {
    if(!this._multiple) return;

    var added,
      dimension = this.getDimension();

    var select = this._visible.map(function(d) {
      added = {};
      added[dimension] = d[dimension];
      if(timeDim && timeFormatter) {
        added["trailStartTime"] = timeFormatter(d[timeDim]);
      }
      return added;
    });

    this.select = select;
  },

  /**
   * Shows or unshows an entity from the set
   */
  showEntity: function(d) {
    //clear selected countries when showing something new
    this.clearSelected();
    var newShow = utils.deepClone(this.show);
    var dimension = this.getDimension();
    var value = d[dimension];
    var showArray = [];

    // get array from show
    if (this.show[dimension] && this.show[dimension]['$in'] && utils.isArray(this.show[dimension]['$in']))
      showArray = this.show[dimension]['$in'];

    if(this.isShown(d)) {
      showArray = showArray.filter(function(d) { return d !== value; });
    } else {
      showArray = showArray.concat(value);
    }

    if (showArray.length === 0)
      delete newShow[dimension]
    else
      newShow[dimension] = { '$in': showArray };

    this.show = newShow;
  },

  setLabelOffset: function(d, xy) {
    if(xy[0]===0 && xy[1]===1) return;

    var dimension = this.getDimension();
    var value = d[dimension];

    utils.find(this.select, function(d) {
      return d[dimension] === value;
    }).labelOffset = [Math.round(xy[0]*1000)/1000, Math.round(xy[1]*1000)/1000];

    //force the model to trigger events even if value is the same
    this.set("select", this.select, true);
  },

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is selected or not
   */
  isSelected: function(d) {
    var dimension = this.getDimension();
    var value = d[this.getDimension()];

    return this.select
        .map(function(d) {return d[dimension];})
        .indexOf(value) !== -1;
  },

  isSelectedMD: function(d) {
    var _this = this;
    var value = this._createValue(d);

    return this.select
      .map(function(d) {
        return JSON.stringify(_this._createValue(d)) === JSON.stringify(value);
      })
      .indexOf(true) !== -1;
  },

  _createValue: function(d) {
    var dims = this.getDimension() ? [this.getDimension()].concat(this._getAllDimensions()) : this._getAllDimensions();
    return dims.reduce(function(value, key) {
      value[key] = d[key];
      return value;
    }, {});
  },

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is shown or not
   */
  isShown: function(d) {
    var dimension = this.getDimension();
    return this.show[dimension] && this.show[dimension]['$in'] && this.show[dimension]['$in'].indexOf(d[dimension]) !== -1;
  },

  /**
   * Clears selection of items
   */
  clearSelected: function() {
    this.select = [];
  },
  /**
   * Clears showing of items
   */
  clearShow: function() {
    var dimension = this.getDimension();
    var show = utils.deepClone(this.show);
    delete show[dimension];
    this.show = show;
  },

  /**
   * Gets the highlighted items
   * @returns {Array} Array of unique highlighted values
   */
  getHighlighted: function() {
    var dim = this.getDimension();
    return this.highlight.map(function(d) {
      return d[dim];
    });
  },

  setHighlight: function(arg) {
    if (!utils.isArray(arg)) {
      this.setHighlight([].concat(arg));
      return;
    }
    this.getModelObject('highlight').set(arg, false, false); // highlights are always non persistent changes
  },

  //TODO: join the following 3 methods with the previous 3

  /**
   * Highlights an entity from the set
   */
  highlightEntity: function(d, timeDim, timeFormatter, copyDatum) {
    var dimension = this.getDimension();
    var value = d[dimension];
    if(!this.isHighlighted(d)) {
      var added = {};
      if(copyDatum) {
        added = utils.clone(d);
      } else {
        added[dimension] = value;
        if(timeDim && timeFormatter) {
          added["trailStartTime"] = timeFormatter(d[timeDim]);
        }
      }
      this.setHighlight(this.highlight.concat(added));
    }
  },

  /**
   * Unhighlights an entity from the set
   */
  unhighlightEntity: function(d) {
    var dimension = this.getDimension();
    var value = d[dimension];
    if(this.isHighlighted(d)) {
      this.setHighlight(this.highlight.filter(function(d) {
        return d[dimension] !== value;
      }));
    }
  },

  /**
   * Checks whether an entity is highlighted from the set
   * @returns {Boolean} whether the item is highlighted or not
   */
  isHighlighted: function(d) {
    var dimension = this.getDimension();
    var value = d[this.getDimension()];

    var highlight_array = this.highlight.map(function(d) {
      return d[dimension];
    });

    return highlight_array.indexOf(value) !== -1;
  },

  /**
   * Clears selection of items
   */
  clearHighlighted: function() {
    this.setHighlight([]);
  }

});

export default EntitiesModel;
