import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import { IExecution } from "./interfaces/execution.interface";
import Card from "../components/Card";
import CardHeader from "../components/Card/CardHeader";
import CardBody from "../components/Card/CardBody";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { ExecutionConsole } from "./ExecutionConsole";
import Button from "../components/Button";
import TablerIcons from "../components/TablerIcons";
import {
  getCustomer,
  getCustomers,
  getExecution,
} from "./services/execution.service";
import { exeLog } from "../utils/exeData";
import { Select } from "../components/Select";
import { AuthContext } from "../context/AuthContext/Context";

interface IForm {
  customer?: string;
  clinic?: string;
  bot?: string;
}

function ExecutionCard(props: {
  execution?: IExecution | null;
  className?: string;
}) {
  const { t } = useTranslation("home");
  const { user, permissions } = useContext(AuthContext);
  const [lines, setLines] = useState<string[]>([]);
  const [customers, setCustomers] = useState<
    Array<{ value: string; label: string; _id?: string }>
  >([]);

  const [formValue, setFormValue] = useState<IForm>({});

  useEffect(() => {
    if (props.execution) getExeData();
  }, [props.execution]);

  useEffect(() => {
    if (user) getAllCustomers();
  }, [user]);

  useEffect(() => {
    if (formValue.customer) getClinic(formValue.customer);
  }, [formValue.customer]);

  const getExeData = async () => {
    if (!props.execution) return;
    setFormValue(() => ({
      clinic: props.execution?.clinic,
      customer: props.execution?.client,
      bot: props.execution?.bot,
    }));
    getExecution(props.execution._id)
      .then((res) => {
        setLines(() => (res.data.logs || exeLog)?.split("/\r?\n\r?\n/") || []);
      })
      .catch(() => {
        setLines(() => exeLog.split("/\r?\n\r?\n/") || []);
      });
  };

  const getAllCustomers = () => {
    const isValidGetAllClientWithoutArea =
      permissions["QA"] || permissions["carrier"] || permissions["admin"];

    getCustomers({
      ...(isValidGetAllClientWithoutArea ? {} : { area: user?.area }),
      page: 1,
      limit: 900,
      isActive: true,
    }).then(({ data }) => {
      setCustomers(() =>
        data.customers.map((item) => ({
          value: item.clientName,
          label: item.clientName,
          _id: item._id,
        })),
      );
    });
  };

  const getClinic = (customer: string) => {
    const customerId = customers.find((item) => item.value === customer)?._id;
    getCustomer(customerId || "").then((res) => console.log("prro", res));
  };

  const onChangeCustomer = (e: ChangeEvent) => {
    setFormValue((prev) => ({
      ...prev,
      customer: (e.target as HTMLSelectElement).value,
    }));
  };

  return (
    <Card className={classNames("flex flex-col", props.className)}>
      <CardHeader className="flex items-center">
        <TablerIcons icon="IconFileCode2" className="mr-1" />
        {t("executionCard.title")}
        <div className="ml-auto">
          <Button
            variant="outline"
            color="primary"
            size="sm"
            className="rounded"
          >
            <TablerIcons icon="IconRefresh" className="w-[1.2rem] h-[1.2rem]" />
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <ExecutionConsole lines={lines} />
        <div className="flex flex-col md:flex-row items-center gap-x-2">
          <Select
            options={customers}
            label={t("customer", { ns: "common" })}
            padding="sm"
            className="w-full"
            value={formValue.customer}
            onChange={onChangeCustomer}
          />
          <Select
            options={[]}
            label={t("clinic", { ns: "common" })}
            padding="sm"
            className="w-full"
            value={formValue.clinic}
          />
          <Select
            options={[]}
            label={t("bot", { ns: "common" })}
            padding="sm"
            className="w-full"
            value={formValue.bot}
          />
        </div>
      </CardBody>
    </Card>
  );
}

export default ExecutionCard;
