import Ripple from "@/core/directives/ripple";

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive("ripple", Ripple);
});
