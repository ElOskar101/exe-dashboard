import React, { useState } from "react";
import Card from "../components/Card";
import CardHeader from "../components/Card/CardHeader";
import CardBody from "../components/Card/CardBody";
import { useTranslation } from "react-i18next";
import Button from "../components/Button";
import TablerIcons from "../components/TablerIcons";
import exeData from "../utils/exeData";
import ExecutionRow from "../Executions/ExecutionRow";
import FolderCard from "../components/FolderCard";
import ExecutionStatusCard from "../Executions/ExecutionStatusCard";
import ExecutionCard from "../Executions/ExecutionCard";
import { IExecution } from "../Executions/interfaces/execution.interface";

const Home = () => {
  const { t } = useTranslation("home");
  const [selectedExe, setSelectedExe] = useState<IExecution | null>(null);

  const selecteExe = (exe: IExecution) => () => {
    setSelectedExe(() => exe);
  };

  return (
    <div className="py-4 flex flex-col md:flex-row w-full gap-x-3">
      <Card className="w-full md:w-xl">
        <CardHeader className="flex items-center">
          <TablerIcons icon="IconListDetails" className="mr-1" />
          {t("executionsCard.title")}
          <div className="ms-auto flex gap-x-2">
            <Button
              variant="outline"
              className="rounded"
              color="danger"
              size="sm"
            >
              <TablerIcons
                icon="IconCancel"
                className="w-[1.2rem] h-[1.2rem]"
              />
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {exeData.map((item, i) => (
            <ExecutionRow
              {...item}
              key={"execution-row-" + i}
              onClick={selecteExe(item)}
            />
          ))}
        </CardBody>
      </Card>
      <ExecutionCard className="w-full" execution={selectedExe} />
    </div>
  );
};

Home.propTypes = {};

export default Home;
