<template>
  <v-app>
    {{questions}}
  </v-app>
</template>

<script>
import _ from "lodash"
import axios from "axios/dist/axios.min"

export default {
  data() {
    return {
      questions: []
    }
  },
  mounted: function() {
    axios.get('./api/puzzle')
      .then(response=>{
        this.questions = response.data
      })
  }
}
</script>

<style lang="scss">
</style>