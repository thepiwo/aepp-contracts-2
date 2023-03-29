import { defineStore } from "pinia";
import { Contract } from "@aeternity/aepp-sdk";
import { computed, Ref, ref } from "vue";
import { useSdkStore } from "./sdkStore";
import { argsStringToArgs } from "../utils/utils";
import "../utils/toJsonExtensions";

const example = `@compiler >= 4

contract Example =
  entrypoint example(x : int) = x`;

const defaultCallOptions = {
  gasPrice: 1000000000,
  amount: 0,
  fee: null, // sdk will automatically select this
  gas: null, // sdk will automatically select this
  callData: "",
};

export const useContractStore = defineStore("contract", () => {
  const contractCode: Ref<string> = ref(example);
  const aci: Ref<string> = ref("");
  const byteCode: Ref<string> = ref("");

  const deployFunc = ref("init");
  const deployArgs = ref("");
  const deployError = ref(null);
  const deployOptions = ref(defaultCallOptions);
  const deployInfo = ref("");

  const staticFunc = ref("example");
  const staticGas = ref(1000000);
  const staticArgs = ref("");
  const staticRes = ref("");

  const callFunc = ref("");
  const callArgs = ref("");
  const callRes = ref("");
  const callWaiting = ref(false);
  const callOptions = ref(defaultCallOptions);

  const compileError = ref(null);
  const contractAddress: Ref<string | undefined> = ref();

  let contractInstance: Contract<any> | undefined = undefined;
  const initializedContractInstance = computed(() => contractInstance);

  const sdkStore = useSdkStore();

  async function compileContractFromSource() {
    await sdkStore.aeSdk?.compilerApi
      .compileBySourceCode(contractCode.value)
      .then((result) => {
        byteCode.value = result.bytecode;
        aci.value = JSON.stringify(result?.aci, null, 2);
      });
  }

  async function initializeContractFromAci() {
    byteCode.value = "calling at address doesn't need bytecode";
    deployInfo.value = "Instantiating Contract at address ...";

    const opts: { aci: any } | { source: string } = aci.value
      ? { aci: JSON.parse(aci.value) }
      : { source: contractCode.value };

    contractInstance = await sdkStore.aeSdk?.initializeContract({
      ...opts,
      address: `ct_${contractAddress.value?.replace("ct_", "")}`,
    });
  }

  async function deployContract() {
    const args = argsStringToArgs(deployArgs.value);

    console.log(`Deploying contract...`);
    contractInstance = await sdkStore.aeSdk?.initializeContract({
      sourceCode: contractCode.value,
    });

    const options = Object.fromEntries(
      Object.entries(deployOptions.value).filter(([_, v]) => v != null)
    );

    contractInstance?.$deploy(args, options).then((deployed) => {
      contractAddress.value = deployed?.result?.contractId;
      deployInfo.value = `Deployed, and mined at this address: ${contractAddress.value}`;
    });
  }

  async function callContractStatic() {
    const args = argsStringToArgs(staticArgs.value);

    const options = { callStatic: true, gas: staticGas.value };

    contractInstance?.$call(staticFunc.value, args, options).then((result) => {
      staticRes.value = `Result: ` + JSON.stringify(result?.decodedResult);
    });
  }

  async function callContract() {
    callWaiting.value = true;
    const args = argsStringToArgs(callArgs.value);
    const options = Object.fromEntries(
      Object.entries(callOptions.value).filter(([_, v]) => v != null)
    );

    contractInstance?.$call(callFunc.value, args, options).then((result) => {
      callRes.value = `Gas Used: ${
        result?.result?.gasUsed
      } <br><br>---<br><br> Result: <br><br> ${JSON.stringify(
        result?.decodedResult
      )}`;
      callWaiting.value = false;
    });
  }

  return {
    contractCode,
    aci,
    byteCode,

    deployFunc,
    deployArgs,
    deployError,
    contractAddress,
    deployOptions,
    deployInfo,
    deployContract,

    compileError,
    contractInstance: initializedContractInstance,
    compileContractFromSource,

    initializeContractFromAci,

    staticFunc,
    staticGas,
    staticArgs,
    staticRes,
    callContractStatic,

    callFunc,
    callOptions,
    callArgs,
    callRes,
    callWaiting,
    callContract,
  };
});
