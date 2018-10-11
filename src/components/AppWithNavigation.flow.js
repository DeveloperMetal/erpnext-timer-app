// @flow

export type MenuItems = {
  path?: string,
  label?: string,
  icon?: any,
  rightIcon?: any,
  items?: Array<MenuItems>,
  expand?: boolean
}

export type Props = {

}

export type State = {
  activePath: string,
  menuCollapsed: boolean,
  menuItems: Array<MenuItems>
}