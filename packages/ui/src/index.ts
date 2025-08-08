// composables
export * from "./composables/useImagePreview";
export * from "./composables/useLockFn";
export * from "./composables/useMessage";
export * from "./composables/useModal";
export * from "./composables/usePaging";
export * from "./composables/usePollingTask";

// components
export const ProAspectRatio = defineAsyncComponent(
    () => import("./components/pro-aspect-ratio.vue"),
);
export const ProButtonCopy = defineAsyncComponent(() => import("./components/pro-button-copy.vue"));
export const ProCard = defineAsyncComponent(() => import("./components/pro-card.vue"));
export const ProChatScroll = defineAsyncComponent(() => import("./components/pro-chat-scroll.vue"));
export const ProColorPicker = defineAsyncComponent(
    () => import("./components/pro-color-picker.vue"),
);
export const ProDatePicker = defineAsyncComponent(() => import("./components/pro-date-picker.vue"));
export const ProDateRangePicker = defineAsyncComponent(
    () => import("./components/pro-date-range-picker.vue"),
);
export const ProEcharts = defineAsyncComponent(() => import("./components/pro-echarts.vue"));
export const ProEditor = defineAsyncComponent(() => import("./components/pro-editor.vue"));
export const ProInfiniteScroll = defineAsyncComponent(
    () => import("./components/pro-infinite-scroll.vue"),
);
export const ProInputPassword = defineAsyncComponent(
    () => import("./components/pro-input-password.vue"),
);
export const ProMarkdown = defineAsyncComponent(
    () => import("./components/pro-markdown/index.vue"),
);
export const ProModal = defineAsyncComponent(() => import("./components/pro-modal.vue"));
export const ProModalUse = defineAsyncComponent(() => import("./components/pro-modal-use.vue"));
export const ProPaginaction = defineAsyncComponent(() => import("./components/pro-pagination.vue"));
export const ProPlaceholder = defineAsyncComponent(
    () => import("./components/pro-placeholder.vue"),
);
export const ProScrollArea = defineAsyncComponent(() => import("./components/pro-scroll-area.vue"));
export const ProSlider = defineAsyncComponent(() => import("./components/pro-slider.vue"));
export const ProTimePicker = defineAsyncComponent(() => import("./components/pro-time-picker.vue"));
export const ProUploader = defineAsyncComponent(() => import("./components/pro-uploader.vue"));

// utils
export * from "./utils/date-format";
