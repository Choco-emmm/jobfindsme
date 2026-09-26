import type {SearchFilters} from './contracts';

export const salaryPresets = [
  {label:'不限',min:undefined,max:undefined},
  {label:'3K以下',min:undefined,max:3},
  {label:'3–5K',min:3,max:5},
  {label:'5–10K',min:5,max:10},
  {label:'10–20K',min:10,max:20},
  {label:'20–50K',min:20,max:50},
  {label:'50K以上',min:50,max:undefined},
] as const;

export function salaryPresetLabel(filters:SearchFilters):string {
  const match=salaryPresets.find(item=>item.min===filters.salary_min_k&&item.max===filters.salary_max_k);
  return match?.label==='不限'?'薪资待遇':match?.label||(filters.salary_min_k!=null||filters.salary_max_k!=null
    ?`${filters.salary_min_k??0}–${filters.salary_max_k??'不限'}K（旧筛选）`:'薪资待遇');
}
