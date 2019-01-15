// @flow

export type UpdateProgress = {
  percent : number
}

export type Props = {}
export type State = {
  displayApp : boolean,
  displayChangeLog: boolean,
  changeLog: any,
  updateReady : boolean,
  updateProgress : UpdateProgress | null
}