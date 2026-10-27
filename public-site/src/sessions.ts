import {defineSessions} from './session-model.ts'
import {session02} from './sessions/02-color-image.ts'
import {session05} from './sessions/05-natural-modeling.ts'
import {session04} from './sessions/04-modeling.ts'
import {session03} from './sessions/03-projection-transform.ts'

// 公開準備ができた授業回だけを、明示的にimportして登録する。
// 新しい回の教材ファイルはexportマニフェストにも個別に登録する。
export const sessions=defineSessions([session02,session03,session04,session05])
