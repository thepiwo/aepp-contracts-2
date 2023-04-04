import { defineStore } from "pinia";
import { Contract, toAe } from "@aeternity/aepp-sdk";
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

  // TODO compileData/Result

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

  const callData: Ref<{
    args: string;
    func: string;
    options: {
      amount: number;
      callData: string;
      fee: null;
      gas: null;
      gasPrice: number;
    };
  }> = ref({
    func: "example",
    args: "",
    options: structuredClone(defaultCallOptions),
  });
  const callResult: Ref<Result> = ref(new Result());

  const compileError = ref(null);

  let contractInstance: Contract<any> | undefined = undefined;
  const initializedContractInstance = computed(() => contractInstance);

  const sdkStore = useSdkStore();

  async function compileContractFromSource() {
    byteCode.value = undefined;
    resetDeployAndCallData();

    await sdkStore.aeSdk?.compilerApi
      .compileBySourceCode(contractCode.value)
      .then((result) => {
        byteCode.value = result.bytecode;
        aci.value = JSON.stringify(result?.aci, null, 2);
        persistContract(contractCode.value, aci.value, deployResult.value.data);
      });
  }

  async function initializeContractFromAci(contractAddress: string) {
    resetDeployAndCallData();
    byteCode.value = "calling at address doesn't need bytecode";
    deployResult.value.setInfo("Instantiating Contract at address ...");

    const opts: { aci: any } | { source: string } = aci.value
      ? { aci: JSON.parse(aci.value) }
      : { source: contractCode.value };

    await sdkStore.aeSdk
      ?.initializeContract({
        ...opts,
        address: `ct_${contractAddress.replace("ct_", "")}`,
      })
      .then((instance) => {
        contractInstance = instance;
        deployResult.value.setFinal(
          `Instantiated Contract at address: ${contractAddress}`,
          contractAddress
        );
        persistContract(contractCode.value, aci.value, deployResult.value.data);
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
        deployResult.value.setFinal(
          `Deployed, and mined at this address: ${deployed?.result?.contractId}`,
          deployed?.result?.contractId
        );
        persistContract(
          contractCode.value,
          aci.value,
          deployed?.result?.contractId
        );
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
          `Dry-Run Gas Estimate: ${
            result?.result?.gasUsed
            // @ts-ignore
          }, Fee Estimate: ${toAe(result?.tx?.fee)} ae (${
            // @ts-ignore
            result?.tx?.fee
          } aetto)`,
          JSON.stringify(result?.decodedResult)
        );
      })
      .catch((error) => {
        if (error instanceof Error)
          callStaticResult.value.setError(error.message);
      });
  }

  async function callContract() {
    callResult.value.setInfo("Calling Contract ...");
    const args = argsStringToArgs(callData.value.args);
    const options = Object.fromEntries(
      Object.entries(callData.value.options).filter(([_, v]) => v != null)
    );

    contractInstance
      ?.$call(callData.value.func, args, options)
      .then((result) => {
        callResult.value.setFinal(
          `Gas Used: ${result?.result?.gasUsed}, Fee: ${toAe(
            // @ts-ignore
            result?.tx?.encodedTx?.fee
            // @ts-ignore
          )} ae (${result?.tx?.encodedTx?.fee} aetto)`,
          JSON.stringify(result?.decodedResult)
        );
      })
      .catch((error) => {
        if (error instanceof Error) callResult.value.setError(error.message);
      });
  }

  async function initContractState() {
    const persistedContract = getContract();
    contractCode.value =
      persistedContract.contractCode || structuredClone(exampleContractCode);
    aci.value = persistedContract.aci || "";
    if (aci.value && persistedContract.contractAddress)
      await initializeContractFromAci(persistedContract.contractAddress);
  }

  function resetDeployAndCallData() {
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

    callData.value = {
      func: "example",
      args: "",
      options: structuredClone(defaultCallOptions),
    };
    callResult.value = new Result();
  }

  async function resetContractState() {
    contractInstance = undefined;
    contractCode.value = structuredClone(exampleContractCode);
    aci.value = "";
    deployResult.value = new Result();

    byteCode.value = undefined;
    compileError.value = null;

    resetDeployAndCallData();
    await persistContract(
      contractCode.value,
      aci.value,
      deployResult.value.data
    );
  }

  return {
    initContractState,
    resetContractState,

    contractCode,
    aci,
    byteCode,
    compileError,
    contractInstance: initializedContractInstance,
    compileContractFromSource,
    initializeContractFromAci,

    deployData,
    deployResult,
    deployContract,

    callStaticData,
    callStaticResult,
    callContractStatic,

    callData,
    callResult,
    callContract,
  };
});
