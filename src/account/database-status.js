export function databaseProbeStatus(status,data={}) {
  const error=data.error||{},message=error.message||'';
  if(/(?:\bdatabase\b[^\n]{0,160}(?:does not exist|was not found))|(?:not.*used)|(?:disabled)/i.test(message))return 'missing';
  if(status===403&&error.status==='PERMISSION_DENIED')return 'denied';
  if(status===200||status===404&&error.status==='NOT_FOUND')return 'open';
  return 'unavailable';
}
