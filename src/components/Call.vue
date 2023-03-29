<template>
  <div
    v-if="byteCode && contractAddress"
    class="w-full p-4 bg-gray-200 rounded-sm shadow mb-8"
  >
    <h2 class="py-2">⬆ Call Function</h2>
    <div class="flex -mx-2 mt-4 mb-4">
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="cGasPrice"
          >Gas Price
          <a
            class="text-black no-underline"
            target="_blank"
            href="https://en.wikipedia.org/wiki/Atto-"
          >
            (a)</a
          ></label
        >
        <input
          v-model.number="callOptions.gasPrice"
          class="w-full p-2"
          id="cGasPrice"
          type="number"
          min="1000000000"
          placeholder="gas price"
        />
      </div>
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="cAmount"
          >Amount
          <a
            class="text-black no-underline"
            target="_blank"
            href="https://en.wikipedia.org/wiki/Atto-"
          >
            (a)</a
          ></label
        >
        <input
          v-model.number="callOptions.amount"
          class="w-full p-2"
          id="cAmount"
          type="number"
          min="0"
          placeholder="amount"
        />
      </div>
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="cFee"
          >Fee
          <a
            class="text-black no-underline"
            target="_blank"
            href="https://en.wikipedia.org/wiki/Atto-"
          >
            (a)</a
          ></label
        >
        <input
          v-model.number="callOptions.fee"
          class="w-full p-2"
          id="cFee"
          type="number"
          placeholder="auto"
        />
      </div>
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="cGas">Gas Limit</label>
        <input
          v-model.number="callOptions.gas"
          class="w-full p-2"
          id="cGas"
          type="number"
          min="0"
          placeholder="auto"
        />
      </div>

      <input
        v-model="callOptions.callData"
        class="mx-2 w-1/2 p-2"
        type="hidden"
      />
    </div>
    <div class="flex -mx-2 mt-4 mb-4">
      <div class="mx-2 w-1/3">
        <label class="text-xs block mb-1" for="func">Function</label>
        <input
          v-model="callFunc"
          class="w-full p-2"
          id="func"
          type="text"
          placeholder="function"
        />
      </div>
      <div class="mx-2 w-2/3">
        <label class="text-xs block mb-1" for="args">Arguments</label>
        <input
          v-model="callArgs"
          class="w-full p-2"
          id="args"
          type="text"
          placeholder="comma separated args"
        />
      </div>
    </div>

    <div class="mt-2 mb-2" v-if="callRes && !callError">
      <label class="text-xs block mb-1">Call Result</label>
      <div
        class="w-full text-white bg-black text-xs mb-4 p-4 font-mono"
        v-html="callRes"
      ></div>
    </div>
    <div class="mt-2 mb-2" v-if="callError">
      <label class="text-xs block mb-1 text-red">Errors</label>
      <textarea
        v-model="callError"
        class="h-16 w-full text-red-500 bg-black text-xs mb-4 p-4 font-mono"
      ></textarea>
    </div>

    <button
      class="py-2 mr-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
      @click="callContract"
    >
      Call Function
    </button>
    <span v-if="callWaiting" class="text-sm text-red-500"
      >Calling Function...</span
    >
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useContractStore } from "../stores/contractStore";
import { ref } from "vue";

const contractStore = useContractStore();
const {
  contractAddress,
  byteCode,
  callFunc,
  callOptions,
  callArgs,
  callRes,
  callWaiting,
} = storeToRefs(contractStore);
const { callContract } = contractStore;

const callError = ref("");
</script>
