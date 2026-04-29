export const LS_KEYS={projects:'gdt_projects',pData:'gdt_pdata',lang:'gdt_lang',theme:'gdt_theme'};

export function lsGet<T>(key:string,fallback:T):T{
  try{
    const v=localStorage.getItem(key);
    return v!=null?JSON.parse(v) as T:fallback;
  }catch(e){
    return fallback;
  }
}

export function lsSet(key:string,val:unknown){
  try{
    localStorage.setItem(key,JSON.stringify(val));
  }catch(e){
    console.warn('localStorage full',e);
  }
}
