import type {CourseSession,Topic} from './session-model.ts'
export type TopicMode='demo'|'code'
export type SiteRoute=
  | {kind:'home'|'license'|'not-found'}
  | {kind:'session';session:CourseSession}
  | {kind:'topic';session:CourseSession;topic:Topic;mode:TopicMode}

export const sessionHref=(session:CourseSession):string=>`#/sessions/${session.id}`
export const topicHref=(session:CourseSession,topic:Topic,mode:TopicMode):string=>`${sessionHref(session)}/${topic.id}/${mode}`

export function resolveRoute(path:string,sessions:CourseSession[]):SiteRoute {
  if(path==='/')return {kind:'home'}
  if(path==='/license')return {kind:'license'}
  const parts=path.slice(1).split('/')
  if(!path.startsWith('/')||parts.some(p=>!p))return {kind:'not-found'}
  if(parts[0]==='sessions'){
    const session=sessions.find(s=>s.id===parts[1])
    if(!session)return {kind:'not-found'}
    if(parts.length===2)return {kind:'session',session}
    const topic=session.topics.find(t=>t.id===parts[2]),mode=parts[3]||'demo'
    if(topic&&(parts.length===3||parts.length===4)&&(mode==='demo'||mode==='code'))return {kind:'topic',session,topic,mode}
    return {kind:'not-found'}
  }
  // 公開初版の短いURLは第2回の教材として引き続き解決する。
  const session=sessions.find(s=>s.id==='02'),topic=session?.topics.find(t=>t.id===parts[0]),mode=parts[1]||'demo'
  if(session&&topic&&parts.length<=2&&(mode==='demo'||mode==='code'))return {kind:'topic',session,topic,mode}
  return {kind:'not-found'}
}
