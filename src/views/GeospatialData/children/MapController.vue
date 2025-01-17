<template>
  <div class="map-controller">
    <layers-controller
      :dualModeEnabled="dualModeEnabled"
      :bivariateModeEnabled="bivariateModeEnabled"
      @layersChange="emitUpdate"
      @modeUpdate="emitBivariateToggle"
      @dualModeUpdate="emitDualToggle"
    />
    <layer-description
      class="d-none d-md-block"
      v-if="!bivariateModeEnabled"
      :activeLayer="activeLayer"
      :activeDataset="activeDataset"
    />
    <layer-legend v-if="map && !bivariateModeEnabled"
      :map="map"
      hexIndex="1"
      :activeLayer="activeLayer"
    />
    <layer-legend v-if="map && !bivariateModeEnabled && dualModeEnabled"
      :map="map"
      hexIndex="2"
      :activeLayer="secondLayer"
    />
    <layer-bivar-legend v-if="map && bivariateModeEnabled"
      :map="map"
      :activeLayer="activeLayer"
      :secondLayer="secondLayer"
    />
  </div>
</template>

<script>
import LayersController from './LayersController';
import LayerDescription from './LayerDescription';
import LayerLegend from './LayerLegend';
import LayerBivarLegend from './LayerBivarLegend';
export default {
  name: 'MapController',
  data() {
    return {
      activeLayer:null,
      activeDataset:null,
      secondLayer:null,
      secondDataset:null
    }
  },
  props: [
    "map",
    "dualModeEnabled",
    "bivariateModeEnabled",
  ],
  components:{
    LayersController,
    LayerDescription,
    LayerLegend,
    LayerBivarLegend
  },
  methods:{
    emitUpdate(e) {
      if(this.activeLayer !== e.layer) {
        this.activeLayer = e.layer
        this.activeDataset = e.dataset
        this.$emit("update", e);
      }
      if (this.dualModeEnabled && this.secondLayer !== e.secondLayer) {
        this.secondLayer = e.secondLayer
        this.secondDataset = e.secondDataset
        return this.emitDualUpdate({
          layer:e.secondLayer,
          dataset:e.secondDataset
        });
      }
      this.activeLayer = e.layer
      this.activeDataset = e.dataset
      this.secondLayer = e.secondLayer
      this.secondDataset = e.secondDataset
      if (this.bivariateModeEnabled) {
        return this.emitBivariateUpdate(e);
      }
    },
    emitBivariateToggle(e) {
      this.$emit("toggleBivariate", e);
    },
    emitDualToggle(e) {
      this.$emit("toggleDual", e);
    },
    emitBivariateUpdate(e) {
      this.$emit("updateBivariate", e);
    },
    emitDualUpdate(e) {
      this.$emit("updateDual", e);
    }
  }
}
</script>

<style>
.map-controller {
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
