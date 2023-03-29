<template>
  <div class="w-1/2 p-4 bg-gray-200 rounded-sm shadow" v-if="byteCode">
    <h2 class="py-2">
      Byte Code
      <span
        class="block w-full text-xs"
        v-bind:class="{
          'text-red': !contractInstance,
          'text-green': contractInstance,
        }"
      >
        {{ deployInfo }}
      </span>
    </h2>
    <textarea
      v-model="byteCode"
      class="h-16 w-full font-mono bg-black text-white text-xs mb-4 p-4"
    ></textarea>

    <div class="mt-2 mb-2" v-if="deployError">
      <label class="text-xs block mb-1 text-red">Deploy Errors:</label>
      <textarea
        v-model="deployError"
        class="h-16 w-full text-red-500 bg-black text-xs mb-4 p-4 font-mono"
      ></textarea>
    </div>

    <div class="flex -mx-2 mt-4 mb-4">
      <div class="mx-2 w-1/3">
        <label class="text-xs block mb-1" for="deployFunc">Function</label>
        <input
          v-model="deployFunc"
          class="w-full p-2"
          id="deployFunc"
          type="text"
          disabled
        />
      </div>
      <div class="mx-2 w-2/3">
        <label class="text-xs block mb-1" for="deployArgs">Arguments</label>
        <input
          v-model="deployArgs"
          class="w-full p-2"
          id="deployArgs"
          type="text"
          placeholder="comma separated args"
        />
      </div>
    </div>
    <div class="flex -mx-2 mt-4 mb-4">
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="dGasPrice"
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
          v-model.number="deployOptions.gasPrice"
          class="w-full p-2"
          id="dGasPrice"
          type="number"
          min="1000000000"
          placeholder="gas price"
        />
      </div>
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="dAmount"
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
          v-model.number="deployOptions.amount"
          class="w-full p-2"
          id="dAmount"
          type="number"
          min="0"
          placeholder="amount"
        />
      </div>
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="dFee"
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
          v-model.number="deployOptions.fee"
          class="w-full p-2"
          id="dFee"
          type="number"
          placeholder="auto"
        />
      </div>
      <div class="mx-2 w-1/4">
        <label class="text-xs block mb-1" for="dGas">Gas Limit</label>
        <input
          v-model.number="deployOptions.gas"
          class="w-full p-2"
          id="dGas"
          type="number"
          min="0"
          placeholder="auto"
        />
      </div>

      <input
        v-model="deployOptions.callData"
        class="w-full p-2"
        type="hidden"
      />
    </div>

    <button
      class="py-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
      @click="deployContract"
    >
      Deploy
    </button>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useContractStore } from "../stores/contractStore";

const contractStore = useContractStore();
const {
  deployInfo,
  byteCode,
  deployError,
  deployFunc,
  deployArgs,
  deployOptions,
} = storeToRefs(contractStore);
const { contractInstance, deployContract } = contractStore;
</script>
