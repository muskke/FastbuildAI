<template>
    <view class="content">
        <image class="logo" :src="LogoImg" />
        <view class="text-area">
            <text class="title">{{ title }}</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import LogoImg from "@fastbuildai/assets/images/logo.svg";
import { ref } from "vue";
import { defineOptions } from "vue";

// 定义组件名称为多词组合，解决 vue/multi-word-component-names 警告
defineOptions({
    name: "IndexPage",
});

const title = ref("Hello FastbuildAI");
</script>

<style>
.content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.logo {
    height: 200rpx;
    width: 200rpx;
    margin-top: 200rpx;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 50rpx;
}

.text-area {
    display: flex;
    justify-content: center;
}

.title {
    font-size: 36rpx;
    color: #8f8f94;
}
</style>
