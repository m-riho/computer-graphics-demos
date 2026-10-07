import type {Component} from 'vue'

export interface Topic {
  id:string
  title:string
  question:string
  purpose:string
  operation:string
  observe:string
  explanation:string
  think:string
  demo:Component
  demoProps?:Record<string,unknown>
  example:string
  core:string
  coreName:string
  run:()=>unknown
}
export interface CourseSession {
  id:string
  number:number
  title:string
  description:string
  date?:string
  topics:Topic[]
}

/** 登録した回だけを公開する。ID重複や空ページを防ぎ、授業回順に表示する。 */
export function defineSessions(entries:CourseSession[]):CourseSession[] {
  const ids=new Set<string>(),numbers=new Set<number>()
  const validId=(id:string)=>/^[a-z0-9][a-z0-9-]*$/.test(id)
  for(const entry of entries){
    if(!validId(entry.id)||ids.has(entry.id)||!Number.isInteger(entry.number)||entry.number<1||numbers.has(entry.number))throw new Error(`授業回のID・番号が不正または重複: ${entry.id}`)
    if(!entry.title.trim()||!entry.topics.length)throw new Error(`公開する回にはタイトルと教材が必要: ${entry.id}`)
    ids.add(entry.id);numbers.add(entry.number)
    const topicIds=new Set<string>()
    for(const topic of entry.topics){
      if(!validId(topic.id)||topicIds.has(topic.id))throw new Error(`教材IDが不正または同じ回で重複: ${entry.id}/${topic.id}`)
      topicIds.add(topic.id)
    }
  }
  return [...entries].sort((a,b)=>a.number-b.number)
}
