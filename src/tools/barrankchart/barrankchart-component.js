import * as utils from 'base/utils';
import Component from 'base/component';
import axisWithLabelPicker from 'helpers/d3.axisWithLabelPicker';


/*!
 * VIZABI POP BY AGE Component
 */


//POP BY AGE CHART COMPONENT
var BarRankChart = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init: function(config, context) {

    this.name = 'barrankchart-component';
    this.template = require('./barrank.html');

    //define expected models for this component
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
      name: "language",
      type: "language"
    }, {
      name: "ui",
      type: "ui"
    }];

    var _this = this;
    this.model_binds = {
      "change:time.value": function(evt) {
        if(!_this._readyOnce) return;
        _this.onTimeChange();
      },
      "change:entities.select": function(evt) {
        if(!_this._readyOnce) return;
        _this.selectBars();
      },
      "change:marker.axis_x.scaleType": function(evt) {
        if(!_this._readyOnce) return;
        _this.draw();
      },
      'change:marker.color.palette': function() {
        //console.log("EVENT change:marker:color:palette");
        //_this.drawColors();
      },
    };

    //contructor is the same as any component
    this._super(config, context);

    // set up the scales
    this.xScale = null;
    this.cScale = d3.scale.category10();

    // set up the axes
    this.xAxis = axisWithLabelPicker();
  },

  onTimeChange: function() {
    //this.year.setText(this.model.time.timeFormat(this.model.time.value));
    var _this = this;
    this.model.marker.getFrame(this.model.time.value, function(values) {
      _this.values = values;
      _this.loadData();
      _this.draw();
    });
  },

  /**
   * DOM and model are ready
   */
  readyOnce: function() {
    this.element = d3.select(this.element);

    // reference elements
    //this.graph = this.element.select('.vzb-br-graph');
    //this.yearEl = this.element.select('.vzb-br-year');
    //this.year = new DynamicBackground(this.yearEl);
    this.header = this.element.select('.vzb-br-header');
    this.barViewport = this.element.select('.barsviewport');
    this.barSvg = this.element.select('.vzb-br-bars-svg');
    this.barContainer = this.element.select('.vzb-br-bars');

    // set up formatters
    this.xAxis.tickFormat(this.model.marker.axis_x.getTickFormatter());

    this.ready();

    this.selectBars();

  },

  readyRuns: 0,

  /*
   * Both model and DOM are ready
   */
  ready: function() {
    var _this = this;
    // hack: second run is right after readyOnce (in which ready() is also called)
    // then it's not necessary to run ready()
    // (without hack it's impossible to run things in readyOnce áfter ready has ran)
    if (++this.readyRuns == 2) return;
    this.model.marker.getFrame(this.model.time.value, function(values) {
      _this.values =values;
      _this.loadData();
      _this.draw();
    });
  },

  resize: function() {
    this.draw();
  },

  loadData: function() {

    // sort the data (also sets this.total)
    this.sortedEntities = this.sortByIndicator(this.values.axis_x);

    // change header titles for new data
    var conceptProps = this.model.marker.getConceptprops();
    this.header.select('.vzb-br-title')
      .text(conceptProps[this.model.marker.axis_x.which].name
            + ' '
            + this.model.time.timeFormat(this.model.time.value)
      )
    this.header.select('.vzb-br-total')
      .text('Σ = ' + this.model.marker.axis_x.getTickFormatter()(this.total))

    // new scales and axes
    this.xScale = this.model.marker.axis_x.getScale(false);
    this.cScale = this.model.marker.color.getScale();

  },

  draw: function() {
    //return if drawAxes exists with error
    if(this.drawAxes()) return;
    this.drawData();
  },

  /*
  * draw the chart/stage
  */
  drawAxes: function() {

    // these should go in some style-config
    this.barHeight = 20;
    var margin = {top: 60, bottom: 40, left: 90, right: 20}; // need right margin for scroll bar

    // draw the stage - copied from popbyage, should figure out what it exactly does and what is necessary.
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if(this.height<=0 || this.width<=0) return utils.warn("Bar rank chart drawAxes() abort: vizabi container is too little or has display:none");

    this.barContainer.attr('transform', 'translate(' + margin.left + ', 0)');
    this.barViewport.style('height', this.height + 'px');

    // header
    this.header.attr('height', margin.top);

    var headerTitle = this.header.select('.vzb-br-title');
    var headerTotal = this.header.select('.vzb-br-total');
    var headerTitleBBox = headerTitle.node().getBBox();
    var headerTotalBBox = headerTotal.node().getBBox();
    headerTitle
      .attr('y', margin.top/2)
      .attr('x', margin.left);
    headerTotal
      .attr('text-anchor', 'end')
      .attr('y', margin.top/2)
      .attr('x', this.width + margin.left)
      .classed("vzb-transparent", headerTitleBBox.width + headerTotalBBox.width + 10 > this.width);

    // although axes are not drawn, need the xScale for bar width
    this.xScale.range([0, this.width]);
  },

  drawData: function() {

    var _this = this;
    var bar_margin = 2; // should go in some config
    var duration = (this.model.time.playing) ? this.model.time.delayAnimations : 0;

    // apply the current data to the bars (including ordering)
    var updatedBars = this.barContainer
      .selectAll('.vzb-br-bar')
      .data(this.sortedEntities, getDataKey)
      .order();

    // update the shown bars for new data-set
    this.createAndDeleteBars(updatedBars);


    this.barContainer
      .selectAll('.vzb-br-bar')
      .data(this.sortedEntities, getDataKey)
      .order()
      .each(function (d, i) {

        var bar = d3.select(this);
        var barWidth = _this.xScale(d.value);
        var xValue = _this.model.marker.axis_x.getTickFormatter()(d.value);

        // save the current index in the bar datum
        d.index = i;

        // set width of the bars
        bar.selectAll('rect')
          .transition().duration(duration).ease("linear")
          .attr("width", (barWidth > 0) ? barWidth : 0)

        // set positions of the bar-values
        bar.selectAll('.vzb-br-value')
          .text(xValue)

        // set title (tooltip)
        bar.selectAll('title')
          .text(_this.values.label[d.entity] + ' (' + xValue + ')');

      })
      .transition().duration(duration).ease("linear")
      .attr("transform", function(d, i) {
        return 'translate(0, '+ getBarPosition(d,i) + ')'
      })
      .call(endAll, function() {
        // when all the transitions have ended

        // set the height of the svg so it resizes according to its children
        var height = _this.barContainer.node().getBoundingClientRect().height
        _this.barSvg.attr('height', height + "px");

        // move along with a selection if playing
        if (_this.model.time.playing) {
          var follow = _this.barContainer.select('.vzb-selected');
          if (!follow.empty()) {
            var d = follow.datum();
            var yPos = getBarPosition(d, d.index);

            var currentTop = _this.barViewport.node().scrollTop;
            var currentBottom = currentTop + _this.height;

            var scrollTo = false;
            if (yPos < currentTop)
              scrollTo = yPos;
            if ((yPos + _this.barHeight) > currentBottom)
              scrollTo = yPos + _this.barHeight - _this.height;

            if (scrollTo)
              _this.barViewport.transition().duration(duration)
                .tween('scrollfor' + d.entity, scrollTopTween(scrollTo));

          }

        }

        function scrollTopTween(scrollTop) {
          return function() {
            var i = d3.interpolateNumber(this.scrollTop, scrollTop);
            return function(t) { this.scrollTop = i(t); };
          };
        }

      });


    // helper functions
    function getBarPosition(d, i) {
        return (_this.barHeight+bar_margin)*i;
    }
    function getDataKey(d) {
      return d.entity;
    }
    // http://stackoverflow.com/questions/10692100/invoke-a-callback-at-the-end-of-a-transition
    function endAll(transition, callback) {
      if (transition.size() === 0) { callback() }
      var n = 0;
      transition
          .each(function() { ++n; })
          .each("end", function() { if (!--n) callback.apply(this, arguments); });
    }

  },

  createAndDeleteBars: function(updatedBars) {

    var _this = this;

    // remove groups for entities that are gone
    updatedBars.exit().remove();

    // make the groups for the entities which were not drawn yet (.data.enter() does this)
    var newGroups = updatedBars.enter().append("g")
        .attr("class", 'vzb-br-bar')
        .attr("id", function(d) {
          return "vzb-br-bar-" + d.entity + "-" + _this._id;
        })
        .on("mousemove", function(bar) { _this.setHover(bar, true)  })
        .on("mouseout",  function(bar) { _this.setHover(bar, false) })
        .on("click", function(d) {

          utils.forEach(_this.model.marker.space, function(entity) {
            if (_this.model[entity].getDimension() !== 'time')
              _this.model[entity].selectEntity(d); // this will trigger a change in the model, which the tool listens to
          });

        });

    // draw new bars per group
    newGroups.append('rect')
        .attr("x", 0)
        .attr("rx", this.barHeight/4)
        .attr("ry", this.barHeight/4)
        .attr("stroke", "white")
        .attr("stroke-opacity", 0)
        .attr("stroke-width", 2)
        .attr("height", this.barHeight)
        .style("fill", function(d) {
          var color = _this.cScale(_this.values.color[d.entity]);
          return d3.rgb(color);
        });

    // draw new labels per group
    newGroups.append('text')
        .attr("class", "vzb-br-label")
        .attr("x", -5)
        .attr("y", this.barHeight/2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .text(function(d, i) {
          var label = _this.values.label[d.entity];
          return label.length < 12 ? label : label.substring(0, 9) + '...';
        })
        .style("fill", function(d) {
          var color = _this.cScale(_this.values.color[d.entity]);
          return d3.rgb(color).darker(2);
        })
        .append('title'); // watch out: might be overwritten if changing the labeltext later on

    // draw new values on each bar
    newGroups.append('text')
        .attr("class", "vzb-br-value")
        .attr("x", 5)
        .attr("y", this.barHeight/2)
        .attr("dominant-baseline", "middle")
        .style("fill", function(d) {
          var color = _this.cScale(_this.values.color[d.entity]);
          return d3.rgb(color).darker(2);
        });
  },

  drawColors: function() {
    var _this = this;

    this.barContainer.selectAll('.vzb-br-bar>rect')
      .style("fill", getColor);
    this.barContainer.selectAll('.vzb-br-bar>text')
      .style("fill", getDarkerColor);

    function getColor(d) {
      var color = _this.cScale(_this.values.color[d.entity]);
      return d3.rgb(color);
    }
    function getDarkerColor(d) {
      return getColor(d).darker(2);
    }
  },


  /**
  * DATA HELPER FUNCTIONS
  */

  sortByIndicator: function(values) {

    var _this = this;
    var data_array = [];
    this.total = 0; // setting this.total for efficiency at the same time

    // first put the data in an array (objects aren't sortable)
    utils.forEach(values, function(indicator_value, entity) {
      var row = { entity: entity, value: indicator_value };
      row[_this.model.entities.dim] = entity;
      data_array.push(row);

      // setting this.total for efficiency at the same time
      _this.total += indicator_value;
    });
    data_array.sort(function(a, b) {
      // if a is bigger, a comes first, i.e. descending sort
      return b.value - a.value;
    });
    return data_array;
  },

  /**
  * UI METHODS
  */

  /**
   * setting hover
   */
  setHover: function(bar, hover) {
    this.barContainer.classed('vzb-dimmed', hover);
    this.barContainer.select("#vzb-br-bar-" + bar.entity + "-" + this._id).classed('vzb-hovered', hover);
  },

  /**
   * Select Entities
   */
  selectBars: function() {
    var _this = this;
    var entityDim = this.model.entities.dim;
    var selected = this.model.entities.select;

    // unselect all bars
    this.barContainer.classed('vzb-dimmed-selected', false);
    this.barContainer.selectAll('.vzb-br-bar.vzb-selected').classed('vzb-selected', false);

    // select the selected ones
    if(selected.length) {
      this.barContainer.classed('vzb-dimmed-selected', true);
      utils.forEach(selected, function(selectedBar) {
        _this.barContainer.select("#vzb-br-bar-" + selectedBar[entityDim] + "-" + _this._id).classed('vzb-selected', true);
      });
    }

  },

});

export default BarRankChart;
