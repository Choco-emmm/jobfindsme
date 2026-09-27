import test from 'node:test';
import assert from 'node:assert/strict';
import {executeBoundedSourceSearch} from '../dist-electron/main/sources/source-search-execution.js';

const input={workspace_id:'w1',intent:'Python',source_ids:['zhilian','wuyou'],max_pages:1,time_budget_seconds:10,filters:{},page_size:10};
const preflight={workspace_id:'w1',resume_version_id:null,keywords:['Python'],allowed_source_ids:['zhilian','wuyou'],blocked_sources:{},max_pages:1,time_budget_seconds:10};
const record=id=>({external_id:id,source_name:id,source_url:'https://example.org',payload:{title:'Python 工程师'}});
const response=(sourceId,runId,total,status='success')=>({workspace_id:'w1',resume_version_id:null,keywords:['Python'],allowed_source_ids:[sourceId],blocked_sources:{},max_pages:1,time_budget_seconds:10,jobs:[],source_runs:[{source_id:sourceId,status,pages_fetched:1,elapsed_seconds:0.01,coverage_status:'partial',can_continue:false,next_cursor:null,stop_reason:'page_budget',error:null}],result_page:{run_id:runId,page:1,page_size:10,total,page_count:1,items:[]}});
const manager=()=>({searchPage:async id=>({records:[record(id)],next_cursor:null})});

test('cancelling while preflight waits prevents all source requests and snapshot writes',async()=>{
 let release,started,epoch=0,sourceCalls=0,writes=0;
 const gate=new Promise(resolve=>{release=resolve;});
 const preflightStarted=new Promise(resolve=>{started=resolve;});
 const work=executeBoundedSourceSearch(input,{client:{searchPreflight:async()=>{started();await gate;return preflight;},runSourceSearch:async()=>{writes++;}},manager:{searchPage:async()=>{sourceCalls++;return {records:[],next_cursor:null};}},getCancellationEpoch:()=>epoch});
 await preflightStarted;
 epoch++;release();
 await assert.rejects(work,/cancelled|已停止/);
 assert.equal(sourceCalls,0);assert.equal(writes,0);
});

test('a failed batch save does not poison the next valid source',async()=>{
 const writes=[];
 const client={searchPreflight:async()=>preflight,runSourceSearch:async request=>{writes.push(request.source_ids[0]);if(request.source_ids[0]==='zhilian')throw Error('disk full');return response('wuyou','run_b',1);}};
 const result=await executeBoundedSourceSearch(input,{client,manager:manager(),getCancellationEpoch:()=>0});
 assert.deepEqual(writes,['zhilian','wuyou']);
 assert.equal(result.result_page.run_id,'run_b');
 assert.equal(result.source_runs.find(run=>run.source_id==='zhilian')?.status,'failed');
 assert.equal(result.source_runs.find(run=>run.source_id==='wuyou')?.status,'success');
 assert.deepEqual(result.batch_failures.map(item=>[item.source_id,item.stage]),[['zhilian','save']]);
});

test('source status update failure is reported after A was saved and B still saves',async()=>{
 const writes=[],status=[];
 const client={searchPreflight:async()=>({...preflight,max_pages:2}),runSourceSearch:async request=>{const id=request.source_ids[0];writes.push(id);return response(id,'run_a',writes.length,id==='zhilian'?'partial':'success');},recordSourceRuntimeFailure:async id=>{status.push(id);throw Error('status store busy');}};
 const sourceManager={searchPage:async(id,{page})=>{if(id==='zhilian'&&page===2)throw Error('risk_control:verify');return {records:[record(id)],next_cursor:id==='zhilian'?'2':null};}};
 const result=await executeBoundedSourceSearch({...input,max_pages:2},{client,manager:sourceManager,getCancellationEpoch:()=>0});
 assert.deepEqual([...writes].sort(),['wuyou','zhilian']);assert.deepEqual(status,['zhilian']);
 assert.equal(result.result_page.total,2);
 assert.deepEqual(result.batch_failures.map(item=>[item.source_id,item.stage]),[['zhilian','source_status']]);
 assert.equal(result.source_runs.find(run=>run.source_id==='zhilian')?.status,'partial');
 assert.equal(result.source_runs.find(run=>run.source_id==='wuyou')?.status,'success');
});
