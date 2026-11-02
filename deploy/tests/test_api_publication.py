"""Publish only the extracted API block into a temporary site; no hosting/config access."""
import pathlib,re,subprocess,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
REMOTE=(ROOT/'deploy/remote/deploy.sh').read_text()
MODULES=re.search(r'API_MODULES=\(([^)]+)\)',REMOTE).group(1).split()
BLOCK=REMOTE.split('# API_PUBLICATION_BEGIN\n',1)[1].split('# API_PUBLICATION_END',1)[0]
class Publication(unittest.TestCase):
 def test_all_packaged_api_dependencies_are_published(self):
  package=(ROOT/'deploy/build-package.sh').read_text()
  expected=set(re.findall(r'server/api/([a-z0-9_]+\.php)',package))
  self.assertEqual(set(MODULES),expected)
  self.assertIn('governance.php',MODULES);self.assertIn('governance_policy.php',MODULES)
  self.assertEqual(MODULES[-1],'index.php')
 def simulate(self,missing=None):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);rel=root/'release';site=root/'site';(rel/'api').mkdir(parents=True);(site/'api').mkdir(parents=True)
   for m in MODULES:
    if m!=missing:(rel/'api'/m).write_text('new '+m)
   (site/'api/index.php').write_text('previous index')
   (site/'api/config.php').write_text('existing config placeholder')
   script='set -euo pipefail\nREL='+str(rel)+'\nPO_TARGET='+str(site)+'\nAPI_MODULES=('+ ' '.join(MODULES)+')\ncopy(){ cp -a "$@"; }\ndie(){ echo "$*" >&2; exit 1; }\n'+BLOCK
   result=subprocess.run(['bash','-c',script],capture_output=True,text=True)
   self.assertEqual((site/'api/config.php').read_text(),'existing config placeholder')
   if missing:
    self.assertNotEqual(result.returncode,0);self.assertEqual((site/'api/index.php').read_text(),'previous index')
   else:
    self.assertEqual(result.returncode,0,result.stderr)
    for m in MODULES:
     self.assertEqual((site/'api'/m).read_bytes(),(rel/'api'/m).read_bytes())
     self.assertEqual((site/'api'/m).stat().st_mode&0o777,0o644)
 def test_publication_copies_governance_dependencies(self):self.simulate()
 def test_missing_dependency_preserves_previous_controller(self):self.simulate('governance_policy.php')
if __name__=='__main__':unittest.main()
