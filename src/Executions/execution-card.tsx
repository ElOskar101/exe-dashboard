import React, { useContext, useMemo, useState } from 'react'
import { IExecution } from './interfaces/execution.interface'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { ExecutionConsole } from './execution-console'
import {
  getCustomer,
  getCustomers,
  getExecution,
} from './services/execution.service'
import { exeLog } from '../utils/exe-data'
import { AuthContext } from '../context/auth-context/context'
import { useMountEffect } from '../hooks/use-mount-effect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconFileCode2, IconRefresh } from '@tabler/icons-react'

interface IForm {
  customer?: string
  clinic?: string
  bot?: string
}

interface ISelectFieldProps {
  label: string
  options: { label: string; value: string }[]
  value?: string
  onValueChange?: React.Dispatch<string>
}

const getExecutionForm = (execution?: IExecution | null): IForm => ({
  clinic: execution?.clinic,
  customer: execution?.client,
  bot: execution?.bot,
})

function SelectField(props: ISelectFieldProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm font-medium">
      {props.label}
      <Select
        value={props.value || null}
        onValueChange={(value) => {
          if (value) props.onValueChange?.(String(value))
        }}
      >
        <SelectTrigger className="w-full" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  )
}

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

  const onChangeCustomer = (customer: string) => {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-1">
          <IconFileCode2 />
          {t('executionCard.title')}
          <Button variant="outline" size="icon-sm" className="ml-auto">
            <IconRefresh />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ExecutionConsole lines={lines} />
        <div className="flex flex-col md:flex-row items-center gap-x-2">
          <SelectField
            options={customers}
            label={t('customer', { ns: 'common' })}
            value={formValue.customer}
            onValueChange={onChangeCustomer}
          />
          <SelectField
            options={[]}
            label={t('clinic', { ns: 'common' })}
            value={formValue.clinic}
          />
          <SelectField
            options={[]}
            label={t('bot', { ns: 'common' })}
            value={formValue.bot}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ExecutionCard
