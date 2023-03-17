import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import store from "./utils/store";

createApp(App).use(store).mount("#app");
