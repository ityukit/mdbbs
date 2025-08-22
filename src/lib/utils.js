export default {
  parseSafeInt: function(s, defaultValue){
    const def = defaultValue || 0;
    const value = parseInt(s, 10);
    if (Number.isNaN(value)) return def;
    if (!Number.isSafeInteger(value)) return def;
    if (value.toString() !== s) return def;
    return value;
  }

};