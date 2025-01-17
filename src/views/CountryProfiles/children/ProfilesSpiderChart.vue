<template>
  <div class="graph-container">
      <info-hover-tooltip v-if="tooltipContentName" :contentName="tooltipContentName">
        <template v-if="headerIcon" v-slot:icon>
          <v-img class="pr-4" max-height="40" max-width="70" contain :src="`${headerIcon}`"/>
        </template>
        <template v-if="postfix!== 'mobile'" v-slot:button>
          <h4 class="block-subheader text-center"
            :style="{color: graphOptions.textColor}">
            {{graphOptions.header}}
          </h4>
        </template>
      </info-hover-tooltip>
      <div class="d-none" v-for="(axis, index) in ranks[0].axes" :id="`${pillarName}${index}`" :key="index">
        <profiles-spider-chart-tooltip
          :code="axis.code"
          :header="$t(`spiders.${axis.code.replaceAll('.','-')}.indicator`)"
          :rank="axis.value"
          :year="axis.year"
          :ismvi="pillarName == 'MVI'"
          :value="values[0].axes[index].value"
          :source="indicatorsMetadata[axis.code].source"
          :definition="$t(`spiders.${axis.code.replaceAll('.','-')}.def`)"
          :link="indicatorsMetadata[axis.code].sourceLink"
        />
      </div>
    <div :class="{'mb-1': postfix==='mobile'}" :id="`graph${pillarName}${postfix}`">
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { mapState } from 'vuex';
import tippy from 'tippy.js';
import InfoHoverTooltip from '@/components/InfoHoverTooltip.vue'
import ProfilesSpiderChartTooltip from './ProfilesSpiderChartTooltip';
import format from '@/mixins/format.mixin'

export default {
  name: 'ProfilesSpiderChart',
  components:{
    ProfilesSpiderChartTooltip,
    InfoHoverTooltip
  },
  mixins:[format],
  props: {
    ranks: {
      type: Array
    },
    values: {
      type: Array
    },
    pillarName: {
      type: String,
      default: 'Climate'
    },
    postfix: {
      type: String,
      default: ''
    },
    graphOptions: {
      type: Object,
      default: ()=>({})
    },
    headerText: {
      type: String,
      default: ''
    },
    maxValue: {
      type: Number,
      default: 50
    },
    tooltipContentName: {
      type: String
    },
    headerIcon:null
  },
  data: ()=>({
    defaultGraphOptions: {
      w: 500,        //Width of the circle
      h: 500,        //Height of the circle
      margin: { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
      levels: 3,        //How many levels or inner circles should there be drawn
      maxValue: 42,       //What is the value that the biggest circle will represent
      labelFactor: 1.25,   //How much farther than the radius of the outer circle should the labels be placed
      wrapWidth: 80,     //The number of pixels after which a label needs to be given a new line
      opacityArea: 0.35,   //The opacity of the area of the blob
      dotRadius: 4,       //The size of the colored circles of each blog
      opacityCircles: 0.1,   //The opacity of the circles of each blob
      strokeWidth: 2,     //The width of the stroke around each blob
      roundStrokes: false,  //If true the area and stroke will follow a round path (cardinal-closed)
      color: d3.scaleOrdinal(d3.schemeCategory10),  //Color function,
      format: '.2%',
      unit: '',
      spin: 0,
      textFormat: 1
    }
  }),
  computed:{
    ...mapState({
      profiles: state => state.profiles.profiles,
      indicatorsMetadata: state => state.profiles.indicatorsMetadata
    }),
    fullGraphOptions(){
      return Object.assign({} ,this.defaultGraphOptions, this.graphOptions);
    },
    locale() {
      return this.$i18n.locale
    },
    maxAxisValue() {
      return this.ranks.reduce((maxCountriesValue, country)=>{
        const currentCountryMax = country.axes.reduce((maxAxesValue, axe)=>{
          if(isNaN(parseInt(axe.value))) {
            return maxAxesValue
          }
          return maxAxesValue > axe.value ? maxAxesValue : axe.value;
        }, this.maxValue);
        return maxCountriesValue > currentCountryMax ? maxCountriesValue : currentCountryMax;
      }, this.maxValue);
    }
  },
  methods:{
    drawGraph(){
      let rootThis = this;
      const wrap = (text) => {
        text.each(function () {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.4, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            bodyText = d3.select(document.body).append('svg').append('text')
            .style("font-size", "10px"),
            dy = parseFloat(text.attr("dy")),
            tspan = bodyText.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            word  =  words.pop();
            text.text(null)
          text.attr("width", '80px')
          while (word) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > 80) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = bodyText.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
            word  =  words.pop();
          }
          bodyText.selectAll('tspan').each((i,k,f) => {
            text.append(() => {return f[k]})
          })
          d3.selectAll('body > svg').remove()
        });
      }

      let allAxis = this.ranks[0].axes.map((i) => i.code),  //Names of each axis
      total = allAxis.length,          //The number of different axes
      radius = Math.min(this.fullGraphOptions.w / 2, this.fullGraphOptions.h / 2),   //Radius of the outermost circle
      angleSlice = Math.PI * 2 / total,    //The width in radians of each "slice"
      rScaleNormal = d3.scaleLinear()
          .range([0, radius])
          .domain([0, this.maxAxisValue]),
      rScale,
      HALF_PI = Math.PI / 2;

      //Scale for the radius
      if (this.pillarName == "MVI" || this.pillarName=="customIndex") {
        rScale = rScaleNormal;
      } else {
        rScale = d3.scaleLinear()
          .range([0, radius])
          .domain([this.maxAxisValue, 1]);
      }

      const parent = d3.select(`#graph${this.pillarName}${this.postfix}`);

      //Remove whatever chart with the same id/class was present before
      parent.select("svg").remove();

      //Initiate the radar chart SVG
      let svg = parent.append("svg")
        .attr("width", this.fullGraphOptions.w + this.fullGraphOptions.margin.left + this.fullGraphOptions.margin.right)
        .attr("height", this.fullGraphOptions.h + this.fullGraphOptions.margin.top + this.fullGraphOptions.margin.bottom)
        .attr("class", "radar")
        .attr("display", "inline-block")
        .attr("margin", "auto")
        .attr("pointer-events","none");

      //Append a g element
      let g = svg.append("g")
        .attr("transform", "translate(" + (this.fullGraphOptions.w / 2 + this.fullGraphOptions.margin.left) + "," + (this.fullGraphOptions.h / 2 + this.fullGraphOptions.margin.top) + ")");

      //Filter for the outside glow
      let axisGrid = g.append("g").attr("class", "axisWrapper");


      let filter = g.append('defs').append('filter').attr('id', 'glow');
      filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
      let feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      //Draw the background circles
      axisGrid.selectAll(".levels")
        .data(d3.range(1, (this.fullGraphOptions.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / this.fullGraphOptions.levels * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", this.fullGraphOptions.opacityCircles)
        .style("filter", "url(#glow)");

      //Text indicating at what % each level is
      axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (this.fullGraphOptions.levels + 1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / this.fullGraphOptions.levels)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "black")

      if (this.pillarName == "MVI"||this.pillarName=="customIndex") {
        axisGrid.selectAll(".axisLabel").text(d => this.nFormatter(this.maxAxisValue * d / this.fullGraphOptions.levels))
      }
      else {
        axisGrid.selectAll(".axisLabel").text(d => this.rankFormat(this.nFormatter(this.maxAxisValue - this.maxAxisValue * d / this.fullGraphOptions.levels + 1)))
      }

      //Create the straight lines radiating outward from the center
      let axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

      axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScaleNormal(this.maxAxisValue * 1.1) * Math.cos(angleSlice * i - HALF_PI - this.fullGraphOptions.spin))
        .attr("y2", (d, i) => rScaleNormal(this.maxAxisValue * 1.1) * Math.sin(angleSlice * i - HALF_PI - this.fullGraphOptions.spin))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px")
        .style("pointer-events","none");


      if (this.pillarName != "customIndex") {
        axis.append("text")
          .attr("class", "legend")
          .style("font-size", "10px")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("width", '80px')
          .attr("x", (d, i) => this.fullGraphOptions.textFormat * rScaleNormal(this.maxAxisValue * this.fullGraphOptions.labelFactor) * Math.cos(angleSlice * i - HALF_PI - this.fullGraphOptions.spin))
          .attr("y", (d, i) => -15 / this.fullGraphOptions.textFormat ** 3 + rScaleNormal(this.maxAxisValue * this.fullGraphOptions.labelFactor) * Math.sin(angleSlice * i - HALF_PI - this.fullGraphOptions.spin))
          .text((d) => {return this.$t(`spiders.${d.replaceAll('.','-')}.indicator`)})
          .call(wrap, this.fullGraphOptions.wrapWidth)
          .style("pointer-events","auto")
          .attr("id", (d, i) => `${rootThis.pillarName}axis${i}${this.postfix}`)
          .on('click', (d)=>{
            rootThis.$router.push(`/development-indicators/${d}`)
          })
          this.ranks[0].axes.map((axis, i) => {
            tippy(`#${rootThis.pillarName}axis${i}${this.postfix}`, {
              content() {
                const template = document.getElementById(`${rootThis.pillarName}${i}`);
                return template.innerHTML;
              },
              theme: 'light',
              maxWidth:400,
              interactive: true,
              allowHTML: true,
              appendTo: () => document.body
            });
          })

        axis.append("text")
          .attr("class", "d-none d-print-block")
          .style("font-size", "10px")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("x", (d, i) => this.fullGraphOptions.textFormat * rScaleNormal(this.maxAxisValue * this.fullGraphOptions.labelFactor) * Math.cos(angleSlice * i - HALF_PI - this.fullGraphOptions.spin))
          .attr("y", (d, i) => {
            let lines = document.getElementById(`${rootThis.pillarName}axis${i}${this.postfix}`).children.length
            return (-15 / this.fullGraphOptions.textFormat ** 3 + rScaleNormal(this.maxAxisValue * this.fullGraphOptions.labelFactor) * Math.sin(angleSlice * i - HALF_PI - this.fullGraphOptions.spin)) + lines * 14
          }).text((d) => {
            let value = rootThis.values[0].axes.filter(obj => { return obj.code === d })[0].value;
            let rank = rootThis.ranks[0].axes.filter(obj => { return obj.code === d })[0].value;
            let displayValue = ''
            if(rootThis.pillarName === 'MVI') {
              if(isNaN(value)) {
                displayValue = value
              } else {
                displayValue = rootThis.nFormatter(value,2);
              }
            } else if (isNaN(value)) {
              displayValue = `${value}, ${rootThis.rankFormat(value.toString())}`
            } else {
              displayValue = `${rootThis.nFormatter(value,2)}${rootThis.fullGraphOptions.unit}, ${rootThis.rankFormat(rank.toString())}`;
            }
            return displayValue
          })
          .style("pointer-events","auto")
          .style("font-weight", "bold")
      }
      const radarLine = d3.radialLine()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

      let blobWrapper = g.selectAll(".radarWrapper")
        .data(this.ranks)
        .enter().append("g")
        .attr("class", "radarWrapper");

      const tooltip2 = g.append("text")
        //.attr("class", "tooltip")
        .attr('x', 0)
        .attr('y', 0)
        .attr("class", "spiderTooltip")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style('display', 'none')
        .attr("text-anchor", "middle")
        .attr("z-index", 100)
        .attr("dy", "0.35em");

      blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", function (d) {
          if(rootThis.pillarName === 'MVI') {
            let values = d.axes.map(v => {
              if(v.value === 'No Data') {
                return {
                  axis: v.code,
                  value: 0
                }
              }
              return v
            })
            return radarLine(values);
          }
          return radarLine(d.axes);
        })
        .style("fill", (d, i) => this.fullGraphOptions.color(i))
        .style("fill-opacity", this.fullGraphOptions.opacityArea)
        .style("pointer-events","auto")
        .on('mouseover', function (d) {
          //Dim all blobs
          parent.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", 0.1);
          //Bring back the hovered over blob
          d3.select(this)
            .transition().duration(200)
            .style("fill-opacity", 0.7);

          //tooltip with name of country
          tooltip2
            .attr('x', 0)
            .attr('y', 0)
            .transition()
            .style('display', 'block')
            .text(function () {
              return rootThis.profiles[d.name]["sidsData"].name
            });
        })
        .on('mouseout', () => {
            //Bring back all blobs
            parent.selectAll(".radarArea")
              .transition().duration(200)
              .style("fill-opacity", rootThis.fullGraphOptions.opacityArea);
            tooltip2.transition()
              .style('display', 'none').text('');
          });
      //Create the outlines
      blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", function (d) {
              if(rootThis.pillarName === 'MVI') {
                let values = d.axes.map(v => {
                  if(v.value === 'No Data') {
                    return {
                      axis: v.code,
                      value: 0
                    }
                  }
                  return v
                })
                return radarLine(values);
              }
              return radarLine(d.axes);
            })
            .style("stroke-width", this.fullGraphOptions.strokeWidth + "px")
            .style("stroke", (d, i) => { return this.fullGraphOptions.color(i)})
            .style("fill", "none")
            .style("filter", "url(#glow)")
            .style("pointer-events","none");

      //Append the circles
      blobWrapper.selectAll(".radarCircle")
            .data(d => d.axes)
            .enter()
            .append("circle")
            .attr("class", "radarCircle")
            .attr("r", rootThis.fullGraphOptions.dotRadius)
            .attr("cx", (d, i) => {
              let value = d.value === 'No Data' ? 0 : d.value;
              return rScale(value) * Math.cos(angleSlice * i - HALF_PI - rootThis.fullGraphOptions.spin)})
            .attr("cy", (d, i) => {
              let value = d.value === 'No Data' ? 0 : d.value;
              return rScale(value) * Math.sin(angleSlice * i - HALF_PI - rootThis.fullGraphOptions.spin)})
            .style("fill", "#ffffff")//(d) => this.fullGraphOptions.color(d.id))
            .style("fill-opacity", 0.8)
            .style("pointer-events","none");

      const tooltip = g.append("text")
            .attr('x', 0)
            .attr('y', 0)
            .attr("class", "spiderTooltip")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style('display', 'none')
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")

      //Wrapper for the invisible circles on top
      const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(rootThis.ranks)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

      //Append a set of invisible circles on top for the mouseover pop-up

      blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", rootThis.fullGraphOptions.dotRadius * 1.5)
        .attr("cx", (d, i) => {
          let value = d.value === 'No Data' ? 0 : d.value;
          return rScale(value) * Math.cos(angleSlice * i - HALF_PI - rootThis.fullGraphOptions.spin)})
        .attr("cy", (d, i) => {
          let value = d.value === 'No Data' ? 0 : d.value;
          return rScale(value) * Math.sin(angleSlice * i - HALF_PI - rootThis.fullGraphOptions.spin)})
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function (d) {
            tooltip
              .attr('x', this.cx.baseVal.value)
              .attr('y', this.cy.baseVal.value - 10)
            if (rootThis.pillarName == "MVI") {
              tooltip.transition()
                .style('display', 'block')
                .text(()=>{
                  if(isNaN(d.value)) {
                    return rootThis.$t('root.noData');
                  } else {
                    return rootThis.nFormatter(d.value,2)
                  }
                });
            } else if (rootThis.pillarName=="customIndex") {
              tooltip.transition()
                .style('display', 'block')
                .text(this.nFormatter(d.value,2)+", "+d.code);
            } else {
              tooltip.transition()
                .style('display', 'block')
                .text(function () {
                  let value = rootThis.values[0].axes.filter(obj => { return obj.code === d.code })[0].value
                  if (isNaN(value)) {
                    return rootThis.$t('root.noData') + ", " + rootThis.rankFormat(d.value.toString()) + rootThis.fullGraphOptions.unit
                  }
                  else {
                    return rootThis.nFormatter(value,2) + ", " + rootThis.rankFormat(d.value.toString()) + rootThis.fullGraphOptions.unit;
                  }
                })
              }
              })
              .on("mouseout", function () {
                tooltip.transition()
                  .style('display', 'none').text('');
              });
              return svg;
    },
  },
  watch: {
    ranks() {
      this.$nextTick(this.drawGraph);
    },
    locale() {
      this.$nextTick(this.drawGraph);
    }
  },
  mounted() {
    this.drawGraph();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .graph-container {
    margin: auto;
    max-width: 500px;
    display: flex;
    align-items: center;
    flex-direction: column;
  }
</style>
