<template>
  <v-card class="background-grey histogram_frame pt-1 mr-4 ml-4 mr-md-0 ml-md-0">
    <div
      v-if="activeLayer"
      class="pic app-body population-per-km col-flex"
    >
      <div v-if="hasData" class="d-flex d-md-block">
        <div  class="d-flex justify-center legend-title mr-4 ml-4 align-center">
          <span v-html="activeLayer.units"></span>
        </div>
        <div v-if="legendPoints" class="legend main-legend pb-1 pb-md-0">
          <div
            class="d-flex justify-space-between mr-2 mr-md-1 ml-2 ml-md-1 ml-md-14"
          >
            <div class="legend-item" :key="index" v-for="(item,index) in legendPoints">
              <div class="legend-item_text">{{item.text}}</div>
            </div>
          </div>
          <div class="legend-categories mr-3 mr-md-2 ml-3 ml-md-2 ml-md-15" :style="gradient">
          </div>
        </div>
        <canvas
          class="d-none d-md-block"
          :id="'histogram'+ hexIndex"
          width="320"
          height="115"
        ></canvas>
      </div>
      <v-card-text class="pt-2 pb-2" v-else>
        {{$t('gis.legend.noData')}}
      </v-card-text>
    </div>
    <v-card-text class="pt-2 pb-2" v-else>
      {{$t('gis.legend.selectDataset')}}
    </v-card-text>
  </v-card>
</template>

<script>
import format from "@/mixins/format.mixin";
import { Chart, BarController, BarElement, PointElement,CategoryScale, LinearScale, Tooltip, LogarithmicScale, Title } from "chart.js";

Chart.register(BarController, BarElement, PointElement,CategoryScale, LinearScale, Tooltip, LogarithmicScale, Title);
import chroma from "chroma-js";

export default {
  name: 'LayerDescription',
  data() {
    return {
      legendPoints:null,
      chart:null,
      hasData:true,
      chartOptions: {
        plugins: {
          legend: {
            display: false
          }
        },
        responsive: true,
        tooltips: {
          enabled: false,
        },
        legend: {
          display: false,
        },
        annotation: {
          annotations: [
            {
              type: "line",
              mode: "vertical",
              scaleID: "x-axis-0",
              value: "70%",
              borderColor: "black",
              label: {
                content: "Your Score",
                enabled: true,
                position: "center",
              },
            },
          ],
        },
        scales: {
          y: {
            display: true,
            type: "logarithmic",
            title: {
              display: true,
              text: 'Frequency'
            },
            ticks: {
              maxTicksLimit: 4,
              callback: function (
                value
              ) {
                if (value === 100000000) return "100M";
                if (value === 10000000) return "10M";
                if (value === 1000000) return "1M";
                if (value === 100000) return "100K";
                if (value === 10000) return "10K";
                if (value === 1000) return "1K";
                if (value === 100) return "100";
                if (value === 10) return "10";
                if (value === 1) return "1";
                return null;
              },
            }
          },
          x: {
            grid: {
              offset:false,
              display: true,
            },
            title: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 10
            },
          },
        },
      }
    }
  },
  mixins: [format],
  props:[
    'activeLayer',
    'map',
    'hexIndex'
  ],
  computed:{
    gradient() {
      let gradient = "background: linear-gradient(90deg"
      this.legendPoints.map((point, index) => {
        gradient+= `,${point.color} ${index*25}%`
      });
      gradient = gradient+');'
      return gradient
    }
  },
  methods: {
    updateLegend(e) {
      if(e.noData && e.activeLayer === this.activeLayer) {
        this.hasData = false
        this.chart = null
      } else if(e.activeLayer === this.activeLayer) {
        this.legendPoints = e.breaks.map((item, index) => {
          return {
            text: this.nFormatter(item,2),
            color: e.colorRamp[index]
          }
        })
        this.hasData = true;
        this.$nextTick(() => {
          if(this.chart) {
            this.updateHistogramm(e);
          } else {
            this.initHistogramm(e);
          }
        })
      }
    },
    initHistogramm(e) {
      let canvas = document.getElementById("histogram"+ this.hexIndex),
      data = this.computeData(e.selectedData, e.colorRamp, e.breaks, e.precision);
      this.chartOptions.scales.y.max = data.maxY;
      this.chart = new Chart(canvas, {
        type:'bar',
        data: data.data,
        options: this.chartOptions,
      })
    },
    updateHistogramm(e) {
      let data = this.computeData(e.selectedData, e.colorRamp, e.breaks, e.precision);
      this.chartOptions.scales.y.max = data.maxY;
      this.chart.data = data.data
      this.chart.update(0);
    },
    computeData(
      selectedData, colors, breaks, precision
    ) {
      let newBreaksAndColorRamp = this.computeBreaksAndColorRamp(
        selectedData,
        colors,
        breaks
      );

      let colorRampNew = newBreaksAndColorRamp.colorRamp;
      let breaks_histogram = newBreaksAndColorRamp.histogramBreaks;
      let breaks_precision = [];
      for (let i = 0; i < breaks_histogram.length; i++) {
        breaks_precision.push(this.nFormatter(breaks_histogram[i], precision));
      }

      var histogram_data = Array(200).fill(0);
      for (let i = 0; i < selectedData.length; i++) {
        for (let j = 0; j < 200 - 1; j++) {
          if (
            selectedData[i] >= breaks_histogram[j] &&
            selectedData[i] < breaks_histogram[j + 1]
          ) {
            histogram_data[j] += 1;
          }
        }
        if (selectedData[i] >= breaks_histogram[200 - 1]) {
          histogram_data[200 - 1] += 1;
        }
      }

      var data = {
        labels: breaks_precision.slice(0, -1),
        datasets: [
          {
            barPercentage: 1.0,
            categoryPercentage: 1.0,
            data: histogram_data,
            backgroundColor: colorRampNew,
          },
        ],
      };

      var maxY = Math.pow(10, Math.ceil(Math.log10(Math.max(...histogram_data))));
      var minY = Math.pow(10, Math.ceil(Math.log10(Math.min(...histogram_data))));
      return {
        data,
        maxY,
        minY
      }
    },
    computeBreaksAndColorRamp( data, colors, currentBreaks ) {
      let numBreaks = 4,
      histogram_breaks = chroma.limits(data, 'e', 200),
      break_index = 0,
      break_counters = Array(numBreaks).fill(0);
      for (let i = 0; i < 200; i++) {
        if (histogram_breaks[i] > currentBreaks[break_index + 1]) {
          break_index++;
        }
        break_counters[break_index]++;
      }
      let colorRampNew = [];
      for (let i = 0; i < numBreaks; i++) {
        let colorRampPart = chroma
          .scale([colors[i], colors[i + 1]])
          .mode("lch")
          .colors(break_counters[i]);
        colorRampNew = colorRampNew.concat(colorRampPart);
      }
      return {
        colorRamp: colorRampNew,
        histogramBreaks: histogram_breaks,
      };
    },
  },
  mounted() {
    this.map.on('layerUpdate', this.updateLegend)
  },
  destroyed() {
    this.map.off('layerUpdate', this.updateLegend)
  }
}
</script>

<style>
.histogram_frame {
  height: 200px;
  padding: 0 10px;
  border-radius: 0 !important;
}
.legend-title {
  font-size: 11px;
  font-weight: bold;
}
.legend-item_text {
  font-size: 11px;
  line-height: 14px;
  margin-top: 5px;
  width: 100%;
  text-align: center;;
}
.justify-space-evenly {
  justify-content: space-evenly;
}
.legend-item_point {
  width: 17px;
  height: 15px;
  background: url("~@/assets/polygon.png");
  background-repeat: no-repeat;
  background-size: 101% 101%;
  margin-top: 2px;
  z-index: 4;
}
.legend-categories {
  height: 7px;
}
@media (max-width:959px) {
  /* .background-grey {
    background-color: transparent !important;
  } */
  .histogram_frame {
    height: auto;
    padding: 0;
    border-radius: 22px !important;
  }
  .main-legend {
    width: 100%
  }
}
</style>
