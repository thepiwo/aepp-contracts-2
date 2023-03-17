import {
  AeSdkAepp,
  CompilerHttp,
  AeSdk,
  MemoryAccount,
} from "@aeternity/aepp-sdk";
import { Dispatch, Store } from "vuex";
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

const initialState: State = {
  status: Status.UNINITIALIZED,
  address: undefined,
  networkId: undefined,
};

export default (store: Store<State>) => {
  let aeSdk: AeSdkAepp | AeSdk | undefined;

  const initAeSdkAepp = (dispatch: Dispatch) => {
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
          dispatch("updateConnectionInfo");
        }
      },
      onAddressChange: () => dispatch("updateConnectionInfo"),
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
    state: initialState,
    actions: {
      async updateConnectionInfo({ commit }) {
        commit("setStatus", Status.FETCHING_INFO);
        commit("setNetworkId", await aeSdk?.api?.getNetworkId());
        commit("setAddress", aeSdk?.address);
        commit("setStatus", Status.CONNECTED);
      },
      async initSdk({ dispatch }, secretKey?: string | undefined) {
        if (secretKey) initAeSdk(secretKey);
        else initAeSdkAepp(dispatch);

        await dispatch("updateConnectionInfo");
      },
    },
    mutations: {
      setAddress(state: State, address: string) {
        state.address = address;
      },
      setNetworkId(state: State, networkId: string) {
        state.networkId = networkId;
      },
      setStatus(state: State, status: Status) {
        state.status = status;
      },
    },
  });
};
