function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function randomColorFromString(str) {
  let code = hashCode(str);
  let hash = (code & 0x00ffffff).toString(16).toUpperCase();
  let colorCode = '00000'.substring(0, 6 - hash.length) + hash;
  return '#' + colorCode;
}
