import { defineStore } from "pinia";
import { Contract } from "@aeternity/aepp-sdk";
import { computed, Ref, ref } from "vue";
import { useSdkStore } from "./sdkStore";
import {
  argsStringToArgs,
  defaultCallOptions,
  exampleContractCode,
  getContract,
  persistContract,
  Result,
} from "../utils/utils";
import "../utils/toJsonExtensions";

export const useContractStore = defineStore("contract", () => {
  const contractCode: Ref<string> = ref(structuredClone(exampleContractCode));
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
  const callOptions = ref(structuredClone(defaultCallOptions));

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
        persistContract(contractCode.value, aci.value, contractAddress.value);
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
        persistContract(contractCode.value, aci.value, contractAddress.value);
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
        persistContract(contractCode.value, aci.value, contractAddress.value);
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

  async function initContractState() {
    const persistedContract = getContract();
    contractCode.value =
      persistedContract.contractCode || structuredClone(exampleContractCode);
    aci.value = persistedContract.aci || "";
    contractAddress.value = persistedContract.contractAddress || "";
    if (aci.value && contractAddress.value) await initializeContractFromAci();
  }

  async function resetContractState() {
    contractInstance = undefined;
    contractCode.value = structuredClone(exampleContractCode);
    aci.value = "";
    contractAddress.value = undefined;
    byteCode.value = undefined;
    deployData.value = {
      args: "",
      options: structuredClone(defaultCallOptions),
    };
    deployResult.value = new Result();
    staticFunc.value = "example";
    staticGas.value = 1000000;
    staticArgs.value = "";
    staticRes.value = "";
    callFunc.value = "";
    callArgs.value = "";
    callRes.value = "";
    callWaiting.value = false;
    callOptions.value = structuredClone(defaultCallOptions);
    compileError.value = null;

    await persistContract(contractCode.value, aci.value, contractAddress.value);
  }

  return {
    contractCode,
    aci,
    byteCode,
    contractAddress,
    initContractState,
    resetContractState,

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
