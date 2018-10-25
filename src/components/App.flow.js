// @flow

export type UpdateProgress = {
  percent : number
}

export type Props = {}
export type State = {
  displayApp : boolean,
  updateReady : boolean,
  updateProgress : UpdateProgress | null
}