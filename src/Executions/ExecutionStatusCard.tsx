import React from "react";
import TablerIcons from "../components/TablerIcons";
import classNames from "classnames";

interface IExecutionStatusCard {
  status?: "process" | "sleeping" | "error" | "denegated" | "completed";
  className?: string;
}

const ExecutionStatusCard = (props: IExecutionStatusCard) => {
  const { status = "sleeping" } = props;
  return (
    <div className={classNames("relative w-fit h-fit text-2xl", props.className)}>
      <TablerIcons
        icon="IconDeviceImac"
        className="w-[1em] h-[1em] stroke-[2px] m-auto"
      />
      {/* <TablerIcons
          icon="IconLoader2"
          className={classNames('w-[1em] h-[1em] m-auto stroke-[1px] animate-spin', status != 'working' && 'text-transparent')}
        /> */}
      {status === "sleeping" && (
        <TablerIcons
          icon="IconZzz"
          className="absolute w-[0.6em] h-[0.6em] -top-1 -right-1 origin-center animate-pulse stroke-[3px] text-blue-500"
        />
      )}
      {status === "completed" && (
        <TablerIcons
          icon="IconCircleCheck"
          className="absolute w-[0.6em] h-[0.6em] -bottom-1 -right-1 fill-white text-green-600 "
        />
      )}
      {status === "process" && (
        <TablerIcons
          icon="IconSettings"
          className="absolute w-[0.6em] h-[0.6em] -bottom-1 -right-1 fill-white origin-center animate-spin stroke-[1px] text-gray-900"
        />
      )}
      {status === "error" && (
        <TablerIcons
          icon="IconExclamationCircle"
          className="absolute w-[0.6em] h-[0.6em] -bottom-1 -right-1 fill-white text-red-500 animate-bounce"
        />
      )}
      {/* <TablerIcons
        icon="IconPointer"
        className="absolute w-[0.1em] h-[0.1em] bottom-1/2 right-1/2 fill-white stroke-[1px]"
      /> */}
    </div>
  );
};

export default ExecutionStatusCard;
