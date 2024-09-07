import { useEffect, useState } from "react";
import { Abi, decodeFunctionData } from "viem";

type UseDecodeTxDataOptions = {
  abi: Abi;
  txData: string;
};

type DecodedArgument = {
  value: any;
  type: string;
  name: string;
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

  const parseArgument = (value: any, type: string, name: string): DecodedArgument => {
    if (type.startsWith("tuple")) {
      return {
        value: Object.entries(value).map(([key, val]) => parseArgument(val, "unknown", key)),
        type,
        name,
      };
    } else if (Array.isArray(value)) {
      return {
        value: value.map((item, index) => parseArgument(item, "unknown", `${name}[${index}]`)),
        type,
        name,
      };
    } else {
      return { value, type, name };
    }
  };

  useEffect(() => {
    const decodeData = async () => {
      try {
        const decoded = decodeFunctionData({
          abi,
          data: txData as `0x${string}`,
        });

        const functionAbi = abi.find((item: any) => item.name === decoded.functionName && item.type === "function");
        
        if (!functionAbi || !functionAbi.inputs) {
          throw new Error("Function ABI not found or invalid");
        }

        const parsedArgs = decoded.args.map((arg, index) => 
          parseArgument(arg, functionAbi.inputs[index].type, functionAbi.inputs[index].name)
        );

        setDecodedData({
          functionName: decoded.functionName,
          args: parsedArgs,
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to decode transaction data');
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