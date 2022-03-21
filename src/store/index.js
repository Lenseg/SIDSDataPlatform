import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import sids from '@/store/sids.store'
import indicators from '@/store/indicators.store'
import goals from '@/store/goals.store'
import profiles from '@/store/profiles.store'
import texts from '@/store/texts.store'
import loader from '@/store/loader.store'

export default new Vuex.Store({
  modules: {
    sids,
    indicators,
    goals,
    profiles,
    texts,
    loader
  }
});
