<script setup lang="ts">
import Chat from "../_components/chat.vue";

definePageMeta({ auth: false, activePath: "/public/square" });
</script>

<template>
    <Chat billingMode="user" />
</template>
