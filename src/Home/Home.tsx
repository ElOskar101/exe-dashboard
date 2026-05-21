import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import exeData from '../utils/exe-data'
import ExecutionRow from '../executions/execution-row'
import ExecutionCard from '../executions/execution-card'
import { IExecution } from '../executions/interfaces/execution.interface'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconCancel, IconListDetails } from '@tabler/icons-react'

const Home = () => {
  const { t } = useTranslation('home')
  const [selectedExe, setSelectedExe] = useState<IExecution | null>(null)

  const selecteExe = (exe: IExecution) => () => {
    setSelectedExe(() => exe)
  }

  return (
    <div className="py-4 flex flex-col md:flex-row w-full gap-x-3">
      <Card className="w-full md:w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <IconListDetails />
            {t('executionsCard.title')}
            <Button variant="destructive" size="icon-sm" className="ms-auto">
              <IconCancel />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exeData.map((item, i) => (
            <ExecutionRow
              {...item}
              key={'execution-row-' + i}
              onClick={selecteExe(item)}
            />
          ))}
        </CardContent>
      </Card>
      <ExecutionCard
        key={selectedExe?._id || 'empty-execution'}
        className="w-full"
        execution={selectedExe}
      />
    </div>
  )
}

Home.propTypes = {}

export default Home
