import { useEffect, useState } from "react";
import { Abi, AbiFunction, AbiParameter, decodeFunctionData } from "viem";

type UseDecodeTxDataOptions = {
  abi: Abi;
  txData: string;
};

type DecodedArgument = {
  value: any;
  type: string;
  name: string;
  components?: DecodedArgument[];
};

type UseDecodeTxDataResult = {
  error: string | null;
  decodedData: {
    functionName: string;
    args: DecodedArgument[];
  } | null;
};

export function useDecodeTxData({ abi, txData }: UseDecodeTxDataOptions): UseDecodeTxDataResult {
  const [error, setError] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<{
    functionName: string;
    args: DecodedArgument[];
  } | null>(null);

  const parseType = (type: string, components?: AbiParameter[]): string => {
    if (type.startsWith("tuple")) {
      const innerTypes = components?.map(comp => parseType(comp.type, comp.components)).join(", ");
      return `tuple(${innerTypes})${type.endsWith("[]") ? "[]" : ""}`;
    }
    return type;
  };

  const parseArgument = (value: any, abiParam: AbiParameter): DecodedArgument => {
    const type = parseType(abiParam.type, abiParam.components);

    if (abiParam.type.startsWith("tuple")) {
      const components = abiParam.components?.map((comp, index) => parseArgument(value[index], comp));
      return {
        value,
        type,
        name: abiParam.name,
        components,
      };
    } else if (abiParam.type.endsWith("[]")) {
      const itemType = abiParam.type.slice(0, -2);
      const components = value.map((item: any, index: number) =>
        parseArgument(item, { ...abiParam, type: itemType, name: `${abiParam.name}[${index}]` }),
      );
      return {
        value,
        type,
        name: abiParam.name,
        components,
      };
    } else {
      return { value, type, name: abiParam.name };
    }
  };

  useEffect(() => {
    const decodeData = async () => {
      try {
        const decoded = decodeFunctionData({
          abi,
          data: txData as `0x${string}`,
        });

        console.log("decoded L:", decoded);
        const functionAbi: AbiFunction = abi.find(
          (item: any) => item.name === decoded.functionName && item.type === "function",
        );

        if (!functionAbi || !functionAbi.inputs) {
          throw new Error("Function ABI not found or invalid");
        }

        const parsedArgs = decoded.args?.map((arg, index) => parseArgument(arg, functionAbi.inputs[index]));

        setDecodedData({
          functionName: decoded.functionName,
          args: parsedArgs!,
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to decode transaction data");
        setDecodedData(null);
      }
    };

    if (abi && txData) {
      decodeData();
    }
  }, [abi, txData]);

  return {
    error,
    decodedData,
  };
}
