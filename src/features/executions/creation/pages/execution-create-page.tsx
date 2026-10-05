import { GenerateContextDialog } from '../components/generate-context-dialog'
import ExecutionWizard from '../components/execution-wizard'

export default function ExecutionCreatePage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex justify-end">
        <GenerateContextDialog />
      </div>
      <ExecutionWizard />
    </div>
  )
}
