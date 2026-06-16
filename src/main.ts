import { createApp } from "vue";
import App from "./App.vue";
import "./styles/app.css";

document.body.dataset.state = "loading";

createApp(App).mount("#app");
