import React, { ChangeEvent, useContext, useMemo, useState } from 'react'
import { IExecution } from './interfaces/execution.interface'
import Card from '../components/card'
import CardHeader from '../components/card/card-header'
import CardBody from '../components/card/card-body'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { ExecutionConsole } from './execution-console'
import Button from '../components/button'
import TablerIcons from '../components/tabler-icons'
import {
  getCustomer,
  getCustomers,
  getExecution,
} from './services/execution.service'
import { exeLog } from '../utils/exe-data'
import { Select } from '../components/select'
import { AuthContext } from '../context/auth-context/context'
import { useMountEffect } from '../hooks/use-mount-effect'

interface IForm {
  customer?: string
  clinic?: string
  bot?: string
}

const getExecutionForm = (execution?: IExecution | null): IForm => ({
  clinic: execution?.clinic,
  customer: execution?.client,
  bot: execution?.bot,
})

function ExecutionCard(props: {
  execution?: IExecution | null
  className?: string
}) {
  const { user, permissions } = useContext(AuthContext)

  return (
    <ExecutionCardContent
      {...props}
      key={[
        props.execution?._id || 'empty-execution',
        user?._id || 'empty-user',
        user?.area || 'empty-area',
        Object.keys(permissions).sort().join(','),
      ].join(':')}
      canLoadCustomers={Boolean(user)}
      userArea={user?.area}
      permissions={permissions}
    />
  )
}

function ExecutionCardContent(props: {
  execution?: IExecution | null
  className?: string
  canLoadCustomers: boolean
  userArea?: string
  permissions: Record<string, boolean>
}) {
  const { t } = useTranslation('home')
  const [lines, setLines] = useState<string[]>([])
  const [customers, setCustomers] = useState<
    Array<{ value: string; label: string; _id?: string }>
  >([])

  const [formValue, setFormValue] = useState<IForm>(() =>
    getExecutionForm(props.execution),
  )

  const canGetCustomersWithoutArea = useMemo(
    () =>
      props.permissions['QA'] ||
      props.permissions['carrier'] ||
      props.permissions['admin'],
    [props.permissions],
  )

  useMountEffect(() => {
    if (props.execution) {
      getExecution(props.execution._id)
        .then((res) => {
          setLines(() => (res.data.logs || exeLog)?.split('/\r?\n\r?\n/') || [])
        })
        .catch(() => {
          setLines(() => exeLog.split('/\r?\n\r?\n/') || [])
        })
    }

    if (!props.canLoadCustomers) return

    getCustomers({
      ...(canGetCustomersWithoutArea ? {} : { area: props.userArea }),
      page: 1,
      limit: 900,
      isActive: true,
    }).then(({ data }) => {
      const customerOptions = data.customers.map((item) => ({
        value: item.clientName,
        label: item.clientName,
        _id: item._id,
      }))

      setCustomers(() => customerOptions)

      const selectedCustomerId = customerOptions.find(
        (item) => item.value === formValue.customer,
      )?._id

      if (selectedCustomerId) {
        getCustomer(selectedCustomerId).then((res) => console.log('prro', res))
      }
    })
  })

  const onChangeCustomer = (e: ChangeEvent) => {
    const customer = (e.target as HTMLSelectElement).value
    const customerId = customers.find((item) => item.value === customer)?._id

    setFormValue((prev) => ({
      ...prev,
      customer,
    }))

    if (customerId) {
      getCustomer(customerId).then((res) => console.log('prro', res))
    }
  }

  return (
    <Card className={classNames('flex flex-col', props.className)}>
      <CardHeader className="flex items-center">
        <TablerIcons icon="IconFileCode2" className="mr-1" />
        {t('executionCard.title')}
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
            label={t('customer', { ns: 'common' })}
            padding="sm"
            className="w-full"
            value={formValue.customer}
            onChange={onChangeCustomer}
          />
          <Select
            options={[]}
            label={t('clinic', { ns: 'common' })}
            padding="sm"
            className="w-full"
            value={formValue.clinic}
          />
          <Select
            options={[]}
            label={t('bot', { ns: 'common' })}
            padding="sm"
            className="w-full"
            value={formValue.bot}
          />
        </div>
      </CardBody>
    </Card>
  )
}

export default ExecutionCard
