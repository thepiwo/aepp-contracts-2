<template>
  <div class="home container mx-auto">
    <div class="flex">
      <button
        class="mt-2 mr-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
        v-if="isStatic"
        @click="initExtension"
      >
        Connect Wallet Extension
      </button>
      <button
        class="mt-2 mr-4 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
        @click="modifySettings = !modifySettings"
      >
        <span v-if="isStatic">Modify Local Account</span>
        <span v-if="!isStatic">Use Local Account</span>
      </button>
      <h6 class="mt-4 text-sm text-purple" v-if="!modifySettings && account">
        <span class="font-mono text-black">Account: </span> {{ account }}
      </h6>
    </div>

    <div v-if="!secretKey || !publicKey || !nodeUrl || modifySettings">
      <div class="flex mt-8 mb-8">
        <div class="w-full p-4 bg-gray-200 rounded-sm shadow">
          <h2 class="py-2">Settings</h2>
          <div class="flex -mx-2 mt-4 mb-4">
            <div class="mx-2 w-1/3">
              <label class="text-xs block mb-1" for="host">Host</label>
              <input
                v-model="nodeUrl"
                class="w-full p-2"
                id="host"
                type="text"
                placeholder="https://testnet.aeternity.io"
              />
            </div>
            <div class="mx-2 w-1/3">
              <label class="text-xs block mb-1" for="accountPub"
                >Public Key</label
              >
              <input
                v-model="publicKey"
                class="w-full p-2"
                id="accountPub"
                type="text"
                placeholder="Public Key"
              />
            </div>
            <div class="mx-2 w-1/3">
              <label class="text-xs block mb-1" for="accountPriv"
                >Private Key</label
              >
              <input
                v-model="secretKey"
                class="w-full p-2"
                id="accountPriv"
                type="text"
                placeholder="Private Key"
              />
            </div>
          </div>
          <button
            class="mt-2 mr-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
            @click="saveSettings"
          >
            Save
          </button>
          <button
            class="mt-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
            @click="createKeypair"
          >
            Create Keypair
          </button>
        </div>
      </div>
    </div>

    <h1 class="py-2">
      Test contracts
      <span v-if="!isConnected && !clientError" class="text-sm text-red-500">
        (connecting to {{ nodeUrl }} ...)
      </span>
      <span v-if="!isConnected && clientError" class="text-sm text-red-500">
        {{ clientError }}
      </span>
      <span v-if="isConnected && clientError" class="text-sm text-red-500">
        Error connecting to {{ nodeUrl }} <br />
        {{ clientError }}
      </span>

      <span v-if="isConnected && !clientError" class="text-sm text-green-500">
        ({{ nodeUrl }})
      </span>
    </h1>

    <div class="mt-2 -mx-2" v-if="!clientError">
      <div class="w-full p-4 bg-gray-200 rounded-sm shadow">
        <div class="flex">
          <div class="relative w-8/12">
            <h2 class="py-2 inline-block">Sophia Contract's Code:</h2>
            <h2 class="py-2 inline-block float-right pr-4">or</h2>
          </div>
          <div class="relative w-4/12">
            <h2 class="py-2 inline-block">ACI:</h2>
          </div>
        </div>

        <div class="flex">
          <div class="relative w-8/12 pr-1">
            <codemirror
              v-model="contractCode"
              :autofocus="true"
              :indent-with-tab="true"
              :tab-size="2"
              :extensions="extensions"
              @ready="handleReady"
              style="height: 300px"
            />
          </div>
          <div class="relative w-4/12">
            <codemirror
              v-model="aci"
              :autofocus="true"
              :indent-with-tab="true"
              :tab-size="2"
              :extensions="extensions"
              @ready="handleReady"
              style="height: 300px"
            />
          </div>
        </div>

        <div class="mt-2 mb-2" v-if="compileError">
          <label class="text-xs block mb-1 text-red">Compile Errors:</label>
          <textarea
            v-model="compileError"
            class="h-16 w-full text-red-500 bg-black text-xs mb-4 p-4 font-mono"
          ></textarea>
        </div>

        <div class="flex">
          <div class="relative w-8/12">
            <button
              v-if="isConnected"
              class="mt-2 mr-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
              @click="onCompile"
            >
              Compile
            </button>
            <button
              v-if="isConnected"
              class="mt-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
              @click="resetContract"
            >
              Reset
            </button>
          </div>
          <div class="relative w-4/12">
            <input
              v-if="isConnected"
              v-model="contractAddress"
              class="mt-2 rounded-l-full bg-black hover:bg-purple-500 text-white p-2 px-4"
            />
            <button
              v-if="isConnected"
              class="mt-2 mr-2 rounded-r-full bg-black hover:bg-purple-500 text-white p-2 px-4"
              @click="atAddress"
            >
              at Address
            </button>
          </div>
        </div>
      </div>

      <div class="flex mt-8 mb-8" v-if="byteCode">
        <div class="w-1/2 p-4 bg-gray-200 rounded-sm shadow">
          <h2 class="py-2">
            Byte Code
            <span
              class="block w-full text-xs"
              v-bind:class="{
                'text-red': !deployedContractInstance,
                'text-green': deployedContractInstance,
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
            <div class="mx-2">
              <label class="text-xs block mb-1" for="deployFunc"
                >Function</label
              >
              <input
                v-model="deployFunc"
                class="w-full p-2"
                id="deployFunc"
                type="text"
                disabled
              />
            </div>
            <div class="mx-2">
              <label class="text-xs block mb-1" for="deployArgs"
                >Arguments</label
              >
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
            <div class="mx-2 w-1/5">
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
                v-model.number="deployOpts.gasPrice"
                class="w-full p-2"
                id="dGasPrice"
                type="number"
                min="1000000000"
                placeholder="gas price"
              />
            </div>
            <div class="mx-2 w-1/5">
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
                v-model.number="deployOpts.amount"
                class="w-full p-2"
                id="dAmount"
                type="number"
                min="0"
                placeholder="amount"
              />
            </div>
            <div class="mx-2 w-1/5">
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
                v-model.number="deployOpts.fee"
                class="w-full p-2"
                id="dFee"
                type="number"
                placeholder="auto"
              />
            </div>
            <div class="mx-2 w-1/5">
              <label class="text-xs block mb-1" for="dGas">Gas Limit</label>
              <input
                v-model.number="deployOpts.gas"
                class="w-full p-2"
                id="dGas"
                type="number"
                min="0"
                placeholder="auto"
              />
            </div>

            <input
              v-model="deployOpts.callData"
              class="w-full p-2"
              type="hidden"
            />
          </div>

          <button
            class="py-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
            @click="onDeploy"
          >
            Deploy
          </button>
        </div>
        <div
          v-if="contractAddress"
          class="w-1/2 p-4 bg-gray-200 rounded-sm shadow"
        >
          <h2 class="py-2">⬅ Call Static Function</h2>
          <div class="flex -mx-2 mt-4 mb-4">
            <div class="mx-2 w-1/2">
              <label class="text-xs block mb-1" for="staticFunc"
                >Function</label
              >
              <input
                v-model="staticFunc"
                class="w-full p-2"
                id="staticFunc"
                type="text"
                placeholder="function"
              />
            </div>
            <div class="mx-2 w-1/4">
              <label class="text-xs block mb-1" for="staticGas"
                >Gas Limit</label
              >
              <input
                v-model.number="staticGas"
                class="w-full p-2"
                id="staticGas"
                type="number"
                min="0"
                placeholder="gas"
              />
            </div>
          </div>
          <div class="flex -mx-2 mt-4 mb-4">
            <div class="mx-2 w-full">
              <label class="text-xs block mb-1" for="staticArgs"
                >Arguments</label
              >
              <input
                v-model="staticArgs"
                class="w-full p-2"
                id="staticArgs"
                type="text"
                placeholder="comma separated args"
              />
            </div>
          </div>

          <div class="mt-2 mb-2" v-if="callStaticRes && !callStaticError">
            <label class="text-xs block mb-1">Call Result</label>
            <div
              class="w-full text-white bg-black text-xs mb-4 p-4 overflow-x-scroll font-mono"
            >
              {{ callStaticRes }}
            </div>
          </div>
          <div class="mt-2 mb-2" v-if="callStaticError">
            <label class="text-xs block mb-1 text-red">Errors</label>
            <textarea
              v-model="callStaticError"
              class="h-16 w-full text-red-500 bg-black text-xs mb-4 p-4 font-mono"
            ></textarea>
          </div>

          <button
            class="py-2 rounded-full bg-black hover:bg-purple-500 text-white p-2 px-4"
            @click="onCallStatic"
          >
            Call Static
          </button>
        </div>
      </div>

      <div
        v-if="deployedContractInstance && byteCode"
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
              v-model.number="callOpts.gasPrice"
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
              v-model.number="callOpts.amount"
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
              v-model.number="callOpts.fee"
              class="w-full p-2"
              id="cFee"
              type="number"
              placeholder="auto"
            />
          </div>
          <div class="mx-2 w-1/4">
            <label class="text-xs block mb-1" for="cGas">Gas Limit</label>
            <input
              v-model.number="callOpts.gas"
              class="w-full p-2"
              id="cGas"
              type="number"
              min="0"
              placeholder="auto"
            />
          </div>

          <input
            v-model="callOpts.callData"
            class="mx-2 w-1/2 p-2"
            type="hidden"
          />
        </div>
        <div class="flex -mx-2 mt-4 mb-4">
          <div class="mx-2 w-1/2">
            <label class="text-xs block mb-1" for="func">Function</label>
            <input
              v-model="nonStaticFunc"
              class="w-full p-2"
              id="func"
              type="text"
              placeholder="function"
            />
          </div>
          <div class="mx-2 w-1/2">
            <label class="text-xs block mb-1" for="args">Arguments</label>
            <input
              v-model="nonStaticArgs"
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
          @click="onCallDataAndFunction"
        >
          Call Function
        </button>
        <span v-if="waitingCall" class="text-sm text-red-500"
          >Calling Function...</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref, shallowRef, UnwrapRef } from "vue";
import { Codemirror } from "vue-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { generateKeyPair, getAddressFromPriv } from "@aeternity/aepp-sdk";
import { EditorView } from "codemirror";
import { useStore } from "vuex";
import BigNumber from "bignumber.js";

const store = useStore();

const extensions = [javascript(), oneDark];

// Codemirror EditorView instance ref
const view = shallowRef();
const handleReady = (payload: { view: EditorView }) => {
  view.value = payload.view;
};

const example = `@compiler >= 4

contract Example =
  entrypoint example(x : int) = x`;

const modifySettings = ref(false);
const contractCode: Ref<UnwrapRef<string>> = ref(example);
const aci: Ref<UnwrapRef<string | undefined>> = ref();
const publicKey: Ref<UnwrapRef<string | undefined>> = ref();
const secretKey: Ref<UnwrapRef<string | undefined>> = ref();
const byteCode: Ref<UnwrapRef<string | undefined>> = ref("");
const nodeUrl: Ref<UnwrapRef<string | undefined>> = ref(
  "https://testnet.aeternity.io"
);
const deployedContractInstance: Ref<any | undefined> = ref();
const deployInfo = ref("");
const minedData = ref(false);
const miningStatus = ref(false);

const deployFunc = ref("init");
const deployArgs = ref("");
const staticFunc = ref("example");
const staticGas = ref(1000000);
const staticArgs = ref("");
const nonStaticFunc = ref("");
const nonStaticArgs = ref("");
const contractAddress: Ref<UnwrapRef<string | undefined>> = ref();
const deployOpts = ref({
  gasPrice: 1000000000,
  amount: 0,
  fee: null, // sdk will automatically select this
  gas: null, // sdk will automatically select this
  callData: "",
});
const callOpts = ref({
  gasPrice: 1000000000,
  amount: 0,
  fee: null, // sdk will automatically select this
  gas: null, // sdk will automatically select this
  callData: "",
});
const clientError: Ref<UnwrapRef<string | undefined>> = ref();
const callRes = ref("");
const callError = ref("");
const deployError = ref("");
const compileError = ref("");
const callStaticRes = ref("");
const callStaticError = ref("");
const waitingCall = ref(false);
const isConnected = ref(false);
const isStatic = ref(true);

async function compile(
  code: string
): Promise<{ bytecode: string; aci: object } | undefined> {
  console.log(`Compiling contract...`);
  try {
    return store.getters["aeSdk/aeSdk"].compilerApi.compileBySourceCode(code);
  } catch (err: any) {
    return Promise.reject(
      (compileError.value =
        err.response && err.response.body
          ? err.response.body.map((e: any) => e.message).join("\n")
          : err)
    );
  }
}

const argsStringToArgs = (argsString: string) => {
  return argsString.trim() === ""
    ? []
    : argsString.split(",").map((arg) => {
        return arg.trim();
      });
};

async function deploy(argsString: string, options = {}) {
  const args = argsStringToArgs(argsString);

  console.log(`Deploying contract...`);
  try {
    const contractInstance = await store.getters[
      "aeSdk/aeSdk"
    ].initializeContract({
      sourceCode: contractCode.value,
    });
    // eslint-disable-next-line no-unused-vars
    options = Object.fromEntries(
      Object.entries(options).filter(([_, v]) => v != null)
    );
    debugger;
    deployedContractInstance.value = await contractInstance.$deploy(
      args,
      options
    );
    return contractInstance;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function callStatic(func: string, argsString: string, gas: number) {
  console.log(`calling static func ${func} with args ${argsString}`);
  const args = argsString.split(",").map((arg) => {
    return arg.trim();
  });

  const options = { callStatic: true, gas };
  try {
    return await deployedContractInstance.value?.$call(func, args, options);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function callContract(func: string, argsString: string) {
  const args = argsString.split(",").map((arg) => {
    return arg.trim();
  });

  const options = Object.fromEntries(
    Object.entries(callOpts.value).filter(([_, v]) => v != null)
  );

  console.log(
    `calling a function on a deployed contract with func: ${func}, args: ${args} and options:`,
    options
  );
  try {
    return await deployedContractInstance.value?.$call(func, args, options);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function resetData() {
  compileError.value = "";
  callError.value = "";
  callRes.value = "";
  deployError.value = "";
  callStaticError.value = "";
  deployedContractInstance.value = undefined;
  deployInfo.value = "";
  minedData.value = false;
  miningStatus.value = false;
  byteCode.value = undefined;
  modifySettings.value = false;
}

function onCompile() {
  saveContract();
  resetData();
  compile(contractCode.value).then((result) => {
    contractAddress.value = undefined;
    byteCode.value = result?.bytecode;

    aci.value = result?.aci ? JSON.stringify(result?.aci, null, 2) : undefined;
  });
}

function onDeploy() {
  deployInfo.value = "Deploying and checking for mining status...";
  miningStatus.value = true;

  deploy(deployArgs.value, deployOpts.value) // this waits until the TX is mined
    .then((data) => {
      contractAddress.value = deployedContractInstance.value?.$options.address;
      saveContract();
      deployInfo.value = `Deployed, and mined at this address: ${contractAddress.value}`;
      miningStatus.value = false;
      deployedContractInstance.value = data;
      deployError.value = "";
    })
    .catch((err) => {
      deployError.value =
        err.response && err.response.body
          ? err.response.body.map((e: any) => e.message).join("\n")
          : err;
    });
}

function onCallStatic() {
  if (staticFunc.value) {
    callStatic(staticFunc.value, staticArgs.value, staticGas.value)
      .then((res) => {
        callStaticRes.value = `Result: ` + JSON.stringify(res?.decodedResult);
        callStaticError.value = "";
      })
      .catch((err) => {
        callStaticError.value = err;
      });
  } else {
    callStaticError.value = "Please enter a Function and 1 or more Arguments.";
  }
}

function onCallDataAndFunction() {
  if (nonStaticFunc.value) {
    waitingCall.value = true;
    callContract(nonStaticFunc.value, nonStaticArgs.value)
      .then((dataRes) => {
        callRes.value = `Gas Used: ${
          dataRes?.result.gasUsed
        } <br><br>---<br><br> Result: <br><br> ${JSON.stringify(
          dataRes?.decodedResult
        )}`;
        callError.value = "";
        waitingCall.value = false;
      })
      .catch((err) => {
        callError.value = err;
        waitingCall.value = false;
      });
  } else {
    callError.value = "Please enter a Function and 1 or more Arguments.";
  }
}

async function getClient() {
  await store.dispatch(
    "aeSdk/initSdk",
    isStatic.value ? secretKey.value : undefined
  );

  isConnected.value = true;
  nodeUrl.value = store.state.aeSdk.networkId
    ? store.getters["aeSdk/aeSdk"].api.$host || nodeUrl.value
    : nodeUrl.value;

  isStatic.value = true;

  await fundAccountIfNeeded();
}

function getSecretKey() {
  return (
    window.localStorage.getItem("secret-key") || generateKeyPair().secretKey
  );
}

async function fundAccountIfNeeded() {
  const address = store.state.aeSdk.address;
  const networkId = store.state.aeSdk.networkId;

  const balance = address
    ? await store.getters["aeSdk/aeSdk"].getBalance(address)
    : 0;

  if (
    networkId === "ae_uat" &&
    address &&
    new BigNumber(10000000000000000).gt(balance)
  ) {
    await fetch(`https://faucet.aepps.com/account/${address}`, {
      method: "POST",
    }).catch(console.error);
  }
}

async function createKeypair() {
  const keypair = generateKeyPair();
  publicKey.value = keypair.publicKey;
  secretKey.value = keypair.secretKey;
  if (secretKey.value)
    window.localStorage.setItem("secret-key", secretKey.value);

  await fundAccountIfNeeded();
  await getClient();
  modifySettings.value = false;
}

async function saveSettings() {
  isStatic.value = true;
  if (secretKey.value)
    window.localStorage.setItem("secret-key", secretKey.value);

  await getClient();
  modifySettings.value = false;
}

function saveContract() {
  window.localStorage.setItem("contract-code", contractCode.value);
  if (aci.value) window.localStorage.setItem("aci", aci.value);
  if (contractAddress.value)
    window.localStorage.setItem("contract-address", contractAddress.value);
}

function getContract() {
  contractCode.value = window.localStorage.getItem("contract-code")
    ? window.localStorage.getItem("contract-code") || example
    : example;

  aci.value = window.localStorage.getItem("aci")
    ? window.localStorage.getItem("aci") || undefined
    : undefined;

  contractAddress.value = window.localStorage.getItem("contract-address")
    ? window.localStorage.getItem("contract-address") || undefined
    : undefined;
}

function atAddress() {
  saveContract();
  resetData();

  byteCode.value = "calling at address doesn't need bytecode";

  deployInfo.value = "Instantiating Contract at address ...";
  miningStatus.value = true;

  const opts: { aci: any } | { source: string } = aci.value
    ? { aci: JSON.parse(aci.value) }
    : { source: contractCode.value };

  store.getters["aeSdk/aeSdk"]
    .initializeContract({
      ...opts,
      address: `ct_${contractAddress.value?.replace("ct_", "")}`,
    })
    .then((data: any) => {
      deployInfo.value = `Instantiated Contract at address: ${contractAddress.value}`;
      miningStatus.value = false;
      deployedContractInstance.value = data;
      deployError.value = "";
    })
    .catch((err: any) => {
      deployError.value = err;
    });
}

function resetContract() {
  contractCode.value = example;
  aci.value = "";
  contractAddress.value = undefined;
  byteCode.value = "";
  saveContract();
  resetData();
}

async function initExtension() {
  isConnected.value = true;
  nodeUrl.value = store.state.aeSdk.networkId
    ? store.getters["aeSdk/aeSdk"].api.$host
    : undefined;

  isStatic.value = false;
  await getClient();
}

onMounted(async () => {
  try {
    secretKey.value = getSecretKey();
    publicKey.value = getAddressFromPriv(secretKey.value);

    getContract();
    await getClient();
  } catch (e) {
    console.error(e);
  }
});
</script>
