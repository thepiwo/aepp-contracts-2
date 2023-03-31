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

  const deployData: Ref<{
    args: string;
    options: {
      amount: number;
      callData: string;
      fee: null;
      gas: null;
      gasPrice: number;
    };
  }> = ref({
    args: "",
    options: structuredClone(defaultCallOptions),
  });
  const deployResult: Ref<Result> = ref(new Result());

  const callStaticData: Ref<{ args: string; func: string; gas: number }> = ref({
    func: "example",
    gas: 1000000,
    args: "",
  });
  const callStaticResult: Ref<Result> = ref(new Result());

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
    resetDeployAndCallData();
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
    resetDeployAndCallData();
    deployResult.value.setInfo("Deploying Contract ...");
    const args = argsStringToArgs(deployData.value.args);

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
    callStaticResult.value.setInfo("Dry-Running ...");
    const args = argsStringToArgs(callStaticData.value.args);
    const options = { callStatic: true, gas: callStaticData.value.gas };

    contractInstance
      ?.$call(callStaticData.value.func, args, options)
      .then((result) => {
        callStaticResult.value.setFinal(
          // @ts-ignore
          `Dry-Run Gas Estimate: ${result?.result?.gasUsed}, Fee Estimate: ${result?.tx.fee} aetto`,
          JSON.stringify(result?.decodedResult)
        );
      })
      .catch((error) => {
        if (error instanceof Error)
          callStaticResult.value.setError(error.message);
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

  function resetDeployAndCallData() {
    byteCode.value = undefined;
    deployData.value = {
      args: "",
      options: structuredClone(defaultCallOptions),
    };
    deployResult.value = new Result();

    callStaticData.value = {
      func: "example",
      gas: 1000000,
      args: "",
    };
    callStaticResult.value = new Result();

    callFunc.value = "";
    callArgs.value = "";
    callRes.value = "";
    callWaiting.value = false;
    callOptions.value = structuredClone(defaultCallOptions);
  }

  async function resetContractState() {
    contractInstance = undefined;
    contractCode.value = structuredClone(exampleContractCode);
    aci.value = "";
    contractAddress.value = undefined;

    compileError.value = null;

    resetDeployAndCallData();
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

    callStaticData,
    callStaticResult,
    callContractStatic,

    callFunc,
    callOptions,
    callArgs,
    callRes,
    callWaiting,
    callContract,
  };
});
