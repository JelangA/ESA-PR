<template>
  <div id="products-app" class="products-microfrontend">
    <!-- Debug router info -->
    <div v-if="showDebugBoxes" style="padding: 10px; background: #ffebee; border: 1px solid #f44336; margin: 10px 0;">
      <strong>🔍 Vue App Debug:</strong> 
      <br>Current Vue Route: {{ $route.path }}
      <br>Route Name: {{ $route.name }}  
      <br>Route Params: {{ JSON.stringify($route.params) }}
      <br>Router Ready: {{ $router ? 'Yes' : 'No' }}
      <br><button @click="showDebugBoxes = false" style="margin-top: 5px; padding: 2px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">
        ✕ Hide All Debug
      </button>
    </div>
    <router-view v-slot="{ Component }">
      <div v-if="showDebugBoxes" style="padding: 10px; background: #e8f5e8; border: 1px solid #4caf50; margin: 10px 0;">
        <strong>🎯 Vue Router-View Debug:</strong> 
        <br>Component: {{ Component ? (Component.type.__name || Component.type.name || Component.name || 'ProductList') : 'No Component' }}
        <br>Route Name: {{ $route.name }}
        <br>Loading: {{ !Component ? 'Yes' : 'No' }}
      </div>
      <component :is="Component" v-if="Component" />
    </router-view>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const showDebugBoxes = ref(false); // Toggle debug boxes - set to false for clean UI
</script>
<style scoped>
.products-microfrontend {
  min-height: 400px;
}
</style>
