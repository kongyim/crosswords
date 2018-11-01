// fix ie11 es6 support bug
import "core-js/fn/object/assign";
import "core-js/fn/array/includes";
import "core-js/fn/array/find";
import "core-js/fn/array/from";
import "core-js/fn/symbol";
import "core-js/fn/promise";

import _ from "lodash"
import Vue from "vue/dist/vue.min";

import App from "./App.vue";

Vue.mixin({
  filters: {}
})


new Vue({
  el: "#app",
  render: (createElement)=> createElement(App),
  mounted() {

  }
})

