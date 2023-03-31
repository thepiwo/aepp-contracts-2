export function argsStringToArgs(argsString: string) {
  return argsString.trim() === ""
    ? []
    : argsString.split(",").map((arg) => {
        return arg.trim();
      });
}

export const exampleContractCode = `@compiler >= 4

contract Example =
  entrypoint example(x : int) = x`;

export const defaultCallOptions = {
  gasPrice: 1000000000,
  amount: 0,
  fee: null, // sdk will automatically select this
  gas: null, // sdk will automatically select this
  callData: "",
};

export class Result {
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

export function persistSecretKey(secretKey: string) {
  window.localStorage.setItem("secret-key", secretKey);
}
export function getSecretKey() {
  return window.localStorage.getItem("secret-key");
}

export function persistContract(
  contractCode: string,
  aci: string,
  contractAddress?: string
) {
  window.localStorage.setItem("contract-code", contractCode);
  window.localStorage.setItem("aci", aci);
  if (contractAddress)
    window.localStorage.setItem("contract-address", contractAddress);
}

export function getContract() {
  const contractCode = window.localStorage.getItem("contract-code");
  const aci = window.localStorage.getItem("aci");
  const contractAddress = window.localStorage.getItem("contract-address");

  return { contractCode, aci, contractAddress };
}
