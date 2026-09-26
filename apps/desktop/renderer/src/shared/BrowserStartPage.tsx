import {type SourceBrowserId} from "../../../shared/source-browser-policy";
import {resolveWebsiteHomepage,type BrowserDestination} from "../../../shared/browser-search";

const shortcuts:Array<[SourceBrowserId,string]>=[["liepin","猎聘"],["zhilian","智联招聘"],["boss","BOSS直聘"],["wuyou","前程无忧"]];

export function BrowserStartPage({onOpen,limitReached}:{onOpen(destination:Extract<BrowserDestination,{url:string}>):void;limitReached:boolean}) {
  return <div className="browser-new-page"><p>在上方地址栏输入网址或搜索词。</p><div className="browser-start-shortcuts" aria-label="招聘网站快捷入口">{shortcuts.map(([id,name])=><button type="button" key={id} disabled={limitReached} onClick={()=>{const destination=resolveWebsiteHomepage(id);if("url" in destination)onOpen(destination);}}>{name}</button>)}</div></div>;
}
