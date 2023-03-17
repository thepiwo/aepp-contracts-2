import {
  AeSdkAepp,
  CompilerHttp,
  AeSdk,
  MemoryAccount,
} from "@aeternity/aepp-sdk";
import { Store } from "vuex";
import { COMPILER_URL, nodes } from "./config";

enum Status {
  UNINITIALIZED,
  FETCHING_INFO,
  CONNECTED,
}

export interface State {
  status: Status;
  address: undefined | string;
  networkId: undefined | string;
}

const state: State = {
  status: Status.UNINITIALIZED,
  address: undefined,
  networkId: undefined,
};

export default (store: Store<State>) => {
  let aeSdk: AeSdkAepp | AeSdk | undefined;

  const initAeSdkAepp = () => {
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
          store.commit("aeSdk/updateConnectionInfo");
        }
      },
      onAddressChange: () => store.commit("aeSdk/updateConnectionInfo"),
      onDisconnect: () => alert("Aepp is disconnected"),
    });
  };

  const initAeSdk = (secretKey: string) => {
    aeSdk = new AeSdk({
      onCompiler: new CompilerHttp(COMPILER_URL, { ignoreVersion: true }),
      accounts: [new MemoryAccount(secretKey)],
      nodes,
    });
  };

  store.registerModule("aeSdk", {
    namespaced: true,
    getters: {
      aeSdk: () => aeSdk,
    },
    state,
    mutations: {
      initSdk(state, secretKey?) {
        if (secretKey) initAeSdk(secretKey);
        else initAeSdkAepp();
      },
      setAddress(state, address) {
        state.address = address;
      },
      async updateConnectionInfo(state) {
        state.status = Status.FETCHING_INFO;
        state.networkId = await aeSdk?.api?.getNetworkId();
        state.address = aeSdk?.address;
        state.status = Status.CONNECTED;
      },
    },
  });
};
