import {
  AeSdkAepp,
  BrowserWindowMessageConnection,
  AeSdk,
  walletDetector,
  MemoryAccount,
  SUBSCRIPTION_TYPES,
  CompilerHttp,
} from "@aeternity/aepp-sdk";

import { COMPILER_URL, nodes, defaultNetworkId } from "./config";
import { Ref, ref, UnwrapRef } from "vue";
import { Encoded } from "@aeternity/aepp-sdk/src/utils/encoder";

interface Wallet {
  info: {
    id: string;
    type: string;
    origin: string;
  };
  getConnection: () => BrowserWindowMessageConnection;
}
interface Wallets {
  [key: string]: Wallet;
}

export const sdk: Ref<UnwrapRef<AeSdkAepp | AeSdk | undefined>> = ref();

const activeWallet = ref();
export const account: Ref<UnwrapRef<Encoded.AccountAddress | undefined>> =
  ref();

const walletStatus: Ref<UnwrapRef<string>> = ref("uninitialized");

export const networkId: Ref<UnwrapRef<string | undefined>> = ref();

export const initWallet = async (secretKey?: string | undefined) => {
  walletStatus.value = "connecting";

  try {
    // connect to static Wallet
    if (secretKey) {
      sdk.value = new AeSdk({
        onCompiler: new CompilerHttp(COMPILER_URL, { ignoreVersion: true }),
        accounts: [new MemoryAccount(secretKey)],
        nodes,
      });

      await aeConnectToNode(defaultNetworkId);

      walletStatus.value = "connected";
      await fetchWalletInfo();
    } else {
      // connect to Superhero Wallet
      sdk.value = new AeSdkAepp({
        onDisconnect: console.log,
        name: "AEPP",
        nodes,
        onCompiler: new CompilerHttp(COMPILER_URL, { ignoreVersion: true }),
        onNetworkChange: async ({ networkId }) => {
          await aeConnectToNode(networkId);
        },
        onAddressChange: async (addresses) => {
          console.info("onAddressChange :: ", addresses);
          await fetchWalletInfo();
        },
      });
      await scanForWallets();
    }
  } catch (err) {
    console.error("initWallet . error: ", err);
    throw err;
  }
};

export const scanForWallets = async () => {
  walletStatus.value = "scanning";

  return new Promise((resolve, reject) => {
    if (sdk.value instanceof AeSdkAepp) {
      const handleWallets: ({
        wallets,
        newWallet,
      }: {
        wallets: Wallets;
        newWallet?: Wallet | undefined;
      }) => Promise<void> = async ({ wallets, newWallet }) => {
        newWallet = newWallet || Object.values(wallets)[0];
        stopScan();
        if (!sdk) return;

        activeWallet.value = newWallet;

        const { networkId } = await (sdk.value as AeSdkAepp).connectToWallet(
          newWallet.getConnection()
        );
        await (sdk.value as AeSdkAepp).subscribeAddress(
          SUBSCRIPTION_TYPES.subscribe,
          "current"
        );

        await aeConnectToNode(networkId);

        resolve("");
      };
      const scannerConnection = new BrowserWindowMessageConnection();
      const stopScan = walletDetector(scannerConnection, handleWallets);
    } else reject("AeSdk instance needed for wallet connection");
  });
};

export const fetchWalletInfo = async () => {
  walletStatus.value = "fetching_info";

  try {
    networkId.value = await sdk.value?.api.getNetworkId();
    account.value = await sdk.value?.address;

    walletStatus.value = "connected";
    return true;
  } catch (error) {
    walletStatus.value = "fetching failed";
    console.info("fetchWalletInfo error::", error);
    return false;
  }
};

export const aeConnectToNode = async (selectedNetworkId: string) => {
  sdk.value?.selectNode(selectedNetworkId);
  await fetchWalletInfo();
};
