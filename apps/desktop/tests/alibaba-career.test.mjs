import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {careerPageScript,careerClickableScript,careerRecords} from '../dist-electron/main/sources/company-page.js';
import {sourceBrowserSpecs} from '../dist-electron/shared/source-browser-policy.js';

const listUrl='https://talent-holding.alibaba.com/off-campus/position-list?lang=zh';
const detailUrl='https://talent-holding.alibaba.com/off-campus/position-detail?positionId=199900160005';

test('Alibaba holding social list uses the verified entry and positionId detail shape',()=>{
  assert.equal(sourceBrowserSpecs.company_03.loginUrl,listUrl);
  assert.match(careerPageScript(),/position-detail/);
  assert.match(careerPageScript(),/positionId/);
  assert.doesNotMatch(careerClickableScript('company_03'),/_1RRlPtjyYmeDGCWt9lrk2P/);
  const anchor={href:detailUrl,innerText:'算法工程师-AI Infra',getBoundingClientRect:()=>({width:150,height:20}),closest:()=>null,querySelectorAll:()=>[]};
  const document={body:{innerText:'阿里巴巴控股集团社会招聘'},querySelectorAll:selector=>selector==='a[href]'?[anchor]:[]};
  const extracted=runInNewContext(careerPageScript(),{document,location:{hostname:'talent-holding.alibaba.com',href:listUrl},getComputedStyle:()=>({visibility:'visible'}),URL});
  assert.equal(extracted.jobs[0]?.url,detailUrl);
  const page={jobs:[
    {title:'算法工程师-AI Infra',url:detailUrl,location:'杭州',company:'阿里巴巴',salary:''},
    {title:'算法工程师-AI Infra',url:'https://talent-holding.alibaba.com/off-campus/position-detail?positionId=199900160006',location:'北京',company:'阿里巴巴',salary:''},
    {title:'算法工程师-AI Infra',url:'https://talent-holding.alibaba.com/off-campus/position-detail?positionId=199900160007',location:'',company:'阿里巴巴',salary:''},
  ],next:false,empty:false,loading:false};
  const result=careerRecords('company_03',listUrl,page,'AI Infra','杭州');
  assert.deepEqual(result.records.map(row=>row.payload.url),[detailUrl]);
});
