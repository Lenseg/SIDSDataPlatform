<template>
  <div :class="{'print-page-wrap' : !countryText, 'profiles-page': countryText}">
    <div :class="{'print-page-wrap' : countryText}">
      <printout-header>
        <template slot="text">
          <b>{{$t('countryNames.'+activeCountryId)}}</b> {{$t('countryProfile.header')}}
        </template>
      </printout-header>
      <v-row class="mt-0 d-none-print profile-header-row" justify="center" :style="isMobile ? {'background-image': `url(${require(`@/assets/media/country-photos/${activeCountryId}.jpg`)})`} : {}">
        <v-col class="d-none d-md-block" cols="12" md="4" offset-lg="2" lg="3">
          <h2 class="page-header mr-3 country-profile-header text-md-right">{{$t('countryProfile.header')}}</h2>
        </v-col>
        <v-col cols="7" sm="6" md="4" lg="3" class="offset-sm-1 offset-md-0 select-column">
          <v-select
            rounded
            class="country-select"
            :value="activeCountryId"
            @change="selectCountry"
            :items="sidsListFilteredNoAverage"
            hide-selected
            menu-props='{auto:false}'
            item-text="name"
            item-value="id"
            outlined
            hide-details
          >

            <template slot="selection" slot-scope="data">
              <div class="mobile-pillar-selector">
                <i
                  class="flag-icon select_icon"
                  :class="'flag-icon-' + flagCodes[data.item.id]"
                ></i>
                {{$t('countryNames.'+data.item.id)}}
              </div>
            </template>
            <template  slot="item" slot-scope="data">
              <div>
                <i
                  class="flag-icon select_icon"
                  :class="'flag-icon-' + flagCodes[data.item.id]"
                ></i>
                {{$t('countryNames.'+data.item.id)}}
              </div>
            </template>
          </v-select>
        </v-col>
        <v-col class="d-none-print ml-auto d-none d-md-block" md="2">
          <div class="select">
            <v-select
              rounded
              dense
              v-model="region"
              :items="regions"
              outlined
            >
              <template slot="selection" slot-scope="data">
                  {{$t('regions.'+data.item)}}
              </template>
              <template  slot="item" slot-scope="data">
                  {{$t('regions.'+data.item)}}
              </template>
            </v-select>
          </div>
        </v-col>
        <v-col class="d-none-print d-flex flex-md-column align-md-end align-center justify-start" cols="2" sm="3" md='1' lg='2'>
          <div class="d-none d-md-block mr-2 mr-md-0">
            <info-button :fab="!isDesktop && !isTablet" :contentName="'aboutThis-profiles'"/>
          </div>
          <export :idsList="selectedCountriesIds"/>
        </v-col>
      </v-row>
      <v-row class="mt-xs-0 mt-sm-0 mb-2 mb-print-0" justify="center" dense>
        <v-col class="pt-xs-0 pt-sm-0" cols="12">
          <country-info-bar
            :profile="activeCountryProfile.Profile"
            :id="activeCountryId"
            :name="activeCountry.name"
          />
        </v-col>
      </v-row>
      <v-row class="mt-8" v-if="noData">
        <v-col offset="2" cols="8">
          <p class="text-center grey--text">{{$t('countryProfile.noCountryData')}}</p>
        </v-col>
      </v-row>
      <v-row class="d-none d-md-flex d-print-flex" v-if="!noData && countryText && countryText.developmentContext" justify="center" dense>
        <v-col cols="12">
          <h2 class="px-4 mb-0">{{countryText.developmentContext.title}}</h2>
          <v-row>
            <v-col class="printing-9" cols='12' md="9">
              <div class="px-4" v-html="countryText.developmentContext.content"></div>
            </v-col>
            <v-col class="printing-3 mb-0" cols='12' md="3">
              <div class=" px-4 text-center mb-3 mb-print-1" v-for="stat in activeCountryProfile.KeyStats.slice(0, 6)" :key="stat.title">
                <h3>{{Math.round(stat.value * 100)/100}} {{stat.unit}}</h3>
                <p class="mb-0">{{stat.title}}</p>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row class="d-md-none d-none-print justify-center" v-if="!noData">
        <v-col cols="11">
          <v-expansion-panels flat accordion>
            <v-expansion-panel v-if="countryText && countryText.developmentContext">
              <v-expansion-panel-header>{{countryText.developmentContext.title}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <div v-html="countryText.developmentContext.content"></div>
                <div class="text-center mb-3" v-for="stat in activeCountryProfile.KeyStats.slice(0, 6)" :key="stat.title">
                  <h3>{{stat.value}} {{stat.unit}}</h3>
                  <p class="mb-0">{{stat.title}}</p>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-divider/>
            <v-expansion-panel v-if="countryText && countryText.successesInDevelopment">
              <v-expansion-panel-header>{{countryText.successesInDevelopment.title}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <div v-html="countryText.successesInDevelopment.content"></div>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-divider/>
            <v-expansion-panel v-if="countryText && countryText.challengesInDevelopment">
              <v-expansion-panel-header>{{countryText.challengesInDevelopment.title}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <div v-html="countryText.challengesInDevelopment.content"></div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
      <v-row justify="center" class="d-none-print d-md-none"  v-if="!noData">
        <v-col cols="9">
          <v-select
            class="country-select"
            rounded
            hide-details
            v-model="tab"
            item-value="name"
            item-text="tabName"
            :items="pillars"
            menu-props='{auto:false}'
            outlined
          >

            <template class="v-select__selection--comma" slot="selection" slot-scope="data">
              <span class="mobile-pillar-selector" :style="getStyleByName(data.item.name)">
                {{ data.item.tabName }}
              </span>
            </template>
            <template slot="item" slot-scope="data">
              <span :style="getStyleByName(data.item.name)">
                {{ data.item.tabName }}
              </span>
            </template>
          </v-select>
        </v-col>
        <v-col cols="2" class="d-flex align-center justify-end">
          <info-hover-tooltip :large="true" v-if="graphOptions[tab]" :contentName="getTabPillar(tab).tooltipName">
            <template v-if="getTabPillar(tab).icon" v-slot:icon>
              <v-img class="pr-4" max-height="40" max-width="70" contain :src="`${getTabPillar(tab).icon}`"/>
            </template>
          </info-hover-tooltip>
        </v-col>
        <v-col class="pt-0" cols="11">
          <div v-for="(pillar, index) in pillars" :key="pillar.name">
            <div v-if="tab === pillar.name">
              <template v-if="index < 3">
                <profiles-spider-chart
                  :graphOptions="graphOptions[pillar.name]"
                  :pillarName="pillar.name"
                  postfix="mobile"
                  :tooltipContentName="pillar.tooltipName"
                  :maxValue="maxValuePillars"
                  :headerIcon="pillar.icon"
                  :ranks="graphRankData[pillar.name]"
                  :values="graphValueData[pillar.name]"/>
              </template>
              <template v-else-if="index === 3">
                <profiles-spider-chart
                  :graphOptions="graphOptions[pillar.name]"
                  :pillarName="pillar.name"
                  postfix="mobile"
                  :headerIcon="pillar.icon"
                  :tooltipContentName="pillar.tooltipName"
                  :maxValue="80"
                  :ranks="graphRankData[pillar.name]"
                  :values="graphValueData[pillar.name]"/>
              </template>
              <template v-else>
                <profiles-finance
                    :countryId="activeCountryId"/>
              </template>
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row class="d-none-print" justify="center"  v-if="!noData">
        <v-col cols="11" md="6">
          <country-multiselect
            :placeholder="$t('countryProfile.infoBox.overlayCountries')"
            :countryActiveIdsList="compareIdsList"
            :countriesToCompare="sidsListMultiselectFiltered"
            :colorScheme="colorScheme"
            @countryChange="setCompareCountries"
          />
        </v-col>
        <v-col cols="3" class="d-flex align-center" md="1">
          <p class="mt-auto mb-auto">{{$t('countryProfile.infoBox.among')}}</p>
        </v-col>
        <v-col cols="6" md="3" lg="2">
          <div class="select">
            <v-select
              rounded
              v-model="rankType"
              @change="changeRankType"
              :items="rankTypes"
              item-text="id"
              item-value="id"
              outlined
              dense
              hide-details
            >
              <template slot="selection" slot-scope="data">
                  {{$t('countryProfile.infoBox.'+data.item.id)}}
              </template>
              <template  slot="item" slot-scope="data">
                  {{$t('countryProfile.infoBox.'+data.item.id)}}
              </template>
            </v-select>
          </div>
        </v-col>
        <v-col cols="2" class="d-flex align-center justify-end">
          <info-hover-tooltip
            :large="true"
            contentClass="tooltip-center"
            contentName="profileTooltip-radar"
          >
            <template v-slot:icon>
              <v-img
                class="pr-4"
                max-height="40"
                max-width="250"
                contain
                src="@/assets/media/goals-icons/sidsOfferPillars.png"/>
            </template>
          </info-hover-tooltip>
        </v-col>
      </v-row>
      <v-row class="mb-4 d-none d-md-flex d-print-flex no-page-break" v-if="!noData && graphRankData && graphValueData" justify="space-between">
        <v-col class="no-page-break" v-for="pillar in pillars.slice(0, 3)" cols="4" :key="pillar.name">
          <profiles-spider-chart
            :graphOptions="graphOptions[pillar.name]"
            :pillarName="pillar.name"
            postfix="print"
            :headerIcon="pillar.icon"
            :tooltipContentName="pillar.tooltipName"
            :maxValue="maxValuePillars"
            :ranks="graphRankData[pillar.name]"
            :values="graphValueData[pillar.name]"/>
        </v-col>
        <v-col class="charts-description mt-0 mb-0" cols="12">
          <p class="mt-0 mb-0 text-center desc-spiders">
            {{radarAnnotation}}
          </p>
        </v-col>
      </v-row>
      <p v-if="!countryText" class="print-page-wrap_footer d-none d-print-block  mb-0 pb-0">
        Live version and links to original data sources available at
        <a class="d-block mt-0 mb-0 pb-0" :href="pageLink">{{pageLink}}</a>
      </p>
    </div>
    <div :class="{'print-page-wrap' : countryText}">
        <v-row class="d-none d-md-flex d-print-flex mt-5" v-if="!noData && countryText && countryText.successesInDevelopment" justify="center" dense>
          <v-col cols="12">
            <h2 class="mb-0 px-4">{{countryText.successesInDevelopment.title}}</h2>
            <div class="px-4" v-html="countryText.successesInDevelopment.content"></div>
          </v-col>
        </v-row>
        <v-row class="d-none d-md-flex d-print-flex no-page-break mb-4 mb-print-0" v-if="!noData">
          <v-col class="mvi-wrapper d-flex flex-column" cols="7">
            <profiles-spider-chart
              class="no-page-break"
              postfix="print"
              :maxValue="80"
              :headerIcon="pillars[3].icon"
              :tooltipContentName="pillars[3].tooltipName"
              :graphOptions="graphOptions['MVI']"
              :pillarName="'MVI'"
              :ranks="graphRankData['MVI']"
              :values="graphValueData['MVI']"/>
            <p class="desc-mvi desc-spiders mt-0 mb-0 text-center">
              {{$t('countryProfile.infoBox.mviAnnotation')}}
            </p>
          </v-col>
          <v-col cols="5">
            <profiles-finance
              :countryId="activeCountryId"/>
          </v-col>
        </v-row>
        <v-row class="d-none d-md-flex d-print-flex" v-if="!noData && countryText && countryText.challengesInDevelopment" justify="center" dense>
          <v-col cols="12">
            <h2 class="px-4 mb-0">{{countryText.challengesInDevelopment.title}}</h2>
            <div class="px-4" v-html="countryText.challengesInDevelopment.content"></div>
          </v-col>
        </v-row>
        <p :v-if="countryText" class=" mb-0 pb-0 print-page-wrap_footer d-none d-print-block">
          Live version and links to original data sources available at
          <a class="d-block mt-0 mb-0 pb-0" :href="pageLink">{{pageLink}}</a>
        </p>
      </div>
  </div>
</template>

<script>
/*global gtag*/

import flagCodes from '@/assets/flagCodes.js'

import PrintoutHeader from '@/components/PrintoutHeader.vue'
import Export from './children/Export.vue'
import CountryInfoBar from './children/CountryInfoBar.vue'
import ProfilesFinance from './children/ProfilesFinance.vue'
import ProfilesSpiderChart from './children/ProfilesSpiderChart.vue'

import InfoButton from '@/components/InfoButton.vue'
import InfoHoverTooltip from '@/components/InfoHoverTooltip.vue'
import CountryMultiselect from '@/components/CountryMultiselect.vue'
import * as d3 from 'd3';
import store from '@/store'
import sizeMixin from '@/mixins/size.mixin'
import { mapState } from 'vuex';

export default {
  name: 'CountryProfiles',
  props:['compareIdsList', 'activeCountryId'],
  mixins:[sizeMixin],
  components: {
    PrintoutHeader,
    Export,
    CountryInfoBar,
    ProfilesSpiderChart,
    ProfilesFinance,
    InfoHoverTooltip,
    InfoButton,
    CountryMultiselect
  },
  data() {
    return {
        flagCodes,
        region:'allSids',
        regions:["allSids","caribbean","ais", "pacific"],
        rankType: 'sids',
        rankTypes: [
          {
            id:'global'
          },{
            id:'region'
          },{
            id:'sids'
          }
        ],
        colorScheme: ["#EDC951", "#CC333F", "#00A0B0", "#FFFFFF"],
        pillars:[{
          name: 'Climate',
          tabName: this.$t('root.pillars.climateAction.name'),
          tooltipName: 'profileTooltip-climate',
          icon: require(`@/assets/media/goals-icons/pillars/climateAction.png`)
        }, {
          name: 'Blue',
          tabName: this.$t('root.pillars.blueEconomy.name'),
          tooltipName: 'profiletooltip-blue',
          icon: require(`@/assets/media/goals-icons/pillars/blueEconomy.png`)
        }, {
          name: 'Digital',
          tabName: this.$t('root.pillars.digitalTransformation.name'),
          tooltipName:'profileTooltip-digital',
          icon: require(`@/assets/media/goals-icons/pillars/digitalTransformation.png`)
        }, {
          name: 'MVI',
          tabName: this.$t('root.mv'),
          tooltipName:'profileTooltip-mvi',
          icon: false
        }, {
          name: 'Finance',
          tabName: 'Finance'
        }],
        tab:'Climate',
        tabs:['Climate','Blue Economy','Digital Transformation','Vulnerability','Finance'],
        graphOptions:{
          Climate: {
            header:this.$t('root.pillars.climateAction.name'),
            w: 200,
            h: 180,
            margin: { top: 50, right: 45, bottom: 30, left: 45 },
            levels: 5,
            spin: 0,
            roundStrokes: false,
            color: d3.scaleOrdinal().range(["#0DB14B", "#EDC951", "#CC333F", "#00A0B0", "#FFFFFF"]),
            textColor: "#0DB14B"
          },
          Blue: {
            header: this.$t('root.pillars.blueEconomy.name'),
            w: 200,
            h: 180,
            margin: { top: 50, right: 45, bottom: 30, left: 45 },
            levels: 5,
            spin: 0,
            roundStrokes: false,
            color: d3.scaleOrdinal().range(["#0BC6FF", "#EDC951", "#CC333F", "#00A0B0", "#FFFFFF"]),
            legend: { title: 'Legend', translateX: 0, translateY: 0 },
            textColor: "#0BC6FF"
          },
          Digital: {
            header:this.$t('root.pillars.digitalTransformation.name'),
            w: 200,
            h: 180,
            margin: { top: 50, right: 45, bottom: 30, left: 45 },
            levels: 5,
            spin: 0,
            roundStrokes: false,
            color: d3.scaleOrdinal().range(["#F58220", "#EDC951", "#CC333F", "#00A0B0", "#FFFFFF"]),
            textColor: "#F58220"
          },
          MVI: {
            header:this.$t('root.mv'),
            w: 320,
            h: 200,
            margin: { top: 70, right: 45, bottom: 60, left: 45 },
            maxValue: 80,
            levels: 4,
            spin: 0,
            textFormat: 1.2,
            opacityArea: 0.2,
            roundStrokes: false,
            color: d3.scaleOrdinal().range(["#8f0045 ", "#EDC951", "#CC333F", "#00A0B0", "#FFFFFF"]),
            textColor: "#9e0909"
        }
      },
      maxValues:{
        global: 200,
        sids:50,
        caribbean:25,
        ais:10,
        pacific:16
      }
    }
  },
  computed:{
    ...mapState({
      sidsList: state => state.profiles.sidsList,
      profiles: state => state.profiles.profiles,
      indicatorsMetadata: state => state.profiles.indicatorsMetadata
    }),
    pageLink() {
      return window.location.toString()
    },
    radarAnnotation() {
      return this.$t('countryProfile.infoBox.radarAnnotation.'+this.rankType)
    },
    countryText(){
      let langMap = {
        'en': 'English',
        'pt': 'Portuguese',
        'fr': 'French',
        'es': 'Spanish',
      }
      return this.activeCountryProfile[langMap[this.locale]] ? this.activeCountryProfile[langMap[this.locale]] : this.activeCountryProfile[langMap.English]
    },
    locale() {
      return this.$i18n.locale
    },
    noData() {
      let dataPoints = Object.keys(this.graphValueData).reduce((sum, pillarCode) => {
        let pillarSum = this.graphValueData[pillarCode][0].axes.reduce((pillarSum, indi) => {
          if(indi.value !== 'No Data') {
            return pillarSum + 1;
          }
          return pillarSum
        },0)
        return sum + pillarSum
      },0)
      return dataPoints < 4
    },
    sidsListMultiselectFiltered() {
      if(this.rankType === 'region') {
        return this.sidsList.filter(country => {
          return country.region === this.activeCountryProfile.sidsData.region
        });
      } else {
        return this.sidsList
      }
    },
    sidsListFiltered() {
      if(this.region === 'allSids') {
        return this.sidsList
      } else {
        return this.sidsList.filter(country => {
          return country.region === this.region ||
            this.compareIdsList.includes(country.id) ||
            country.id === this.activeCountryId
        });
      }
    },
    sidsListFilteredNoAverage(){
      return this.sidsListFiltered.filter(country => {
        return !country.average
      })
    },
    maxValuePillars(){
      if(this.rankType !== 'region') {
        return this.maxValues[this.rankType]
      }
      return this.maxValues[this.activeCountryProfile.Profile[0].value.toLowerCase()]
    },
    graphValueData() {
      let result = {};
      this.pillars.map(pillar => {
        result[pillar.name] = this.selectedCountriesIds.map(countryId => {
          let countryAxes = this.profiles[countryId][pillar.name].map(axis => {
            return {
              axis: this.indicatorsMetadata[axis.axis].indicator,
              value: axis.value,
              code: axis.axis
            }
          })
          return {
            name: countryId,
            axes: countryAxes
          }
        })
      })
      return result
    },
    graphRankData() {
      let result = {};
      this.pillars.map(pillar => {
        result[pillar.name] = this.selectedCountriesIds.map(countryId => {
          let countryAxes = this.profiles[countryId][pillar.name].map(axis => {
            let rank = this.rankType + 'Rank'
            return {
              axis: this.indicatorsMetadata[axis.axis].indicator,
              value: axis[rank] || axis.value,
              code: axis.axis,
              year: axis.year
            }
          })
          return {
            name: countryId,
            axes: countryAxes
          }
        })
      })
      return result
    },
    activeCountryProfile() {
      return this.profiles[this.activeCountryId];
    },
    activeCountry() {
      return this.sidsList.find(country => country.id === this.activeCountryId);
    },
    selectedCountriesIds() {
      return [this.activeCountryId, ...this.compareIdsList]
    },
  },
  methods:{
    selectCountry(country) {
      gtag('event', 'country_select_profiles', {
        country
      });
      this.$router.push({
        name:'Country Profiles',
        params:{country}
      })
    },
    changeRankType() {
      this.setCompareCountries([]);
    },
    setCompareCountries(value) {
      this.$router.push({
        query: {
          compare: value.toString()
        }
      })
      gtag('event', 'country_compare_list', {
        compare: value.toString()
      });
    },
    removeCountry(countryId) {
      this.setCompareCountries(this.compareIdsList.filter(compareCountryId => compareCountryId !== countryId))
    },
    getStyleByName(name) {
      return this.graphOptions[name] ? `color:${this.graphOptions[name].textColor}` : '';
    },
    getTabPillar(name) {
      return this.pillars.find(pillar => name === pillar.name)
    },
  },
  async beforeRouteEnter(to, from, next) {
    try {
      await store.dispatch('profiles/getCountryProfile', to.params.country);
      if(to.query.compare) {
        await Promise.all(to.query.compare.split(',').map(async (id) => {
          await store.dispatch('profiles/getCountryProfile', id);
        }));
      }
      next()
    } catch (e) {
      next(from)
    }
  },
  async beforeRouteUpdate(to, from, next) {
    try {
      await store.dispatch('profiles/getCountryProfile', to.params.country);
      if(to.query.compare) {
        await Promise.all(to.query.compare.split(',').map(async (id) => {
          await store.dispatch('profiles/getCountryProfile', id);
        }));
      }
      next()
    } catch (e) {
      next(from)
    }
  },
}
</script>
<style media="screen">
  .country-select {
    font-size: 18px !important;
    font-weight: bold;
  }
  .country-select .v-input__append-inner{
    margin-top: 12px !important;
  }
  .select_icon {
    display: inline-block;
    margin-right: 10px;
  }
  .profile-header-row {
    background-size: cover;
  }
  .graph-tabs {
    background-color: transparent !important;
  }
 @media all and (max-width:959px) {
   .profile-header-row {
     padding-top: 25vh;
     padding-bottom: 20px;
   }
 }
 @media print {
   .profiles-page {
     max-height: 2980px;
     overflow: hidden;
   }
 }
 .desc-spiders {
   width: 80%;
   text-align: center;
   margin: 0 auto 0 !important;
   font-size:12px;
 }
 .mvi-wrapper {
   position: relative;
 }
.mobile-pillar-selector {
  margin: 6px 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profiles-page .v-expansion-panel::after {
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
}
</style>
