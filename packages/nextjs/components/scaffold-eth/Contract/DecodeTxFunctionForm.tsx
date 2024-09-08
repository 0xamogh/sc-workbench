"use client";

import { useEffect, useState } from "react";
import React from "react";
import { Abi } from "abitype";
import { AbiParameter } from "viem";
import { ContractInput, displayTxResult } from "~~/components/scaffold-eth";
import { useDecodeTxData } from "~~/hooks/scaffold-eth/useDecodeTxData";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type DecodeTxDataFormProps = {
  abi: Abi;
};

type DecodedArgument = {
  value: any;
  type: string;
  name: string;
  components?: DecodedArgument[];
};

export const DecodeTxDataForm = ({ abi }: DecodeTxDataFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() => "");
  const [result, setResult] = useState<unknown>();

  const { decodedData, error } = useDecodeTxData({
    abi: abi,
    txData: form["key"],
  });

  console.log("^_^ ~ file: DecodeTxFunctionForm.tsx:32 ~ DecodeTxDataForm ~ decodedData:", decodedData);
  useEffect(() => {
    if (error) {
      const parsedError = getParsedError(error);
      notification.error(parsedError + ": Failed to decode tx data");
    }
  }, [error]);

  const renderArgument = (arg: DecodedArgument, depth = 0): JSX.Element => {
    const indent = "  ".repeat(depth);

    console.log("Arg, deptj", arg, depth);
    if (arg.components) {
      return (
        <div key={arg.name} className="ml-2">
          <div className="flex items-center my-2">
            <span className="text-xs font-medium mr-2 leading-none">
              {indent}
              {arg.name}
            </span>
            <span className="block text-xs font-extralight leading-none"> {arg.type}</span>
          </div>
          <div className="ml-4">{arg.components.map((comp, index) => renderArgument(comp, depth + 1))}</div>
        </div>
      );
      // }
      // else if (typeof arg === "object") {
      //   return (
      //     <div key={arg.name} className="ml-2 flex-row">
      //       <div className="flex items-center my-2">
      //         {Object.keys(arg).map(key => (
      //           <React.Fragment key={key}>
      //             <span className="text-xs font-medium mr-2 leading-none">
      //               {indent}
      //               {key}
      //             </span>
      //             <span className="block text-xs font-extralight leading-none">{arg.type}</span>
      //             <span>{String(arg[key])}</span>
      //           </React.Fragment>
      //         ))}
      //       </div>
      //     </div>
      //   );
    } else {
      return (
        <div key={arg.name} className="ml-2 flex-row">
          <div className="flex items-center my-2">
            <span className="text-xs font-medium mr-2 leading-none">
              {indent}
              {arg.name}
            </span>
            <span className="block text-xs font-extralight leading-none"> {arg.type}</span>
          </div>
          <span>{typeof arg.value === "object" ? String(arg.value[arg.name]) : String(arg.value)}</span>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 py-5 first:pt-5 last:pb-10">
      <p className="font-medium my-0 break-words">{"Decode Transaction Data"}</p>
      <ContractInput
        key={"key"}
        setForm={updatedFormValue => {
          setResult(undefined);
          setForm(updatedFormValue);
        }}
        form={form}
        stateObjectKey={"key"}
        paramType={{ type: "bytes" } as AbiParameter}
      />
      <div className="flex flex-col md:flex-row justify-between gap-2 flex-wrap">
        <div className="flex-grow w-full">
          {result !== null && result !== undefined && (
            <div className="bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words overflow-auto">
              <p className="font-bold m-0 mb-1">Result:</p>
              <pre className="whitespace-pre-wrap break-words">{displayTxResult(result, "sm")}</pre>
            </div>
          )}
          {decodedData && (
            <div>
              {/* <div className="bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words overflow-auto"> */}
              <span className="font-medium">{decodedData.functionName}</span>
              <div className="max-w-full overflow-x-auto pb-5">{decodedData.args.map(arg => renderArgument(arg))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
