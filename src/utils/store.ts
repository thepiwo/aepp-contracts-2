import { defineStore } from "pinia";
import {
  AeSdk,
  AeSdkAepp,
  CompilerHttp,
  MemoryAccount,
} from "@aeternity/aepp-sdk";
import { COMPILER_URL, nodes } from "./config";
import { computed, ref } from "vue";

export enum Status {
  UNINITIALIZED,
  FETCHING_INFO,
  CONNECTED,
}

export const useGlobalStore = defineStore("global", () => {
  let aeSdk: AeSdkAepp | AeSdk | undefined;

  const status = ref(Status.UNINITIALIZED);
  const address = ref();
  const networkId = ref();

  const initializedSdk = computed(() => aeSdk);

  function initAeSdkAepp() {
    aeSdk = new AeSdkAepp({
      name: "Contract Editor",
      nodes,
      onCompiler: new CompilerHttp(COMPILER_URL, { ignoreVersion: true }),
      onNetworkChange: async ({ networkId }) => {
        if (aeSdk) {
          const [{ name }] = (await aeSdk?.getNodesInPool()).filter(
            (node) => node.nodeNetworkId === networkId
          );
          aeSdk?.selectNode(name);
          await updateConnectionInfo();
        }
      },
      onAddressChange: () => updateConnectionInfo(),
      onDisconnect: () => alert("Aepp is disconnected"),
    });
  }

  function initAeSdk(secretKey: string) {
    aeSdk = new AeSdk({
      onCompiler: new CompilerHttp(COMPILER_URL, { ignoreVersion: true }),
      accounts: [new MemoryAccount(secretKey)],
      nodes,
    });
  }

  async function initSdk(secretKey?: string | undefined) {
    if (secretKey) initAeSdk(secretKey);
    else initAeSdkAepp();

    await updateConnectionInfo();
  }

  async function updateConnectionInfo() {
    status.value = Status.FETCHING_INFO;
    networkId.value = await aeSdk?.api?.getNetworkId();
    address.value = aeSdk?.address;
    status.value = Status.CONNECTED;
  }

  return { aeSdk: initializedSdk, initSdk, status, address, networkId };
});
