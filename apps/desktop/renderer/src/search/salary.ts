export function formatSalary(job:{salary_min_k:number|null;salary_max_k:number|null;salary?:{raw_text:string;period:string;currency?:string|null;months_per_year?:number|null}|null}):string{
  if(job.salary?.raw_text){
    const period=job.salary.period;
    const suffix=period==='year'?'（年薪原文；月薪待核实）':period==='day'?'（日薪原文；月薪待核实）':period==='hour'?'（时薪原文；月薪待核实）':period==='unknown'?'（薪资口径待核实）':'';
    return `${job.salary.raw_text}${suffix}`;
  }
  const {salary_min_k:min,salary_max_k:max}=job;
  if(min==null&&max==null)return "薪资未注明";
  if(min==null)return `${max}K 以下`;
  if(max==null)return `${min}K 起`;
  return `${min}-${max}K`;
}
