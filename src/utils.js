
export const repeat = (char, length) => {
    return Array(Math.max(0, length + 1)).join(char);
}
export const padLeft = (char, txt, size) => {
    if ( txt === undefined ) { txt = ""; }
    txt = txt.toString();
    return repeat(char, size - txt.length) + txt;
}
export const padRight = (char, txt, size) => {
    if (txt === undefined) { txt = ""; }
    txt = txt.toString();
    return txt + repeat(char, size - txt.length);
}