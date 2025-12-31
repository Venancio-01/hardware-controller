import{c as e,a as t,b as i,u as r,d as n,i as o,e as l,f as a,t as s,s as d,m as c,g as f,h as u,j as p,k as g,l as h,M as v,r as x,n as m,o as b,F as y,S as $,p as k,q as w,v as C,w as S,x as F,y as z,D as U,z as M,A as O}from"./DkwjXWN7.js";let B={data:""},E=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,D=/\/\*[^]*?\*\/|  +/g,I=/\n+/g,G=(e,t)=>{let i="",r="",n="";for(let o in e){let l=e[o];"@"==o[0]?"i"==o[1]?i=o+" "+l+";":r+="f"==o[1]?G(l,o):o+"{"+G(l,"k"==o[1]?"":t)+"}":"object"==typeof l?r+=G(l,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=l&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),n+=G.p?G.p(o,l):o+":"+l+";")}return i+(t&&n?t+"{"+n+"}":n)+r},T={},A=e=>{if("object"==typeof e){let t="";for(let i in e)t+=i+A(e[i]);return t}return e};function j(e){let t=this||{},i=e.call?e(t.p):e;return((e,t,i,r,n)=>{let o=A(e),l=T[o]||(T[o]=(e=>{let t=0,i=11;for(;t<e.length;)i=101*i+e.charCodeAt(t++)>>>0;return"go"+i})(o));if(!T[l]){let t=o!==e?e:(e=>{let t,i,r=[{}];for(;t=E.exec(e.replace(D,""));)t[4]?r.shift():t[3]?(i=t[3].replace(I," ").trim(),r.unshift(r[0][i]=r[0][i]||{})):r[0][t[1]]=t[2].replace(I," ").trim();return r[0]})(e);T[l]=G(n?{["@keyframes "+l]:t}:t,i?"":"."+l)}let a=i&&T.g?T.g:null;return i&&(T.g=T[l]),s=T[l],d=t,c=r,(f=a)?d.data=d.data.replace(f,s):-1===d.data.indexOf(s)&&(d.data=c?s+d.data:d.data+s),l;var s,d,c,f})(i.unshift?i.raw?((e,t,i)=>e.reduce((e,r,n)=>{let o=t[n];if(o&&o.call){let e=o(i),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":G(e,""):!1===e?"":e}return e+r+(null==o?"":o)},""))(i,[].slice.call(arguments,1),t.p):i.reduce((e,i)=>Object.assign(e,i&&i.call?i(t.p):i),{}):i,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||B})(t.target),t.g,t.o,t.k)}j.bind({g:1}),j.bind({k:1});const L="undefined"==typeof window;function R(e){return e.isFetching&&"success"===e.status?"beforeLoad"===e.isFetching?"purple":"blue":{pending:"yellow",success:"green",error:"red",notFound:"purple",redirected:"gray"}[e.status]}const P={colors:{inherit:"inherit",current:"currentColor",transparent:"transparent",black:"#000000",white:"#ffffff",neutral:{50:"#f9fafb",100:"#f2f4f7",200:"#eaecf0",300:"#d0d5dd",400:"#98a2b3",500:"#667085",600:"#475467",700:"#344054",800:"#1d2939",900:"#101828"},darkGray:{50:"#525c7a",100:"#49536e",200:"#414962",300:"#394056",400:"#313749",500:"#292e3d",600:"#212530",700:"#191c24",800:"#111318",900:"#0b0d10"},gray:{50:"#f9fafb",100:"#f2f4f7",200:"#eaecf0",300:"#d0d5dd",400:"#98a2b3",500:"#667085",600:"#475467",700:"#344054",800:"#1d2939",900:"#101828"},blue:{25:"#F5FAFF",50:"#EFF8FF",100:"#D1E9FF",200:"#B2DDFF",300:"#84CAFF",400:"#53B1FD",500:"#2E90FA",600:"#1570EF",700:"#175CD3",800:"#1849A9",900:"#194185"},green:{25:"#F6FEF9",50:"#ECFDF3",100:"#D1FADF",200:"#A6F4C5",300:"#6CE9A6",400:"#32D583",500:"#12B76A",600:"#039855",700:"#027A48",800:"#05603A",900:"#054F31"},red:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d",950:"#450a0a"},yellow:{25:"#FFFCF5",50:"#FFFAEB",100:"#FEF0C7",200:"#FEDF89",300:"#FEC84B",400:"#FDB022",500:"#F79009",600:"#DC6803",700:"#B54708",800:"#93370D",900:"#7A2E0E"},purple:{25:"#FAFAFF",50:"#F4F3FF",100:"#EBE9FE",200:"#D9D6FE",300:"#BDB4FE",400:"#9B8AFB",500:"#7A5AF8",600:"#6938EF",700:"#5925DC",800:"#4A1FB8",900:"#3E1C96"},teal:{25:"#F6FEFC",50:"#F0FDF9",100:"#CCFBEF",200:"#99F6E0",300:"#5FE9D0",400:"#2ED3B7",500:"#15B79E",600:"#0E9384",700:"#107569",800:"#125D56",900:"#134E48"},pink:{25:"#fdf2f8",50:"#fce7f3",100:"#fbcfe8",200:"#f9a8d4",300:"#f472b6",400:"#ec4899",500:"#db2777",600:"#be185d",700:"#9d174d",800:"#831843",900:"#500724"},cyan:{25:"#ecfeff",50:"#cffafe",100:"#a5f3fc",200:"#67e8f9",300:"#22d3ee",400:"#06b6d4",500:"#0891b2",600:"#0e7490",700:"#155e75",800:"#164e63",900:"#083344"}},alpha:{90:"e5",70:"b3",20:"33"},font:{size:{"2xs":"calc(var(--tsrd-font-size) * 0.625)",xs:"calc(var(--tsrd-font-size) * 0.75)",sm:"calc(var(--tsrd-font-size) * 0.875)",md:"var(--tsrd-font-size)"},lineHeight:{xs:"calc(var(--tsrd-font-size) * 1)",sm:"calc(var(--tsrd-font-size) * 1.25)"},weight:{normal:"400",medium:"500",semibold:"600",bold:"700"},fontFamily:{sans:"ui-sans-serif, Inter, system-ui, sans-serif, sans-serif",mono:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"}},border:{radius:{xs:"calc(var(--tsrd-font-size) * 0.125)",sm:"calc(var(--tsrd-font-size) * 0.25)",md:"calc(var(--tsrd-font-size) * 0.375)",full:"9999px"}},size:{0:"0px",.5:"calc(var(--tsrd-font-size) * 0.125)",1:"calc(var(--tsrd-font-size) * 0.25)",1.5:"calc(var(--tsrd-font-size) * 0.375)",2:"calc(var(--tsrd-font-size) * 0.5)",2.5:"calc(var(--tsrd-font-size) * 0.625)",3:"calc(var(--tsrd-font-size) * 0.75)",3.5:"calc(var(--tsrd-font-size) * 0.875)",4:"calc(var(--tsrd-font-size) * 1)",5:"calc(var(--tsrd-font-size) * 1.25)",8:"calc(var(--tsrd-font-size) * 2)"}};function H(){const t=r(F),[i]=e((e=>{const{colors:t,font:i,size:r,alpha:n,border:o}=P,{fontFamily:l,lineHeight:a,size:s}=i,d=e?j.bind({target:e}):j;return{devtoolsPanelContainer:d`
      direction: ltr;
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 99999;
      width: 100%;
      max-height: 90%;
      border-top: 1px solid ${t.gray[700]};
      transform-origin: top;
    `,devtoolsPanelContainerVisibility:e=>d`
        visibility: ${e?"visible":"hidden"};
      `,devtoolsPanelContainerResizing:e=>e()?d`
          transition: none;
        `:d`
        transition: all 0.4s ease;
      `,devtoolsPanelContainerAnimation:(e,t)=>e?d`
          pointer-events: auto;
          transform: translateY(0);
        `:d`
        pointer-events: none;
        transform: translateY(${t}px);
      `,logo:d`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      font-family: ${l.sans};
      gap: ${P.size[.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${o.radius.xs};
        outline: 2px solid ${t.blue[800]};
      }
    `,tanstackLogo:d`
      font-size: ${i.size.md};
      font-weight: ${i.weight.bold};
      line-height: ${i.lineHeight.xs};
      white-space: nowrap;
      color: ${t.gray[300]};
    `,routerLogo:d`
      font-weight: ${i.weight.semibold};
      font-size: ${i.size.xs};
      background: linear-gradient(to right, #84cc16, #10b981);
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,devtoolsPanel:d`
      display: flex;
      font-size: ${s.sm};
      font-family: ${l.sans};
      background-color: ${t.darkGray[700]};
      color: ${t.gray[300]};

      @media (max-width: 700px) {
        flex-direction: column;
      }
      @media (max-width: 600px) {
        font-size: ${s.xs};
      }
    `,dragHandle:d`
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 4px;
      cursor: row-resize;
      z-index: 100000;
      &:hover {
        background-color: ${t.purple[400]}${n[90]};
      }
    `,firstContainer:d`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      border-right: 1px solid ${t.gray[700]};
      display: flex;
      flex-direction: column;
    `,routerExplorerContainer:d`
      overflow-y: auto;
      flex: 1;
    `,routerExplorer:d`
      padding: ${P.size[2]};
    `,row:d`
      display: flex;
      align-items: center;
      padding: ${P.size[2]} ${P.size[2.5]};
      gap: ${P.size[2.5]};
      border-bottom: ${t.darkGray[500]} 1px solid;
      align-items: center;
    `,detailsHeader:d`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${t.darkGray[600]};
      padding: 0px ${P.size[2]};
      font-weight: ${i.weight.medium};
      font-size: ${i.size.xs};
      min-height: ${P.size[8]};
      line-height: ${i.lineHeight.xs};
      text-align: left;
      display: flex;
      align-items: center;
    `,maskedBadge:d`
      background: ${t.yellow[900]}${n[70]};
      color: ${t.yellow[300]};
      display: inline-block;
      padding: ${P.size[0]} ${P.size[2.5]};
      border-radius: ${o.radius.full};
      font-size: ${i.size.xs};
      font-weight: ${i.weight.normal};
      border: 1px solid ${t.yellow[300]};
    `,maskedLocation:d`
      color: ${t.yellow[300]};
    `,detailsContent:d`
      padding: ${P.size[1.5]} ${P.size[2]};
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: ${i.size.xs};
    `,routeMatchesToggle:d`
      display: flex;
      align-items: center;
      border: 1px solid ${t.gray[500]};
      border-radius: ${o.radius.sm};
      overflow: hidden;
    `,routeMatchesToggleBtn:(e,r)=>{const o=[d`
        appearance: none;
        border: none;
        font-size: 12px;
        padding: 4px 8px;
        background: transparent;
        cursor: pointer;
        font-family: ${l.sans};
        font-weight: ${i.weight.medium};
      `];if(e){const e=d`
          background: ${t.darkGray[400]};
          color: ${t.gray[300]};
        `;o.push(e)}else{const e=d`
          color: ${t.gray[500]};
          background: ${t.darkGray[800]}${n[20]};
        `;o.push(e)}return r&&o.push(d`
          border-right: 1px solid ${P.colors.gray[500]};
        `),o},detailsHeaderInfo:d`
      flex: 1;
      justify-content: flex-end;
      display: flex;
      align-items: center;
      font-weight: ${i.weight.normal};
      color: ${t.gray[400]};
    `,matchRow:e=>{const i=[d`
        display: flex;
        border-bottom: 1px solid ${t.darkGray[400]};
        cursor: pointer;
        align-items: center;
        padding: ${r[1]} ${r[2]};
        gap: ${r[2]};
        font-size: ${s.xs};
        color: ${t.gray[300]};
      `];if(e){const e=d`
          background: ${t.darkGray[500]};
        `;i.push(e)}return i},matchIndicator:e=>{const i=[d`
        flex: 0 0 auto;
        width: ${r[3]};
        height: ${r[3]};
        background: ${t[e][900]};
        border: 1px solid ${t[e][500]};
        border-radius: ${o.radius.full};
        transition: all 0.25s ease-out;
        box-sizing: border-box;
      `];if("gray"===e){const e=d`
          background: ${t.gray[700]};
          border-color: ${t.gray[400]};
        `;i.push(e)}return i},matchID:d`
      flex: 1;
      line-height: ${a.xs};
    `,ageTicker:e=>{const i=[d`
        display: flex;
        gap: ${r[1]};
        font-size: ${s.xs};
        color: ${t.gray[400]};
        font-variant-numeric: tabular-nums;
        line-height: ${a.xs};
      `];if(e){const e=d`
          color: ${t.yellow[400]};
        `;i.push(e)}return i},secondContainer:d`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      border-right: 1px solid ${t.gray[700]};
      display: flex;
      flex-direction: column;
    `,thirdContainer:d`
      flex: 1 1 500px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-right: 1px solid ${t.gray[700]};

      @media (max-width: 700px) {
        border-top: 2px solid ${t.gray[700]};
      }
    `,fourthContainer:d`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      display: flex;
      flex-direction: column;
    `,routesContainer:d`
      overflow-x: auto;
      overflow-y: visible;
    `,routesRowContainer:(e,i)=>{const n=[d`
        display: flex;
        border-bottom: 1px solid ${t.darkGray[400]};
        align-items: center;
        padding: ${r[1]} ${r[2]};
        gap: ${r[2]};
        font-size: ${s.xs};
        color: ${t.gray[300]};
        cursor: ${i?"pointer":"default"};
        line-height: ${a.xs};
      `];if(e){const e=d`
          background: ${t.darkGray[500]};
        `;n.push(e)}return n},routesRow:e=>{const i=[d`
        flex: 1 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: ${s.xs};
        line-height: ${a.xs};
      `];if(!e){const e=d`
          color: ${t.gray[400]};
        `;i.push(e)}return i},routesRowInner:d`
      display: 'flex';
      align-items: 'center';
      flex-grow: 1;
      min-width: 0;
    `,routeParamInfo:d`
      color: ${t.gray[400]};
      font-size: ${s.xs};
      line-height: ${a.xs};
    `,nestedRouteRow:e=>d`
        margin-left: ${e?0:r[3.5]};
        border-left: ${e?"":`solid 1px ${t.gray[700]}`};
      `,code:d`
      font-size: ${s.xs};
      line-height: ${a.xs};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,matchesContainer:d`
      flex: 1 1 auto;
      overflow-y: auto;
    `,cachedMatchesContainer:d`
      flex: 1 1 auto;
      overflow-y: auto;
      max-height: 50%;
    `,historyContainer:d`
      display: flex;
      flex: 1 1 auto;
      overflow-y: auto;
      max-height: 50%;
    `,historyOverflowContainer:d`
      padding: ${r[1]} ${r[2]};
      font-size: ${P.font.size.xs};
    `,maskedBadgeContainer:d`
      flex: 1;
      justify-content: flex-end;
      display: flex;
    `,matchDetails:d`
      display: flex;
      flex-direction: column;
      padding: ${P.size[2]};
      font-size: ${P.font.size.xs};
      color: ${P.colors.gray[300]};
      line-height: ${P.font.lineHeight.sm};
    `,matchStatus:(e,t)=>{const i=t&&"success"===e?"beforeLoad"===t?"purple":"blue":{pending:"yellow",success:"green",error:"red",notFound:"purple",redirected:"gray"}[e];return d`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border-radius: ${P.border.radius.sm};
        font-weight: ${P.font.weight.normal};
        background-color: ${P.colors[i][900]}${P.alpha[90]};
        color: ${P.colors[i][300]};
        border: 1px solid ${P.colors[i][600]};
        margin-bottom: ${P.size[2]};
        transition: all 0.25s ease-out;
      `},matchDetailsInfo:d`
      display: flex;
      justify-content: flex-end;
      flex: 1;
    `,matchDetailsInfoLabel:d`
      display: flex;
    `,mainCloseBtn:d`
      background: ${t.darkGray[700]};
      padding: ${r[1]} ${r[2]} ${r[1]} ${r[1.5]};
      border-radius: ${o.radius.md};
      position: fixed;
      z-index: 99999;
      display: inline-flex;
      width: fit-content;
      cursor: pointer;
      appearance: none;
      border: 0;
      gap: 8px;
      align-items: center;
      border: 1px solid ${t.gray[500]};
      font-size: ${i.size.xs};
      cursor: pointer;
      transition: all 0.25s ease-out;

      &:hover {
        background: ${t.darkGray[500]};
      }
    `,mainCloseBtnPosition:e=>d`
        ${"top-left"===e?`top: ${r[2]}; left: ${r[2]};`:""}
        ${"top-right"===e?`top: ${r[2]}; right: ${r[2]};`:""}
        ${"bottom-left"===e?`bottom: ${r[2]}; left: ${r[2]};`:""}
        ${"bottom-right"===e?`bottom: ${r[2]}; right: ${r[2]};`:""}
      `,mainCloseBtnAnimation:e=>e?d`
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      `:d`
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        `,routerLogoCloseButton:d`
      font-weight: ${i.weight.semibold};
      font-size: ${i.size.xs};
      background: linear-gradient(to right, #98f30c, #00f4a3);
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,mainCloseBtnDivider:d`
      width: 1px;
      background: ${P.colors.gray[600]};
      height: 100%;
      border-radius: 999999px;
      color: transparent;
    `,mainCloseBtnIconContainer:d`
      position: relative;
      width: ${r[5]};
      height: ${r[5]};
      background: pink;
      border-radius: 999999px;
      overflow: hidden;
    `,mainCloseBtnIconOuter:d`
      width: ${r[5]};
      height: ${r[5]};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: blur(3px) saturate(1.8) contrast(2);
    `,mainCloseBtnIconInner:d`
      width: ${r[4]};
      height: ${r[4]};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `,panelCloseBtn:d`
      position: absolute;
      cursor: pointer;
      z-index: 100001;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      background-color: ${t.darkGray[700]};
      &:hover {
        background-color: ${t.darkGray[500]};
      }

      top: 0;
      right: ${r[2]};
      transform: translate(0, -100%);
      border-right: ${t.darkGray[300]} 1px solid;
      border-left: ${t.darkGray[300]} 1px solid;
      border-top: ${t.darkGray[300]} 1px solid;
      border-bottom: none;
      border-radius: ${o.radius.sm} ${o.radius.sm} 0px 0px;
      padding: ${r[1]} ${r[1.5]} ${r[.5]} ${r[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        top: 100%;
        left: -${r[2.5]};
        height: ${r[1.5]};
        width: calc(100% + ${r[5]});
      }
    `,panelCloseBtnIcon:d`
      color: ${t.gray[400]};
      width: ${r[2]};
      height: ${r[2]};
    `,navigateButton:d`
      background: none;
      border: none;
      padding: 0 0 0 4px;
      margin: 0;
      color: ${t.gray[400]};
      font-size: ${s.md};
      cursor: pointer;
      line-height: 1;
      vertical-align: middle;
      margin-right: 0.5ch;
      flex-shrink: 0;
      &:hover {
        color: ${t.blue[300]};
      }
    `}})(t));return i}function N(i,r){const[n,o]=e();t(()=>{const e=(e=>{try{const t=localStorage.getItem(e);return"string"==typeof t?JSON.parse(t):void 0}catch{return}})(i);o(null==e?"function"==typeof r?r():r:e)});return[n,e=>{o(t=>{let r=e;"function"==typeof e&&(r=e(t));try{localStorage.setItem(i,JSON.stringify(r))}catch{}return r})}]}var _=s('<span><svg xmlns=http://www.w3.org/2000/svg width=12 height=12 fill=none viewBox="0 0 24 24"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M9 18l6-6-6-6">'),J=s("<div>"),V=s("<button><span> "),q=s("<div><div><button> [<!> ... <!>]"),K=s("<button><span></span> 🔄 "),Y=s("<span>:"),W=s("<span>");const Z=({expanded:e,style:t={}})=>{const r=ee();return n=_(),o=n.firstChild,i(t=>{var i=r().expander,l=m(r().expanderIcon(e));return i!==t.e&&p(n,t.e=i),l!==t.t&&b(o,"class",t.t=l),t},{e:void 0,t:void 0}),n;var n,o};function Q({value:t,defaultExpanded:r,pageSize:n=100,filterSubEntries:o,...l}){const[s,d]=e(Boolean(r)),u=a(()=>typeof t()),v=a(()=>{let e=[];const i=e=>{const t=!0===r?{[e.label]:!0}:null==r?void 0:r[e.label];return{...e,value:()=>e.value,defaultExpanded:t}};var n;return Array.isArray(t())?e=t().map((e,t)=>i({label:t.toString(),value:e})):null!==t()&&"object"==typeof t()&&(n=t(),Symbol.iterator in n)&&"function"==typeof t()[Symbol.iterator]?e=Array.from(t(),(e,t)=>i({label:t.toString(),value:e})):"object"==typeof t()&&null!==t()&&(e=Object.entries(t()).map(([e,t])=>i({label:e,value:t}))),o?o(e):e}),x=a(()=>function(e,t){if(t<1)return[];let i=0;const r=[];for(;i<e.length;)r.push(e.slice(i,i+t)),i+=t;return r}(v(),n)),[b,y]=e([]),[$,k]=e(void 0),w=ee(),C=()=>{k(t()())},S=e=>g(Q,c({value:t,filterSubEntries:o},l,e));return z=J(),f(z,(F=h(()=>!!x().length),()=>{return F()?[(a=V(),c=a.firstChild,k=c.firstChild,a.$$click=()=>d(e=>!e),f(a,g(Z,{get expanded(){return s()??!1}}),c),f(a,()=>l.label,c),f(c,()=>"iterable"===String(u).toLowerCase()?"(Iterable) ":"",k),f(c,()=>v().length,k),f(c,()=>v().length>1?"items":"item",null),i(e=>{var t=w().expandButton,i=w().info;return t!==e.e&&p(a,e.e=t),i!==e.t&&p(c,e.t=i),e},{e:void 0,t:void 0}),a),h(()=>{return h(()=>!!s())()?h(()=>1===x().length)()?(t=J(),f(t,()=>v().map((e,t)=>S(e))),i(()=>p(t,w().subEntries)),t):(e=J(),f(e,()=>x().map((e,t)=>{return o=q(),l=o.firstChild,a=l.firstChild,s=a.firstChild,d=s.nextSibling,(c=d.nextSibling.nextSibling).nextSibling,a.$$click=()=>y(e=>e.includes(t)?e.filter(e=>e!==t):[...e,t]),f(a,g(Z,{get expanded(){return b().includes(t)}}),s),f(a,t*n,d),f(a,t*n+n-1,c),f(l,(r=h(()=>!!b().includes(t)),()=>{return r()?(t=J(),f(t,()=>e.map(e=>S(e))),i(()=>p(t,w().subEntries)),t):null;var t}),null),i(e=>{var t=w().entry,i=m(w().labelButton,"labelButton");return t!==e.e&&p(l,e.e=t),i!==e.t&&p(a,e.t=i),e},{e:void 0,t:void 0}),o;var r,o,l,a,s,d,c})),i(()=>p(e,w().subEntries)),e):null;var e,t})]:h(()=>"function"===u())()?g(Q,{get label(){return e=K(),t=e.firstChild,e.$$click=C,f(t,()=>l.label),i(()=>p(e,w().refreshValueBtn)),e;var e,t},value:$,defaultExpanded:{}}):[(r=Y(),o=r.firstChild,f(r,()=>l.label,o),r)," ",(e=W(),f(e,()=>(e=>{const t=Object.getOwnPropertyNames(Object(e)),i="bigint"==typeof e?`${e.toString()}n`:e;try{return JSON.stringify(i,t)}catch(r){return"unable to stringify"}})(t())),i(()=>p(e,w().value)),e)];var e,r,o,a,c,k})),i(()=>p(z,w().entry)),z;var F,z}const X=e=>{const{colors:t,font:i,size:r}=P,{fontFamily:n,lineHeight:o,size:l}=i,a=e?j.bind({target:e}):j;return{entry:a`
      font-family: ${n.mono};
      font-size: ${l.xs};
      line-height: ${o.sm};
      outline: none;
      word-break: break-word;
    `,labelButton:a`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,expander:a`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${r[3]};
      height: ${r[3]};
      padding-left: 3px;
      box-sizing: content-box;
    `,expanderIcon:e=>e?a`
          transform: rotate(90deg);
          transition: transform 0.1s ease;
        `:a`
        transform: rotate(0deg);
        transition: transform 0.1s ease;
      `,expandButton:a`
      display: flex;
      gap: ${r[1]};
      align-items: center;
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,value:a`
      color: ${t.purple[400]};
    `,subEntries:a`
      margin-left: ${r[2]};
      padding-left: ${r[2]};
      border-left: 2px solid ${t.darkGray[400]};
    `,info:a`
      color: ${t.gray[500]};
      font-size: ${l["2xs"]};
      padding-left: ${r[1]};
    `,refreshValueBtn:a`
      appearance: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: inherit;
      padding: 0;
      font-family: ${n.mono};
      font-size: ${l.xs};
    `}};function ee(){const t=r(F),[i]=e(X(t));return i}z(["click"]);var te=s("<div><div></div><div>/</div><div></div><div>/</div><div>");function ie(e){const t=[e/1e3,e/6e4,e/36e5,e/864e5];let i=0;for(let r=1;r<t.length&&!(t[r]<1);r++)i=r;return new Intl.NumberFormat(navigator.language,{compactDisplay:"short",notation:"compact",maximumFractionDigits:0}).format(t[i])+["s","min","h","d"][i]}function re({match:e,router:t}){const r=H();if(!e)return null;const n=t().looseRoutesById[e.routeId];if(!n.options.loader)return null;const o=Date.now()-e.updatedAt,l=n.options.staleTime??t().options.defaultStaleTime??0,a=n.options.gcTime??t().options.defaultGcTime??18e5;return s=te(),d=s.firstChild,c=d.nextSibling.nextSibling,u=c.nextSibling.nextSibling,f(d,()=>ie(o)),f(c,()=>ie(l)),f(u,()=>ie(a)),i(()=>p(s,m(r().ageTicker(o>l)))),s;var s,d,c,u}var ne=s("<button type=button>➔");function oe({to:e,params:t,search:r,router:n}){const o=H();return(l=ne()).$$click=i=>{i.stopPropagation(),n().navigate({to:e,params:t,search:r})},b(l,"title",`Navigate to ${e}`),i(()=>p(l,o().navigateButton)),l;var l}z(["click"]);var le=s("<button><div>TANSTACK</div><div>TanStack Router v1"),ae=s("<div style=display:flex;align-items:center;width:100%><div style=flex-grow:1;min-width:0>"),se=s("<code> "),de=s("<code>"),ce=s("<div><div role=button><div>"),fe=s("<div>"),ue=s("<div><ul>"),pe=s('<div><button><svg xmlns=http://www.w3.org/2000/svg width=10 height=6 fill=none viewBox="0 0 10 6"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=1.667 d="M1 1l4 4 4-4"></path></svg></button><div><div></div><div><div></div></div></div><div><div><div><span>Pathname</span></div><div><code></code></div><div><div><button type=button>Routes</button><button type=button>Matches</button><button type=button>History</button></div><div><div>age / staleTime / gcTime</div></div></div><div>'),ge=s("<div><span>masked"),he=s("<div role=button><div>"),ve=s("<li><div>"),xe=s("<li>This panel displays the most recent 15 navigations."),me=s("<div><div><div>Cached Matches</div><div>age / staleTime / gcTime</div></div><div>"),be=s("<div><div>Match Details</div><div><div><div><div></div></div><div><div>ID:</div><div><code></code></div></div><div><div>State:</div><div></div></div><div><div>Last Updated:</div><div></div></div></div></div><div>Explorer</div><div>"),ye=s("<div>Loader Data"),$e=s("<div><div><span>Search Params</span></div><div>"),ke=s("<span style=margin-left:0.5rem>"),we=s('<button type=button aria-label="Copy value to clipboard"style=cursor:pointer>');function Ce(e){const{className:t,...r}=e,n=H();return o=le(),l=o.firstChild,a=l.nextSibling,d(o,c(r,{get class(){return m(n().logo,t?t():"")}}),!1,!0),i(e=>{var t=n().tanstackLogo,i=n().routerLogo;return t!==e.e&&p(l,e.e=t),i!==e.t&&p(a,e.t=i),e},{e:void 0,t:void 0}),o;var o,l,a}function Se(e){return t=ae(),r=t.firstChild,f(t,()=>e.left,r),f(r,()=>e.children),f(t,()=>e.right,null),i(()=>p(t,e.class)),t;var t,r}function Fe({routerState:e,router:t,route:r,isRoot:n,activeId:o,setActiveId:l}){const s=H(),d=a(()=>e().pendingMatches||e().matches),c=a(()=>e().matches.find(e=>e.routeId===r.id)),u=a(()=>{var e,t;try{if(null==(e=c())?void 0:e.params){const e=null==(t=c())?void 0:t.params,i=r.path||k(r.id);if(i.startsWith("$")){const t=i.slice(1);if(e[t])return`(${e[t]})`}}return""}catch(i){return""}}),v=a(()=>{if(n)return;if(!r.path)return;const e=Object.assign({},...d().map(e=>e.params)),i=w({path:r.fullPath,params:e,decodeCharMap:t().pathParamsDecodeCharMap});return i.isMissingParams?void 0:i.interpolatedPath});return $=ce(),S=$.firstChild,F=S.firstChild,S.$$click=()=>{c()&&l(o()===r.id?"":r.id)},f(S,g(Se,{get class(){return m(s().routesRow(!!c()))},get left(){return g(C,{get when(){return v()},children:e=>g(oe,{get to(){return e()},router:t})})},get right(){return g(re,{get match(){return c()},router:t})},get children(){return[(t=se(),o=t.firstChild,f(t,()=>n?x:r.path||k(r.id),o),i(()=>p(t,s().code)),t),(e=de(),f(e,u),i(()=>p(e,s().routeParamInfo)),e)];var e,t,o}}),null),f($,(y=h(()=>{var e;return!!(null==(e=r.children)?void 0:e.length)}),()=>{return y()?(a=fe(),f(a,()=>[...r.children].sort((e,t)=>e.rank-t.rank).map(i=>g(Fe,{routerState:e,router:t,route:i,activeId:o,setActiveId:l}))),i(()=>p(a,s().nestedRouteRow(!!n))),a):null;var a}),null),i(e=>{var t=`Open match details for ${r.id}`,i=m(s().routesRowContainer(r.id===o(),!!c())),n=m(s().matchIndicator(function(e,t){const i=e.find(e=>e.routeId===t.id);return i?R(i):"gray"}(d(),r)));return t!==e.e&&b(S,"aria-label",e.e=t),i!==e.t&&p(S,e.t=i),n!==e.a&&p(F,e.a=n),e},{e:void 0,t:void 0,a:void 0}),$;var y,$,S,F}const ze=function({...r}){const{isOpen:s=!0,setIsOpen:k,handleDragStart:w,router:C,routerState:S,shadowDOMTarget:F,...z}=r,{onCloseClick:U}=n(),M=H(),{className:O,style:B,...E}=z;o(C);const[D,I]=N("tanstackRouterDevtoolsActiveTab","routes"),[G,T]=N("tanstackRouterDevtoolsActiveRouteId",""),[A,j]=e([]),[L,P]=e(!1);t(()=>{const e=S().matches,t=e[e.length-1];if(!t)return;const i=l(()=>A()),r=i[0],n=r&&r.pathname===t.pathname&&JSON.stringify(r.search??{})===JSON.stringify(t.search??{});r&&n||(i.length>=15&&P(!0),j(e=>{const i=[t,...e];return i.splice(15),i}))});const _=a(()=>[...S().pendingMatches??[],...S().matches,...S().cachedMatches].find(e=>e.routeId===G()||e.id===G())),J=a(()=>Object.keys(S().location.search).length),V=a(()=>({...C(),state:S()})),q=a(()=>Object.fromEntries(function(e,t=[e=>e]){return e.map((e,t)=>[e,t]).sort(([e,i],[r,n])=>{for(const o of t){const t=o(e),i=o(r);if(void 0===t){if(void 0===i)continue;return 1}if(t!==i)return t>i?1:-1}return i-n}).map(([e])=>e)}(Object.keys(V()),["state","routesById","routesByPath","options","manifest"].map(e=>t=>t!==e)).map(e=>[e,V()[e]]).filter(e=>"function"!=typeof e[1]&&!["__store","basepath","injectedHtml","subscribers","latestLoadPromise","navigateTimeout","resetNextScroll","tempLocationKey","latestLocation","routeTree","history"].includes(e[0])))),K=a(()=>{var e;return null==(e=_())?void 0:e.loaderData}),Y=a(()=>_()),W=a(()=>S().location.search);return(()=>{var e=pe(),t=e.firstChild,r=t.firstChild,n=t.nextSibling,o=n.firstChild,l=o.nextSibling,a=l.firstChild,s=n.nextSibling,F=s.firstChild,z=F.firstChild;z.firstChild;var j,P,H,N,V,Z,X=z.nextSibling,ee=X.firstChild,te=X.nextSibling,ie=te.firstChild,ne=ie.firstChild,le=ne.nextSibling,ae=le.nextSibling,se=ie.nextSibling,ce=te.nextSibling;return d(e,c({get class(){return m(M().devtoolsPanel,"TanStackRouterDevtoolsPanel",O?O():"")},get style(){return B?B():""}},E),!1,!0),f(e,w?(j=fe(),u(j,"mousedown",w,!0),i(()=>p(j,M().dragHandle)),j):null,t),t.$$click=e=>{k&&k(!1),U(e)},f(o,g(Ce,{"aria-hidden":!0,onClick:e=>{k&&k(!1),U(e)}})),f(a,g(Q,{label:"Router",value:q,defaultExpanded:{state:{},context:{},options:{}},filterSubEntries:e=>e.filter(e=>"function"!=typeof e.value())})),f(z,(P=h(()=>!!S().location.maskedLocation),()=>{return P()?(e=ge(),t=e.firstChild,i(i=>{var r=M().maskedBadgeContainer,n=M().maskedBadge;return r!==i.e&&p(e,i.e=r),n!==i.t&&p(t,i.t=n),i},{e:void 0,t:void 0}),e):null;var e,t}),null),f(ee,()=>S().location.pathname),f(X,(H=h(()=>!!S().location.maskedLocation),()=>{return H()?(e=de(),f(e,()=>{var e;return null==(e=S().location.maskedLocation)?void 0:e.pathname}),i(()=>p(e,M().maskedLocation)),e):null;var e}),null),ne.$$click=()=>{I("routes")},le.$$click=()=>{I("matches")},ae.$$click=()=>{I("history")},f(ce,g($,{get children(){return[g(v,{get when(){return"routes"===D()},get children(){return g(Fe,{routerState:S,router:C,get route(){return C().routeTree},isRoot:!0,activeId:G,setActiveId:T})}}),g(v,{get when(){return"matches"===D()},get children(){var e=fe();return f(e,()=>{var e,t;return null==(t=(null==(e=S().pendingMatches)?void 0:e.length)?S().pendingMatches:S().matches)?void 0:t.map((e,t)=>{return r=he(),n=r.firstChild,r.$$click=()=>T(G()===e.id?"":e.id),f(r,g(Se,{get left(){return g(oe,{get to(){return e.pathname},get params(){return e.params},get search(){return e.search},router:C})},get right(){return g(re,{match:e,router:C})},get children(){var t=de();return f(t,()=>`${e.routeId===x?x:e.pathname}`),i(()=>p(t,M().matchID)),t}}),null),i(t=>{var i=`Open match details for ${e.id}`,o=m(M().matchRow(e===_())),l=m(M().matchIndicator(R(e)));return i!==t.e&&b(r,"aria-label",t.e=i),o!==t.t&&p(r,t.t=o),l!==t.a&&p(n,t.a=l),t},{e:void 0,t:void 0,a:void 0}),r;var r,n})}),e}}),g(v,{get when(){return"history"===D()},get children(){var e,t=ue(),r=t.firstChild;return f(r,g(y,{get each(){return A()},children:(e,t)=>{return r=ve(),n=r.firstChild,f(r,g(Se,{get left(){return g(oe,{get to(){return e.pathname},get params(){return e.params},get search(){return e.search},router:C})},get right(){return g(re,{match:e,router:C})},get children(){var t=de();return f(t,()=>`${e.routeId===x?x:e.pathname}`),i(()=>p(t,M().matchID)),t}}),null),i(i=>{var o=m(M().matchRow(e===_())),l=m(M().matchIndicator(0===t()?"green":"gray"));return o!==i.e&&p(r,i.e=o),l!==i.t&&p(n,i.t=l),i},{e:void 0,t:void 0}),r;var r,n}}),null),f(r,(e=h(()=>!!L()),()=>{return e()?(t=xe(),i(()=>p(t,M().historyOverflowContainer)),t):null;var t}),null),t}})]}})),f(s,(N=h(()=>!!S().cachedMatches.length),()=>{return N()?(e=me(),t=e.firstChild,r=t.firstChild.nextSibling,n=t.nextSibling,f(n,()=>S().cachedMatches.map(e=>{return t=he(),r=t.firstChild,t.$$click=()=>T(G()===e.id?"":e.id),f(t,g(Se,{get left(){return g(oe,{get to(){return e.pathname},get params(){return e.params},get search(){return e.search},router:C})},get right(){return g(re,{match:e,router:C})},get children(){var t=de();return f(t,()=>`${e.id}`),i(()=>p(t,M().matchID)),t}}),null),i(i=>{var n=`Open match details for ${e.id}`,o=m(M().matchRow(e===_())),l=m(M().matchIndicator(R(e)));return n!==i.e&&b(t,"aria-label",i.e=n),o!==i.t&&p(t,i.t=o),l!==i.a&&p(r,i.a=l),i},{e:void 0,t:void 0,a:void 0}),t;var t,r})),i(i=>{var n=M().cachedMatchesContainer,o=M().detailsHeader,l=M().detailsHeaderInfo;return n!==i.e&&p(e,i.e=n),o!==i.t&&p(t,i.t=o),l!==i.a&&p(r,i.a=l),i},{e:void 0,t:void 0,a:void 0}),e):null;var e,t,r,n}),null),f(e,(V=h(()=>{var e;return!(!_()||!(null==(e=_())?void 0:e.status))}),()=>{return V()?(o=be(),l=o.firstChild,a=l.nextSibling,s=a.firstChild,d=s.firstChild,c=d.firstChild,u=d.nextSibling,v=u.firstChild.nextSibling,x=v.firstChild,m=u.nextSibling,b=m.firstChild.nextSibling,y=m.nextSibling,$=y.firstChild.nextSibling,k=a.nextSibling,w=k.nextSibling,f(c,(e=h(()=>{var e,t;return!("success"!==(null==(e=_())?void 0:e.status)||!(null==(t=_())?void 0:t.isFetching))}),()=>{var t;return e()?"fetching":null==(t=_())?void 0:t.status})),f(x,()=>{var e;return null==(e=_())?void 0:e.id}),f(b,(t=h(()=>{var e;return!!(null==(e=S().pendingMatches)?void 0:e.find(e=>{var t;return e.id===(null==(t=_())?void 0:t.id)}))}),()=>t()?"Pending":S().matches.find(e=>{var t;return e.id===(null==(t=_())?void 0:t.id)})?"Active":"Cached")),f($,(r=h(()=>{var e;return!!(null==(e=_())?void 0:e.updatedAt)}),()=>{var e;return r()?new Date(null==(e=_())?void 0:e.updatedAt).toLocaleTimeString():"N/A"})),f(o,(n=h(()=>!!K()),()=>{return n()?[(t=ye(),i(()=>p(t,M().detailsHeader)),t),(e=fe(),f(e,g(Q,{label:"loaderData",value:K,defaultExpanded:{}})),i(()=>p(e,M().detailsContent)),e)]:null;var e,t}),k),f(w,g(Q,{label:"Match",value:Y,defaultExpanded:{}})),i(e=>{var t,i,r=M().thirdContainer,n=M().detailsHeader,a=M().matchDetails,c=M().matchStatus(null==(t=_())?void 0:t.status,null==(i=_())?void 0:i.isFetching),f=M().matchDetailsInfoLabel,g=M().matchDetailsInfo,h=M().matchDetailsInfoLabel,x=M().matchDetailsInfo,C=M().matchDetailsInfoLabel,S=M().matchDetailsInfo,F=M().detailsHeader,z=M().detailsContent;return r!==e.e&&p(o,e.e=r),n!==e.t&&p(l,e.t=n),a!==e.a&&p(s,e.a=a),c!==e.o&&p(d,e.o=c),f!==e.i&&p(u,e.i=f),g!==e.n&&p(v,e.n=g),h!==e.s&&p(m,e.s=h),x!==e.h&&p(b,e.h=x),C!==e.r&&p(y,e.r=C),S!==e.d&&p($,e.d=S),F!==e.l&&p(k,e.l=F),z!==e.u&&p(w,e.u=z),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0}),o):null;var e,t,r,n,o,l,a,s,d,c,u,v,x,m,b,y,$,k,w}),null),f(e,(Z=h(()=>!!J()),()=>Z()?(()=>{var e=$e(),t=e.firstChild;t.firstChild;var r,n=t.nextSibling;return f(t,"undefined"!=typeof navigator?(r=ke(),f(r,g(Ue,{getValue:()=>{const e=S().location.search;return JSON.stringify(e)}})),r):null,null),f(n,g(Q,{value:W,get defaultExpanded(){return Object.keys(S().location.search).reduce((e,t)=>(e[t]={},e),{})}})),i(i=>{var r=M().fourthContainer,o=M().detailsHeader,l=M().detailsContent;return r!==i.e&&p(e,i.e=r),o!==i.t&&p(t,i.t=o),l!==i.a&&p(n,i.a=l),i},{e:void 0,t:void 0,a:void 0}),e})():null),null),i(e=>{var i=M().panelCloseBtn,d=M().panelCloseBtnIcon,c=M().firstContainer,f=M().row,u=M().routerExplorerContainer,g=M().routerExplorer,h=M().secondContainer,v=M().matchesContainer,x=M().detailsHeader,y=M().detailsContent,$=M().detailsHeader,k=M().routeMatchesToggle,w="routes"===D(),C=m(M().routeMatchesToggleBtn("routes"===D(),!0)),S="matches"===D(),U=m(M().routeMatchesToggleBtn("matches"===D(),!0)),O="history"===D(),B=m(M().routeMatchesToggleBtn("history"===D(),!1)),E=M().detailsHeaderInfo,I=m(M().routesContainer);return i!==e.e&&p(t,e.e=i),d!==e.t&&b(r,"class",e.t=d),c!==e.a&&p(n,e.a=c),f!==e.o&&p(o,e.o=f),u!==e.i&&p(l,e.i=u),g!==e.n&&p(a,e.n=g),h!==e.s&&p(s,e.s=h),v!==e.h&&p(F,e.h=v),x!==e.r&&p(z,e.r=x),y!==e.d&&p(X,e.d=y),$!==e.l&&p(te,e.l=$),k!==e.u&&p(ie,e.u=k),w!==e.c&&(ne.disabled=e.c=w),C!==e.w&&p(ne,e.w=C),S!==e.m&&(le.disabled=e.m=S),U!==e.f&&p(le,e.f=U),O!==e.y&&(ae.disabled=e.y=O),B!==e.g&&p(ae,e.g=B),E!==e.p&&p(se,e.p=E),I!==e.b&&p(ce,e.b=I),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0,c:void 0,w:void 0,m:void 0,f:void 0,y:void 0,g:void 0,p:void 0,b:void 0}),e})()};function Ue({getValue:t}){const[r,n]=e(!1);let o=null;const l=async()=>{var e;if("undefined"!=typeof navigator&&(null==(e=navigator.clipboard)?void 0:e.writeText))try{const e=t();await navigator.clipboard.writeText(e),n(!0),o&&clearTimeout(o),o=setTimeout(()=>n(!1),2500)}catch(i){}};return S(()=>{o&&clearTimeout(o)}),(a=we()).$$click=l,f(a,()=>r()?"✅":"📋"),i(()=>b(a,"title",r()?"Copied!":"Copy")),a;var a}z(["click","mousedown"]);var Me=s('<svg xmlns=http://www.w3.org/2000/svg enable-background="new 0 0 634 633"viewBox="0 0 634 633"><g transform=translate(1)><linearGradient x1=-641.486 x2=-641.486 y1=856.648 y2=855.931 gradientTransform="matrix(633 0 0 -633 406377 542258)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#6bdaff></stop><stop offset=0.319 stop-color=#f9ffb5></stop><stop offset=0.706 stop-color=#ffa770></stop><stop offset=1 stop-color=#ff7373></stop></linearGradient><circle cx=316.5 cy=316.5 r=316.5 fill-rule=evenodd clip-rule=evenodd></circle><defs><filter width=454 height=396.9 x=-137.5 y=412 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=-137.5 y=412 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=89.5 cy=610.5 fill=#015064 fill-rule=evenodd stroke=#00CFE2 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=316.5 y=412 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=316.5 y=412 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=543.5 cy=610.5 fill=#015064 fill-rule=evenodd stroke=#00CFE2 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=-137.5 y=450 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=-137.5 y=450 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=89.5 cy=648.5 fill=#015064 fill-rule=evenodd stroke=#00A8B8 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=316.5 y=450 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=316.5 y=450 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=543.5 cy=648.5 fill=#015064 fill-rule=evenodd stroke=#00A8B8 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=-137.5 y=486 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=-137.5 y=486 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=89.5 cy=684.5 fill=#015064 fill-rule=evenodd stroke=#007782 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=316.5 y=486 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=316.5 y=486 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=543.5 cy=684.5 fill=#015064 fill-rule=evenodd stroke=#007782 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=176.9 height=129.3 x=272.2 y=308 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=176.9 height=129.3 x=272.2 y=308 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><g><path fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11 d="M436 403.2l-5 28.6m-140-90.3l-10.9 62m52.8-19.4l-4.3 27.1"></path><linearGradient x1=-645.656 x2=-646.499 y1=854.878 y2=854.788 gradientTransform="matrix(-184.159 -32.4722 11.4608 -64.9973 -128419.844 34938.836)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ee2700></stop><stop offset=1 stop-color=#ff008e></stop></linearGradient><path fill-rule=evenodd d="M344.1 363l97.7 17.2c5.8 2.1 8.2 6.2 7.1 12.1-1 5.9-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1.8-12.8 3.7-3.7 8.3-4.4 13.7-2.1l55.2 53.6z"clip-rule=evenodd></path><path fill=#D8D8D8 fill-rule=evenodd stroke=#FFF stroke-linecap=round stroke-linejoin=bevel stroke-width=7 d="M428.3 384.5l.9-6.5m-33.9 1.5l.9-6.5m-34 .5l.9-6.1m-38.9-16.1l4.2-3.9m-25.2-16.1l4.2-3.9"clip-rule=evenodd></path></g><defs><filter width=280.6 height=317.4 x=73.2 y=113.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=280.6 height=317.4 x=73.2 y=113.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><g><linearGradient x1=-646.8 x2=-646.8 y1=854.844 y2=853.844 gradientTransform="matrix(-100.1751 48.8587 -97.9753 -200.879 19124.773 203538.61)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#a17500></stop><stop offset=1 stop-color=#5d2100></stop></linearGradient><path fill-rule=evenodd d="M192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.2-2.9 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6-3.4-18.7-10.8-51.8-22.2-99.6l-25.3 4.6"clip-rule=evenodd></path><linearGradient x1=-635.467 x2=-635.467 y1=852.115 y2=851.115 gradientTransform="matrix(92.6873 4.8575 2.0257 -38.6535 57323.695 36176.047)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"clip-rule=evenodd></path><linearGradient x1=-636.573 x2=-636.573 y1=855.444 y2=854.444 gradientTransform="matrix(109.9945 5.7646 6.3597 -121.3507 64719.133 107659.336)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.3 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20 49.6-53.1 49.6-53.1z"clip-rule=evenodd></path><linearGradient x1=-632.145 x2=-632.145 y1=854.174 y2=853.174 gradientTransform="matrix(62.9558 3.2994 3.5021 -66.8246 37035.367 59284.227)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M195 183.9c-.8-21.9 6-38 20.6-48.2 14.6-10.2 29.8-15.3 45.5-15.3-6.1 21.4-14.5 35.8-25.2 43.4-10.7 7.5-24.4 14.2-40.9 20.1z"clip-rule=evenodd></path><linearGradient x1=-638.224 x2=-638.224 y1=853.801 y2=852.801 gradientTransform="matrix(152.4666 7.9904 3.0934 -59.0251 94939.86 55646.855)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5c31.9-30 64.1-39.7 96.7-29 32.6 10.7 50.8 30.4 54.6 59.1-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"clip-rule=evenodd></path><linearGradient x1=-637.723 x2=-637.723 y1=855.103 y2=854.103 gradientTransform="matrix(136.467 7.1519 5.2165 -99.5377 82830.875 89859.578)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5c35.8-7.6 65.6-.2 89.2 22 23.6 22.2 37.7 49 42.3 80.3-39.8-9.7-68.3-23.8-85.5-42.4-17.2-18.5-32.5-38.5-46-59.9z"clip-rule=evenodd></path><linearGradient x1=-631.79 x2=-631.79 y1=855.872 y2=854.872 gradientTransform="matrix(60.8683 3.19 8.7771 -167.4773 31110.818 145537.61)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6-6.5 29.9-3.6 63.1 8.7 99.6 27.4-40.3 43.2-69.6 47.4-88 4.2-18.3 5.5-44.1 4-77.2z"clip-rule=evenodd></path><path fill=none stroke=#2F8A00 stroke-linecap=round stroke-width=8 d="M196.5 182.3c-14.8 21.6-25.1 41.4-30.8 59.4-5.7 18-9.4 33-11.1 45.1"></path><path fill=none stroke=#2F8A00 stroke-linecap=round stroke-width=8 d="M194.8 185.7c-24.4 1.7-43.8 9-58.1 21.8-14.3 12.8-24.7 25.4-31.3 37.8m99.1-68.9c29.7-6.7 52-8.4 67-5 15 3.4 26.9 8.7 35.8 15.9m-110.8-5.9c20.3 9.9 38.2 20.5 53.9 31.9 15.7 11.4 27.4 22.1 35.1 32"></path></g><defs><filter width=532 height=633 x=50.5 y=399 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=532 height=633 x=50.5 y=399 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><linearGradient x1=-641.104 x2=-641.278 y1=856.577 y2=856.183 gradientTransform="matrix(532 0 0 -633 341484.5 542657)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#fff400></stop><stop offset=1 stop-color=#3c8700></stop></linearGradient><ellipse cx=316.5 cy=715.5 fill-rule=evenodd clip-rule=evenodd rx=266 ry=316.5></ellipse><defs><filter width=288 height=283 x=391 y=-24 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=288 height=283 x=391 y=-24 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><g><g transform="translate(397 -24)"><linearGradient x1=-1036.672 x2=-1036.672 y1=880.018 y2=879.018 gradientTransform="matrix(227 0 0 -227 235493 199764)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffdf00></stop><stop offset=1 stop-color=#ff9d00></stop></linearGradient><circle cx=168.5 cy=113.5 r=113.5 fill-rule=evenodd clip-rule=evenodd></circle><linearGradient x1=-1017.329 x2=-1018.602 y1=658.003 y2=657.998 gradientTransform="matrix(30 0 0 -1 30558 771)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M30 113H0"></path><linearGradient x1=-1014.501 x2=-1015.774 y1=839.985 y2=839.935 gradientTransform="matrix(26.5 0 0 -5.5 26925 4696.5)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M33.5 79.5L7 74"></path><linearGradient x1=-1016.59 x2=-1017.862 y1=852.671 y2=852.595 gradientTransform="matrix(29 0 0 -8 29523 6971)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M34 146l-29 8"></path><linearGradient x1=-1011.984 x2=-1013.257 y1=863.523 y2=863.229 gradientTransform="matrix(24 0 0 -13 24339 11407)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M45 177l-24 13"></path><linearGradient x1=-1006.673 x2=-1007.946 y1=869.279 y2=868.376 gradientTransform="matrix(20 0 0 -19 20205 16720)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M67 204l-20 19"></path><linearGradient x1=-992.85 x2=-993.317 y1=871.258 y2=870.258 gradientTransform="matrix(13.8339 0 0 -22.8467 13825.796 20131.938)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M94.4 227l-13.8 22.8"></path><linearGradient x1=-953.835 x2=-953.965 y1=871.9 y2=870.9 gradientTransform="matrix(7.5 0 0 -24.5 7278 21605)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M127.5 243.5L120 268"></path><linearGradient x1=244.504 x2=244.496 y1=871.898 y2=870.898 gradientTransform="matrix(.5 0 0 -24.5 45.5 21614)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M167.5 252.5l.5 24.5">');function Oe(){const e=O();return t=Me(),i=t.firstChild.firstChild,r=i.nextSibling,n=r.nextSibling,o=n.firstChild,l=n.nextSibling,a=l.firstChild,s=l.nextSibling,d=s.nextSibling,c=d.firstChild,f=d.nextSibling,u=f.firstChild,p=f.nextSibling,g=p.nextSibling,h=g.firstChild,v=g.nextSibling,x=v.firstChild,m=v.nextSibling,y=m.nextSibling,$=y.firstChild,k=y.nextSibling,w=k.firstChild,C=k.nextSibling,S=C.nextSibling,F=S.firstChild,z=S.nextSibling,U=z.firstChild,M=z.nextSibling,B=M.nextSibling,E=B.firstChild,D=B.nextSibling,I=D.firstChild,G=D.nextSibling,T=G.nextSibling,A=T.firstChild,j=T.nextSibling,L=j.firstChild,R=j.nextSibling,P=R.firstChild.nextSibling,H=P.nextSibling,N=R.nextSibling,_=N.firstChild,J=N.nextSibling,V=J.firstChild,q=J.nextSibling,K=q.firstChild,Y=K.nextSibling,W=Y.nextSibling,Z=W.nextSibling,Q=Z.nextSibling,X=Q.nextSibling,ee=X.nextSibling,te=ee.nextSibling,ie=te.nextSibling,re=ie.nextSibling,ne=re.nextSibling,oe=ne.nextSibling,le=oe.nextSibling,ae=le.nextSibling,se=q.nextSibling,de=se.firstChild,ce=se.nextSibling,fe=ce.firstChild,ue=ce.nextSibling,pe=ue.nextSibling,ge=pe.nextSibling,he=ge.firstChild,ve=ge.nextSibling,xe=ve.firstChild,me=ve.nextSibling,be=me.firstChild.firstChild,ye=be.nextSibling,$e=ye.nextSibling,ke=$e.nextSibling,we=ke.nextSibling,Ce=we.nextSibling,Se=Ce.nextSibling,Fe=Se.nextSibling,ze=Fe.nextSibling,Ue=ze.nextSibling,Oe=Ue.nextSibling,Be=Oe.nextSibling,Ee=Be.nextSibling,De=Ee.nextSibling,Ie=De.nextSibling,Ge=Ie.nextSibling,Te=Ge.nextSibling,Ae=Te.nextSibling,b(i,"id",`a-${e}`),b(r,"fill",`url(#a-${e})`),b(o,"id",`b-${e}`),b(l,"id",`c-${e}`),b(a,"filter",`url(#b-${e})`),b(s,"mask",`url(#c-${e})`),b(c,"id",`d-${e}`),b(f,"id",`e-${e}`),b(u,"filter",`url(#d-${e})`),b(p,"mask",`url(#e-${e})`),b(h,"id",`f-${e}`),b(v,"id",`g-${e}`),b(x,"filter",`url(#f-${e})`),b(m,"mask",`url(#g-${e})`),b($,"id",`h-${e}`),b(k,"id",`i-${e}`),b(w,"filter",`url(#h-${e})`),b(C,"mask",`url(#i-${e})`),b(F,"id",`j-${e}`),b(z,"id",`k-${e}`),b(U,"filter",`url(#j-${e})`),b(M,"mask",`url(#k-${e})`),b(E,"id",`l-${e}`),b(D,"id",`m-${e}`),b(I,"filter",`url(#l-${e})`),b(G,"mask",`url(#m-${e})`),b(A,"id",`n-${e}`),b(j,"id",`o-${e}`),b(L,"filter",`url(#n-${e})`),b(R,"mask",`url(#o-${e})`),b(P,"id",`p-${e}`),b(H,"fill",`url(#p-${e})`),b(_,"id",`q-${e}`),b(J,"id",`r-${e}`),b(V,"filter",`url(#q-${e})`),b(q,"mask",`url(#r-${e})`),b(K,"id",`s-${e}`),b(Y,"fill",`url(#s-${e})`),b(W,"id",`t-${e}`),b(Z,"fill",`url(#t-${e})`),b(Q,"id",`u-${e}`),b(X,"fill",`url(#u-${e})`),b(ee,"id",`v-${e}`),b(te,"fill",`url(#v-${e})`),b(ie,"id",`w-${e}`),b(re,"fill",`url(#w-${e})`),b(ne,"id",`x-${e}`),b(oe,"fill",`url(#x-${e})`),b(le,"id",`y-${e}`),b(ae,"fill",`url(#y-${e})`),b(de,"id",`z-${e}`),b(ce,"id",`A-${e}`),b(fe,"filter",`url(#z-${e})`),b(ue,"id",`B-${e}`),b(pe,"fill",`url(#B-${e})`),b(pe,"mask",`url(#A-${e})`),b(he,"id",`C-${e}`),b(ve,"id",`D-${e}`),b(xe,"filter",`url(#C-${e})`),b(me,"mask",`url(#D-${e})`),b(be,"id",`E-${e}`),b(ye,"fill",`url(#E-${e})`),b($e,"id",`F-${e}`),b(ke,"stroke",`url(#F-${e})`),b(we,"id",`G-${e}`),b(Ce,"stroke",`url(#G-${e})`),b(Se,"id",`H-${e}`),b(Fe,"stroke",`url(#H-${e})`),b(ze,"id",`I-${e}`),b(Ue,"stroke",`url(#I-${e})`),b(Oe,"id",`J-${e}`),b(Be,"stroke",`url(#J-${e})`),b(Ee,"id",`K-${e}`),b(De,"stroke",`url(#K-${e})`),b(Ie,"id",`L-${e}`),b(Ge,"stroke",`url(#L-${e})`),b(Te,"id",`M-${e}`),b(Ae,"stroke",`url(#M-${e})`),t;var t,i,r,n,o,l,a,s,d,c,f,u,p,g,h,v,x,m,y,$,k,w,C,S,F,z,U,M,B,E,D,I,G,T,A,j,L,R,P,H,N,_,J,V,q,K,Y,W,Z,Q,X,ee,te,ie,re,ne,oe,le,ae,se,de,ce,fe,ue,pe,ge,he,ve,xe,me,be,ye,$e,ke,we,Ce,Se,Fe,ze,Ue,Oe,Be,Ee,De,Ie,Ge,Te,Ae}var Be=s("<button type=button><div><div></div><div></div></div><div>-</div><div>TanStack Router");function Ee({initialIsOpen:r,panelProps:n={},closeButtonProps:o={},toggleButtonProps:l={},position:s="bottom-left",containerElement:u="footer",router:h,routerState:v,shadowDOMTarget:x}){const[b,y]=e();let $;const[k,w]=N("tanstackRouterDevtoolsOpen",r),[C,S]=N("tanstackRouterDevtoolsHeight",null),[F,z]=e(!1),[O,B]=e(!1),E=function(){const[r,n]=e(!1);return(L?t:i)(()=>{n(!0)}),r}(),D=H();k(),t(()=>{z(k()??!1)}),t(()=>{var e,t,i;if(F()){const i=null==(t=null==(e=b())?void 0:e.parentElement)?void 0:t.style.paddingBottom,r=()=>{var e;const t=$.getBoundingClientRect().height;(null==(e=b())?void 0:e.parentElement)&&y(e=>((null==e?void 0:e.parentElement)&&(e.parentElement.style.paddingBottom=`${t}px`),e))};if(r(),"undefined"!=typeof window)return window.addEventListener("resize",r),()=>{var e;window.removeEventListener("resize",r),(null==(e=b())?void 0:e.parentElement)&&"string"==typeof i&&y(e=>(e.parentElement.style.paddingBottom=i,e))}}else(null==(i=b())?void 0:i.parentElement)&&y(e=>((null==e?void 0:e.parentElement)&&e.parentElement.removeAttribute("style"),e))}),t(()=>{if(b()){const e=b(),t=getComputedStyle(e).fontSize;null==e||e.style.setProperty("--tsrd-font-size",t)}});const{style:I={},...G}=n,{style:T={},onClick:A,...j}=o,{onClick:R,class:P,..._}=l;if(!E())return null;const J=a(()=>C()??500),V=a(()=>m(D().devtoolsPanelContainer,D().devtoolsPanelContainerVisibility(!!k()),D().devtoolsPanelContainerResizing(O),D().devtoolsPanelContainerAnimation(F(),J()+16))),q=a(()=>({height:`${J()}px`,...I||{}})),K=a(()=>m(D().mainCloseBtn,D().mainCloseBtnPosition(s),D().mainCloseBtnAnimation(!!k()),P));return g(M,{component:u,ref:y,class:"TanStackRouterDevtools",get children(){return[g(U.Provider,{value:{onCloseClick:A??(()=>{})},get children(){return g(ze,c({ref(e){"function"==typeof $?$(e):$=e}},G,{router:h,routerState:v,className:V,style:q,get isOpen(){return F()},setIsOpen:w,handleDragStart:e=>((e,t)=>{if(0!==t.button)return;B(!0);const i=(null==e?void 0:e.getBoundingClientRect().height)??0,r=t.pageY,n=e=>{const t=r-e.pageY,n=i+t;S(n),w(!(n<70))},o=()=>{B(!1),document.removeEventListener("mousemove",n),document.removeEventListener("mouseUp",o)};document.addEventListener("mousemove",n),document.addEventListener("mouseup",o)})($,e),shadowDOMTarget:x}))}}),(e=Be(),t=e.firstChild,r=t.firstChild,n=r.nextSibling,o=t.nextSibling,l=o.nextSibling,d(e,c(_,{"aria-label":"Open TanStack Router Devtools",onClick:e=>{w(!0),R&&R(e)},get class(){return K()}}),!1,!0),f(r,g(Oe,{})),f(n,g(Oe,{})),i(e=>{var i=D().mainCloseBtnIconContainer,a=D().mainCloseBtnIconOuter,s=D().mainCloseBtnIconInner,d=D().mainCloseBtnDivider,c=D().routerLogoCloseButton;return i!==e.e&&p(t,e.e=i),a!==e.t&&p(r,e.t=a),s!==e.a&&p(n,e.a=s),d!==e.o&&p(o,e.o=d),c!==e.i&&p(l,e.i=c),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),e)];var e,t,r,n,o,l}})}export{Ee as FloatingTanStackRouterDevtools,Ee as default};
