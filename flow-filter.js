module.exports = function(f, stat) {
    let allow = f.search(/\.js$/) > -1;
    console.log(f, allow);
    return stat.isDirectory() || allow;
}