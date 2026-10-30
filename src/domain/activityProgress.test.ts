import {describe,it,expect} from 'vitest';
import type {Stage} from './model';
import {deriveStageFromActivities,progressForActivityStatus} from './activityProgress';
describe('automatic activity and stage progress',()=>{
 it('maps statuses to progress',()=>{expect(progressForActivityStatus('Por iniciar')).toBe(0);expect(progressForActivityStatus('En curso')).toBe(50);expect(progressForActivityStatus('En revisión')).toBe(90);expect(progressForActivityStatus('Completada')).toBe(100)});
 it('completes stage only when all activities completed',()=>{const s={activities:[{status:'Completada',progress:100},{status:'En curso',progress:50}],status:'Por iniciar',progress:0} as Stage;expect(deriveStageFromActivities(s)).toMatchObject({status:'En curso',progress:75});expect(deriveStageFromActivities({...s,activities:s.activities.map(a=>({...a,status:'Completada',progress:100}))})).toMatchObject({status:'Completada',progress:100})});
 it('preserves stages without activities',()=>{const s={activities:[],status:'Por iniciar',progress:0} as Stage;expect(deriveStageFromActivities(s)).toBe(s)});
});