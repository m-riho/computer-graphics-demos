import {defineSessions} from './session-model.ts'
import {session02} from './sessions/02-color-image.ts'

// 公開準備ができた授業回だけを、明示的にimportして登録する。
// 新しい回の教材ファイルはexportマニフェストにも個別に登録する。
export const sessions=defineSessions([session02])
