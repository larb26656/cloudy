import { useServerSettingsStore } from '@/stores/serverSettingsStore';

function StatusBar() {
  const { mode, getServerUrl } = useServerSettingsStore();
  const serverUrl = getServerUrl();
  return (
    <div className='bg-muted px-2 py-1 text-sm flex gap-2'>
        <span>Mode: { mode }</span>
        <div className='flex-1'/>
        <span>{ serverUrl }</span>
    </div>
  )
}

export default StatusBar