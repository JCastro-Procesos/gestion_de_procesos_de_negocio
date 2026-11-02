"""Exercise the actual PHP handler against an isolated MySQL service, never production."""
import json,subprocess,uuid
harness='server/tests/governance_request.php'
subprocess.run(['php',harness,'setup'],check=True)
checks=0
def request(method,uid=2,body=None,query=None,status=200):
 global checks
 result=subprocess.run(['php',harness],input=json.dumps(dict(method=method,uid=uid,body=body or {},query=query or {})),text=True,capture_output=True,check=True)
 try:r=json.loads(result.stdout)
 except Exception:raise AssertionError(result.stdout+result.stderr)
 assert r['status']==status,(method,uid,status,r)
 checks+=1
 return r['data']
def detail(i):return request('GET',query={'id':i})
def mutate(i,op,uid=2,expected=200,**extra):
 revision=detail(i)['item']['revision']
 return request('PUT',uid,dict(id=i,operation=op,revision=int(revision),note='Justificación de prueba',**extra),status=expected)
def draft(**extra):return dict(id=str(uuid.uuid4()),kind='Solicitud',title='Revisar alcance',description='Validar resultado esperado',severity='Menor',projectId='',ownerUserId=6,approverUserId=3,dueDate='2026-12-01',evidenceUrl='',impactSummary='',**extra)
legacy='00000000-0000-4000-8000-000000000099';assert int(detail(legacy)['item']['revision'])==0;mutate(legacy,'comment',uid=1);assert request('GET',query={'id':legacy,'version':0})['snapshot']['description']=='Contenido anterior'
a=draft();i=a['id'];request('POST',body=a,status=201)
request('POST',body=a,status=409)
request('POST',body={**draft(),'ownerUserId':8},status=400)
request('POST',body={**draft(),'approverUserId':2},status=400)
request('POST',body={**draft(),'severity':'Crítico'},status=400)
request('POST',body={**draft(),'kind':'Cambio'},status=400)
request('POST',body={**draft(),'kind':'Entregable','evidenceUrl':'javascript:alert(1)'},status=400)
request('POST',uid=1,body=draft(),status=403)
mutate(i,'decide',uid=2,expected=403,**{'status':'Aprobado'})
mutate(i,'decide',uid=7,expected=403,**{'status':'Aprobado'})
mutate(i,'comment',uid=1)
request('PUT',3,dict(id=i,operation='decide',revision=1,note='Dato desactualizado',status='Aprobado'),status=409)
mutate(i,'decide',uid=3,**{'status':'Devuelto'})
mutate(i,'decide',uid=3,expected=403,**{'status':'Aprobado'})
mutate(i,'resubmit',expected=409)
edit={k:v for k,v in a.items() if k not in ['id','title']};mutate(i,'edit',title='Alcance corregido',**edit)
mutate(i,'resubmit')
mutate(i,'decide',uid=3,**{'status':'Aprobado'})
mutate(i,'edit',expected=403,**{k:v for k,v in a.items() if k!='id'})
mutate(i,'implementation',uid=6,implementationStatus='Verificado',evidenceUrl='https://example.org',expected=403)
mutate(i,'implementation',uid=6,implementationStatus='En curso',evidenceUrl='')
mutate(i,'implementation',uid=6,implementationStatus='Implementado',evidenceUrl='',expected=403)
mutate(i,'implementation',uid=6,implementationStatus='Implementado',evidenceUrl='https://example.org/evidencia')
mutate(i,'implementation',uid=6,implementationStatus='Verificado',evidenceUrl='https://example.org/evidencia',expected=403)
mutate(i,'implementation',uid=3,implementationStatus='Verificado',evidenceUrl='https://example.org/evidencia')
mutate(i,'implementation',uid=3,implementationStatus='En curso',evidenceUrl='https://example.org',expected=403)
current=detail(i);assert current['item']['implementationStatus']=='Verificado'
original=request('GET',query={'id':i,'version':1})['snapshot'];assert original['title']==a['title']
assert current['item']['title']=='Alcance corregido'
# Fill >100 events and test cursor retrieval without dropping or mixing history.
for n in range(101):mutate(i,'comment',uid=1)
page=detail(i);assert len(page['events'])==100 and page['nextBefore']
older=request('GET',query={'id':i,'before':page['nextBefore']});assert older['events'] and not set(e['id'] for e in older['events'])&set(e['id'] for e in page['events'])
assert all(e['itemId']==i for e in older['events'])
# Higher impact requires the selected independent direction reviewer.
b=draft();b.update(severity='Crítico',kind='Cambio',impactSummary='Alcance nuevo; plazo +3 días; costo sin cambio; riesgo controlado',approverUserId=4)
request('POST',body=b,status=201);mutate(b['id'],'decide',uid=3,expected=403,**{'status':'Aprobado'});mutate(b['id'],'decide',uid=4,**{'status':'Aprobado'})
# The only higher-level reviewer is the author or owner: retain the request pending assignment.
c=draft();c.update(severity='Mayor',ownerUserId=4,approverUserId=None)
request('POST',uid=5,body=c,status=201)
assert detail(c['id'])['item']['approverUserId'] is None
mutate(c['id'],'decide',uid=5,expected=403,**{'status':'Aprobado'})
request('POST',uid=2,body={**draft(),'approverUserId':None},status=400)
# Reassign the owner and pick an independent reviewer before approval.
changed={k:v for k,v in c.items() if k!='id'};changed.update(ownerUserId=6,approverUserId=4)
mutate(c['id'],'edit',uid=5,**changed)
mutate(c['id'],'decide',uid=4,**{'status':'Aprobado'})
print(f'PASS: {checks} PHP/MySQL requests; permissions, stale writes, decisions, return/edit/resubmit, execution, snapshots and paginated history')
