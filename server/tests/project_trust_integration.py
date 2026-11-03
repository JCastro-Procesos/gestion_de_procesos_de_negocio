"""Real transactions in an isolated CI MariaDB. Never contacts a hosting environment."""
import json,os,pathlib,subprocess,uuid
ROOT=pathlib.Path(__file__).resolve().parents[2]
HARNESS=ROOT/'server/tests/project_trust_request.php'
assert 'host=127.0.0.1;port=33306;dbname=processone_trust_test;' in os.environ['TRUST_TEST_DSN']
subprocess.run(['php',str(HARNESS),'setup'],check=True)
def call(uid=1,method='GET',body=None,inspect=False):
 p=subprocess.run(['php',str(HARNESS)],input=json.dumps(dict(uid=uid,method=method,body=body or {},inspect=inspect)),text=True,capture_output=True,check=True)
 return json.loads(p.stdout)
def draft(**extra):
 return dict(id='REQ-'+str(uuid.uuid4()),name='Compras',area='Compras',objective='Reducir tiempo',ownerId='user-1',startDate='2026-11-01',dueDate='2026-11-04',initiativeId=1,methodologyId=2,requestedBy='Suplantado',**extra)
def expect(result,status):
 assert result['status']==status,result
 return result.get('data',{})
r=draft();expect(call(method='POST',body=r),201)
expect(call(method='POST',body=r),200)
expect(call(uid=2,method='POST',body=r),409)
items=expect(call(),200)['requests'];assert len(items)==1 and items[0]['requestedBy']=='Ingeniero'
decide=dict(id=r['id'],revision=1,decision='Aprobada',note='Alcance y recursos revisados',initiativeId=1,methodologyId=2)
expect(call(uid=2,method='PUT',body=decide),403)
expect(call(uid=3,method='PUT',body={**decide,'note':''}),400)
expect(call(uid=3,method='PUT',body={**decide,'initiativeId':999}),400)
expect(call(uid=3,method='PUT',body={**decide,'methodologyId':1}),400)
before=call(inspect=True);assert before['projects']==0 and before['revision']==1
approved=expect(call(uid=3,method='PUT',body=decide),200)
after=call(inspect=True);assert after['projects']==1 and after['links']==1 and after['revision']==2
assert len(after['workspace']['stages'])==6 and after['workspace']['projectControls']['version']==1
assert all(s['dueDate']<='2026-11-04' for s in after['workspace']['stages'])
assert any(a.get('origin',{}).get('kind')=='Metodología' for s in after['workspace']['stages'] for a in s['activities'])
expect(call(uid=4,method='PUT',body=decide),409)
assert call(inspect=True)['projects']==1
manager=draft();expect(call(uid=3,method='POST',body=manager),201)
expect(call(uid=3,method='PUT',body={**decide,'id':manager['id']}),403)
expect(call(uid=4,method='PUT',body={**decide,'id':manager['id'],'decision':'Rechazada'}),200)
assert call(inspect=True)['projects']==1
bad=draft();bad['dueDate']='2026-02-30';expect(call(method='POST',body=bad),400)
final=expect(call(),200)['requests'];assert all(len(r['history'])==2 for r in final)
print('\nPASS: shared requests, identity, roles, independence, atomic approval, rollback, plan and duplicate decisions')
