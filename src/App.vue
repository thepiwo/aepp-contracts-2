<template>
  <Editor />
</template>

<script setup lang="ts">
import Editor from "./components/Editor.vue";

import { useSdkStore } from "./stores/sdkStore";
import { onMounted } from "vue";

const sdkStore = useSdkStore();
const { initSdk } = sdkStore;

onMounted(() => initSdk());
</script>
