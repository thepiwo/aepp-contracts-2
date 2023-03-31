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

class Result {
  error?: string;
  info?: string;
  final: boolean = false;

  setError(error: string) {
    this.error = error;
    this.info = undefined;
    this.final = false;
  }
  setInfo(info: string) {
    this.info = info;
    this.error = undefined;
    this.final = false;
  }

  setFinal(info: string) {
    this.info = info;
    this.error = undefined;
    this.final = true;
  }

  reset() {
    this.info = undefined;
    this.error = undefined;
    this.final = false;
  }
}

export const useContractStore = defineStore("contract", () => {
  const contractCode: Ref<string> = ref(example);
  const aci: Ref<string> = ref("");
  const byteCode: Ref<string | undefined> = ref();

  const deployData = ref({
    args: "",
    options: structuredClone(defaultCallOptions),
  });
  const deployResult: Ref<Result> = ref(new Result());

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
    byteCode.value = undefined;
    deployResult.value.reset();

    await sdkStore.aeSdk?.compilerApi
      .compileBySourceCode(contractCode.value)
      .then((result) => {
        byteCode.value = result.bytecode;
        aci.value = JSON.stringify(result?.aci, null, 2);
      });
  }

  async function initializeContractFromAci() {
    byteCode.value = "calling at address doesn't need bytecode";
    deployResult.value.setInfo("Instantiating Contract at address ...");

    const opts: { aci: any } | { source: string } = aci.value
      ? { aci: JSON.parse(aci.value) }
      : { source: contractCode.value };

    await sdkStore.aeSdk
      ?.initializeContract({
        ...opts,
        address: `ct_${contractAddress.value?.replace("ct_", "")}`,
      })
      .then((instance) => {
        contractInstance = instance;
        deployResult.value.setFinal(
          `Instantiated Contract at address: ${contractAddress.value}`
        );
      })
      .catch((error) => {
        if (error instanceof Error) deployResult.value.setError(error.message);
        return undefined;
      });
  }

  async function deployContract() {
    const args = argsStringToArgs(deployData.value.args);

    deployResult.value.setInfo("Deploying Contract ...");
    contractInstance = await sdkStore.aeSdk?.initializeContract({
      sourceCode: contractCode.value,
    });

    const options = Object.fromEntries(
      Object.entries(deployData.value.options).filter(([_, v]) => v != null)
    );

    contractInstance
      ?.$deploy(args, options)
      .then((deployed) => {
        contractAddress.value = deployed?.result?.contractId;
        deployResult.value.setFinal(
          `Deployed, and mined at this address: ${contractAddress.value}`
        );
      })
      .catch((error) => {
        if (error instanceof Error) deployResult.value.setError(error.message);
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
    contractAddress,

    deployData,
    deployResult,
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
