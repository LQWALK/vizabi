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
						if(!_this._readyOnce) return;
					},
					"change:marker": function(evt, path) {
						if(!_this._readyOnce) return;
					},
					"change:marker.highlight": function() {
						if(!_this._readyOnce) return;
					},
					"change:marker.select": function() {
						if(!_this._readyOnce) return;
					},
					"change:marker.opacitySelectDim": function() {
						if(!_this._readyOnce) return;
					},
					"change:marker.opacityRegular": function() {
						if(!_this._readyOnce) return;
					}
				};

				this._super(config, context);

				this.isDataPreprocessed = false;


			},

			readyOnce() {

				this.element = d3.select(this.element);

				// select elements here before chart
				this.graph = this.element.select("vzb-sk-graph-svg");

				const _this = this;

				// set up resizing
				this.on("resize", () => {
					//return if updatesize exists with error
					if(_this.updateSize()) return;
					//_this.updateMarkerSizeLimits();
					//_this._labels.updateSize();
					//_this.redrawDataPoints();
					_this.initChart();

				});

				this.initChart();


			},

			initChart() {
				var units = "Widgets";

				var margin = {
						top: 10,
						right: 10,
						bottom: 10,
						left: 10
					},

					this.height = (parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom) || 0;
				this.width = (parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right) || 0;

				var formatNumber = d3.format(",.0f"), // zero decimal places
					format = function(d) {
						return formatNumber(d) + " " + units;
					},
					color = d3.scale.category20();

				// append the svg canvas to the page
				this.graph
					.append("g")
					.attr("transform",
						"translate(" + margin.left + "," + margin.top + ")");

				// Set the sankey diagram properties
				var sankey = d3.sankey()
					.nodeWidth(36)
					.nodePadding(40)
					.size([width, height]);

				var path = sankey.link();

				//set up graph in same style as original example but empty
				graph = {
					"nodes": [],
					"links": []
				};

				data.forEach(function(d) {
					graph.nodes.push({
						"name": d.source
					});
					graph.nodes.push({
						"name": d.target
					});
					graph.links.push({
						"phase_from": d.source,
						"phase_to": d.target,
						"amount": +d.value
					});
				});

				// return only the distinct / unique nodes
				graph.nodes = d3.keys(d3.nest()
					.key(function(d) {
						return d.name;
					})
					.map(graph.nodes));

				// loop through each link replacing the text with its index from node
				graph.links.forEach(function(d, i) {
					graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
					graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
				});

				//now loop through each nodes to make nodes an array of objects
				// rather than an array of strings
				graph.nodes.forEach(function(d, i) {
					graph.nodes[i] = {
						"name": d
					};
				});

				sankey
					.nodes(graph.nodes)
					.links(graph.links)
					.layout(32);

				// add in the links
				var link = this.graph.append("g")
					.selectAll(".link")
					.data(graph.links)
					.enter()
					.append("path")
					.attr("class", "link")
					.attr("d", path)
					.style("stroke-width", function(d) {
						return Math.max(1, d.dy);
					})
					.sort(function(a, b) {
						return b.dy - a.dy;
					});

				// add the link titles
				link.append("title")
					.text(function(d) {
						return d.source.name + " → " +
							d.target.name + "\n" + format(d.value);
					});

				// add in the nodes
				var node = this.graph.append("g")
					.selectAll(".node")
					.data(graph.nodes)
					.enter()
					.append("g")
					.attr("class", "node")
					.attr("transform", function(d) {
						return "translate(" + d.x + "," + d.y + ")";
					})
					.call(d3.behavior.drag()
						.origin(function(d) {
							return d;
						})
						.on("dragstart", function() {
							this.parentNode.appendChild(this);
						})
						.on("drag", dragmove));

				// add the rectangles for the nodes
				node.append("rect")
					.attr("height", function(d) {
						return d.dy;
					})
					.attr("width", sankey.nodeWidth())
					.style("fill", function(d) {
						return d.color = color(d.name.replace(/ .*/, ""));
					})
					.style("stroke", function(d) {
						return d3.rgb(d.color)
							.darker(2);
					})
					.append("title")
					.text(function(d) {
						return d.name + "\n" + format(d.value);
					});

				// add in the title for the nodes
				node.append("text")
					.attr("x", -6)
					.attr("y", function(d) {
						return d.dy / 2;
					})
					.attr("dy", ".35em")
					.attr("text-anchor", "end")
					.attr("transform", null)
					.text(function(d) {
						return d.name;
					})
					.filter(function(d) {
						return d.x < width / 2;
					})
					.attr("x", 6 + sankey.nodeWidth())
					.attr("text-anchor", "start");

				// the function for moving the nodes
				function dragmove(d) {
					d3.select(this)
						.attr("transform",
							"translate(" + d.x + "," + (
								d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
							) + ")");
					sankey.relayout();
					link.attr("d", path);

				}

			});

		export default SankeyComponent;
